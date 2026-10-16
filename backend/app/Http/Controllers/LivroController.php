<?php
namespace App\Http\Controllers;

use App\Models\Exemplar;
use App\Models\Livro;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class LivroController extends Controller
{
    /**
     * Contagens feitas diretamente na tabela de exemplares.
     */
    private function contagensExemplares(): array
    {
        return [
            'exemplares as total_exemplares',

            'exemplares as quantidade_disponivel' =>
                fn ($query) => $query->where('status', 'disponivel'),

            'exemplares as quantidade_emprestada' =>
                fn ($query) => $query->where('status', 'emprestado'),
        ];
    }

    /**
     * Formata um livro para a API.
     */
    private function formatarLivro(Livro $livro): array
    {
        $livro->loadMissing('generos');

        $total = $livro->getAttribute('total_exemplares');
        $disponiveis = $livro->getAttribute('quantidade_disponivel');
        $emprestados = $livro->getAttribute('quantidade_emprestada');

        if ($total === null) {
            $total = $livro->exemplares()->count();
        }

        if ($disponiveis === null) {
            $disponiveis = $livro->exemplares()
                ->where('status', 'disponivel')
                ->count();
        }

        if ($emprestados === null) {
            $emprestados = $livro->exemplares()
                ->where('status', 'emprestado')
                ->count();
        }

        $resultado = $livro->toArray();

        // Envia os IDs e nomes dos gêneros para permitir edição.
        $resultado['generos'] = $livro->generos
            ->map(fn ($genero) => [
                'id' => (int) $genero->id,
                'genero' => $genero->genero,
            ])
            ->values()
            ->all();

        $resultado['total_exemplares'] = (int) $total;
        $resultado['quantidade_disponivel'] = (int) $disponiveis;
        $resultado['quantidade_emprestada'] = (int) $emprestados;

        // Usa o total real quando já existem exemplares cadastrados.
        // Para livros antigos ainda sem exemplares, mantém a quantidade
        // originalmente armazenada para facilitar sua regularização.
        $quantidadeSalva = (int) ($livro->getAttribute('quantidade_exemplares') ?? 0);

        $resultado['quantidade_exemplares'] = (int) $total > 0
            ? (int) $total
            : max(1, $quantidadeSalva);

        $resultado['disponibilidade'] = (int) $disponiveis > 0;
        $resultado['ativo'] = (bool) ($livro->ativo ?? true);

        return $resultado;
    }

    /**
     * Lista somente os livros ativos no catálogo.
     */
    public function index()
    {
        $livros = Livro::where('ativo', true)
            ->with('generos')
            ->withCount($this->contagensExemplares())
            ->orderByDesc('id')
            ->get();

        return response()->json(
            $livros->map(fn ($livro) => $this->formatarLivro($livro))
                ->values()
        );
    }

    /**
     * Consulta um livro ativo.
     */
    public function show($id)
    {
        $livro = Livro::where('ativo', true)
            ->with('generos')
            ->withCount($this->contagensExemplares())
            ->findOrFail($id);

        return response()->json($this->formatarLivro($livro));
    }

    /**
     * Cadastra um livro e cria seus exemplares físicos.
     */
    public function store(Request $request)
    {
        Gate::authorize('gerenciar-biblioteca');

        $dados = $request->validate([
            'titulo' => ['required', 'string', 'max:255'],
            'isbn' => ['required', 'string', 'max:255', 'unique:livros,isbn'],
            'ano_publicacao' => ['required', 'digits:4'],
            'autores' => ['nullable', 'array'],
            'autores.*' => ['string', 'max:255'],
            'sinopse' => ['nullable', 'string'],
            'imagem' => ['nullable', 'string', 'max:2048'],
            'categoria' => ['nullable', 'string', 'max:255'],
            'disponibilidade' => ['sometimes', 'boolean'],
            'quantidade_exemplares' => ['required', 'integer', 'min:1'],
            'localizacoes' => ['nullable', 'string', 'max:255'],
            'generos' => ['nullable', 'array'],
            'generos.*' => ['integer', 'distinct', 'exists:generos,id'],
        ]);

        $generos = $dados['generos'] ?? [];
        unset($dados['generos']);

        $quantidade = (int) $dados['quantidade_exemplares'];

        // A disponibilidade real será derivada do estado dos exemplares.
        $dados['disponibilidade'] = true;

        $livro = DB::transaction(function () use (
            $dados,
            $generos,
            $quantidade
        ) {
            $livro = Livro::create($dados);

            // Livros novos entram ativos no catálogo.
            $livro->ativo = true;
            $livro->save();

            if (!empty($generos)) {
                $livro->generos()->sync($generos);
            }

            for ($i = 1; $i <= $quantidade; $i++) {
                Exemplar::create([
                    'livro_id' => $livro->id,
                    'codigo' => sprintf('LIV-%04d-EX-%03d', $livro->id, $i),
                    'localizacao' => $livro->localizacoes,
                    'status' => 'disponivel',
                ]);
            }

            $livro->update([
                'quantidade_exemplares' => $quantidade,
                'disponibilidade' => true,
            ]);

            return $livro->fresh()
                ->load('generos')
                ->loadCount($this->contagensExemplares());
        });

        return response()->json($this->formatarLivro($livro), 201);
    }

    /**
     * Atualiza os dados de um livro e sincroniza seus exemplares.
     */
    public function update(Request $request, $id)
    {
        Gate::authorize('gerenciar-biblioteca');

        $dados = $request->validate([
            'titulo' => ['sometimes', 'required', 'string', 'max:255'],
            'isbn' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                'unique:livros,isbn,' . $id,
            ],
            'ano_publicacao' => ['sometimes', 'required', 'digits:4'],
            'autores' => ['sometimes', 'nullable', 'array'],
            'autores.*' => ['string', 'max:255'],
            'sinopse' => ['sometimes', 'nullable', 'string'],
            'imagem' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'categoria' => ['sometimes', 'nullable', 'string', 'max:255'],
            'disponibilidade' => ['sometimes', 'boolean'],
            'quantidade_exemplares' => ['sometimes', 'required', 'integer', 'min:1'],
            'localizacoes' => ['sometimes', 'nullable', 'string', 'max:255'],
            'generos' => ['sometimes', 'nullable', 'array'],
            'generos.*' => ['integer', 'distinct', 'exists:generos,id'],
        ]);

        $generos = $dados['generos'] ?? null;
        unset($dados['generos']);

        // A disponibilidade não pode ser alterada manualmente.
        unset($dados['disponibilidade']);

        $livroAtualizado = DB::transaction(function () use (
            $dados,
            $generos,
            $id
        ) {
            $livro = Livro::where('ativo', true)
                ->whereKey($id)
                ->lockForUpdate()
                ->firstOrFail();

            $totalAntes = $livro->exemplares()->count();

            $quantidadeDesejada = array_key_exists(
                'quantidade_exemplares',
                $dados
            )
                ? (int) $dados['quantidade_exemplares']
                : max(
                    1,
                    $totalAntes ?: (int) $livro->quantidade_exemplares
                );

            unset($dados['quantidade_exemplares']);

            $livro->fill($dados);
            $livro->save();

            if ($generos !== null) {
                $livro->generos()->sync($generos);
            }

            $totalAtual = $livro->exemplares()->count();

            // Não exclui exemplares que tenham histórico de empréstimos.
            if ($quantidadeDesejada < $totalAtual) {
                $remover = $totalAtual - $quantidadeDesejada;

                $candidatos = $livro->exemplares()
                    ->where('status', 'disponivel')
                    ->whereDoesntHave('emprestimos')
                    ->orderByDesc('id')
                    ->lockForUpdate()
                    ->limit($remover)
                    ->get();

                if ($candidatos->count() < $remover) {
                    throw ValidationException::withMessages([
                        'quantidade_exemplares' => [
                            'Não é possível reduzir a quantidade porque alguns exemplares estão emprestados ou têm histórico de empréstimos.',
                        ],
                    ]);
                }

                foreach ($candidatos as $exemplar) {
                    $exemplar->delete();
                }
            }

            // Completa os exemplares se a quantidade tiver aumentado
            // ou se o livro antigo ainda não tiver cópias cadastradas.
            $totalAtual = $livro->exemplares()->count();
            $sequencia = 1;

            while ($totalAtual < $quantidadeDesejada) {
                $codigo = sprintf(
                    'LIV-%04d-EX-%03d',
                    $livro->id,
                    $sequencia
                );

                $sequencia++;

                if (Exemplar::where('codigo', $codigo)->exists()) {
                    continue;
                }

                Exemplar::create([
                    'livro_id' => $livro->id,
                    'codigo' => $codigo,
                    'localizacao' => $livro->localizacoes,
                    'status' => 'disponivel',
                ]);

                $totalAtual++;
            }

            // Sincroniza a localização das cópias físicas.
            $livro->exemplares()->update([
                'localizacao' => $livro->localizacoes,
            ]);

            $totalReal = $livro->exemplares()->count();

            $temDisponivel = $livro->exemplares()
                ->where('status', 'disponivel')
                ->exists();

            $livro->update([
                'quantidade_exemplares' => $totalReal,
                'disponibilidade' => $temDisponivel,
            ]);

            return $livro->fresh()
                ->load('generos')
                ->loadCount($this->contagensExemplares());
        });

        return response()->json($this->formatarLivro($livroAtualizado));
    }

    /**
     * Exclui livros sem histórico ou arquiva livros com histórico.
     */
    public function destroy($id)
    {
        Gate::authorize('gerenciar-biblioteca');

        return DB::transaction(function () use ($id) {
            $livro = Livro::whereKey($id)
                ->lockForUpdate()
                ->firstOrFail();

            $temHistorico = $livro->emprestimos()->exists()
                || $livro->exemplares()
                    ->whereHas('emprestimos')
                    ->exists();

            if ($temHistorico) {
                $livro->ativo = false;
                $livro->save();

                return response()->json([
                    'mensagem' => 'Livro retirado do catálogo. O histórico de empréstimos e devoluções foi preservado.',
                    'arquivado' => true,
                ]);
            }

            $livro->generos()->detach();
            $livro->exemplares()->delete();
            $livro->delete();

            return response()->json([
                'mensagem' => 'Livro excluído com sucesso!',
                'arquivado' => false,
            ]);
        });
    }

    /**
     * Busca dados bibliográficos pelo ISBN.
     */
    public function buscarPorIsbn($isbn)
    {
        $chave = env('GOOGLE_BOOKS_API_KEY');
        $numero = preg_replace('/[^0-9X]/', '', strtoupper((string) $isbn));

        if (!in_array(strlen($numero), [10, 13], true)) {
            return response()->json([
                'erro' => 'Digite um ISBN válido de 10 ou 13 dígitos.',
            ], 422);
        }

        try {
            $isbns = [$numero];

            // Converte ISBN-10 para ISBN-13.
            if (strlen($numero) === 10) {
                $base13 = '978' . substr($numero, 0, 9);
                $soma = 0;

                for ($i = 0; $i < 12; $i++) {
                    $peso = ($i % 2 === 0) ? 1 : 3;
                    $soma += (int) $base13[$i] * $peso;
                }

                $isbns[] = $base13 . ((10 - ($soma % 10)) % 10);
            } elseif (str_starts_with($numero, '978')) {
                // Converte ISBN-13 para ISBN-10 quando possível.
                $base10 = substr($numero, 3, 9);
                $soma = 0;

                for ($i = 0; $i < 9; $i++) {
                    $soma += (int) $base10[$i] * (10 - $i);
                }

                $resto = 11 - ($soma % 11);

                $digito10 = match ($resto) {
                    10 => 'X',
                    11 => '0',
                    default => (string) $resto,
                };

                $isbns[] = $base10 . $digito10;
            }

            $isbns = array_values(array_unique($isbns));
            $fonteRespondeu = false;

            // 1. Google Books.
            if (!empty($chave)) {
                foreach ($isbns as $isbnBusca) {
                    try {
                        $resposta = Http::connectTimeout(2)
                            ->timeout(3)
                            ->acceptJson()
                            ->get(
                                'https://www.googleapis.com/books/v1/volumes',
                                [
                                    'q' => "isbn:{$isbnBusca}",
                                    'key' => $chave,
                                ]
                            );

                        if (!$resposta->successful()) {
                            \Log::warning('Google Books retornou erro', [
                                'isbn' => $isbnBusca,
                                'status' => $resposta->status(),
                            ]);

                            continue;
                        }

                        $fonteRespondeu = true;
                        $dadosGoogle = $resposta->json() ?? [];
                        $info = $dadosGoogle['items'][0]['volumeInfo'] ?? null;

                        if (!$info || empty($info['title'])) {
                            continue;
                        }

                        $ano = $info['publishedDate'] ?? '';

                        return response()->json([
                            'titulo' => $info['title'],
                            'sinopse' => $info['description'] ?? '',
                            'autores' => $info['authors'] ?? [],
                            'ano_publicacao' => substr($ano, 0, 4),
                            'imagem' => $info['imageLinks']['thumbnail'] ?? '',
                            'isbn' => $isbn,
                        ]);
                    } catch (\Throwable $e) {
                        \Log::warning('Falha no Google Books', [
                            'mensagem' => $e->getMessage(),
                        ]);
                    }
                }
            }

            // 2. Open Library: consulta direta pelo ISBN.
            try {
                $bibkeys = implode(',', array_map(
                    fn ($item) => "ISBN:{$item}",
                    $isbns
                ));

                $respostaOpen = Http::connectTimeout(2)
                    ->timeout(4)
                    ->withHeaders([
                        'User-Agent' => 'JornalSales/1.0',
                    ])
                    ->get('https://openlibrary.org/api/books', [
                        'bibkeys' => $bibkeys,
                        'jscmd' => 'data',
                        'format' => 'json',
                    ]);

                if ($respostaOpen->successful()) {
                    $fonteRespondeu = true;
                    $resultados = $respostaOpen->json() ?? [];

                    foreach ($isbns as $isbnBusca) {
                        $livroEncontrado = $resultados["ISBN:{$isbnBusca}"] ?? null;

                        if (!$livroEncontrado || empty($livroEncontrado['title'])) {
                            continue;
                        }

                        $autores = array_values(array_filter(array_map(
                            fn ($autor) => $autor['name'] ?? '',
                            $livroEncontrado['authors'] ?? []
                        )));

                        $data = (string) ($livroEncontrado['publish_date'] ?? '');
                        $ano = preg_match(
                            '/\b(?:18|19|20|21)\d{2}\b/',
                            $data,
                            $matches
                        ) ? $matches[0] : '';

                        $sinopse = $livroEncontrado['description']
                            ?? $livroEncontrado['notes']
                            ?? '';

                        if (is_array($sinopse)) {
                            $sinopse = $sinopse['value']
                                ?? $sinopse['text']
                                ?? '';
                        }

                        $imagem = $livroEncontrado['cover']['medium']
                            ?? $livroEncontrado['cover']['large']
                            ?? $livroEncontrado['cover']['small']
                            ?? '';

                        return response()->json([
                            'titulo' => $livroEncontrado['title'],
                            'sinopse' => is_string($sinopse) ? $sinopse : '',
                            'autores' => $autores,
                            'ano_publicacao' => $ano,
                            'imagem' => $imagem,
                            'isbn' => $isbn,
                        ]);
                    }
                }
            } catch (\Throwable $e) {
                \Log::warning('Falha na consulta direta à Open Library', [
                    'mensagem' => $e->getMessage(),
                ]);
            }

            // 3. Última tentativa: pesquisa no catálogo Open Library.
            foreach ($isbns as $isbnBusca) {
                try {
                    $busca = Http::connectTimeout(2)
                        ->timeout(4)
                        ->withHeaders([
                            'User-Agent' => 'JornalSales/1.0',
                        ])
                        ->get('https://openlibrary.org/search.json', [
                            'isbn' => $isbnBusca,
                            'fields' => 'title,author_name,first_publish_year,cover_i',
                            'limit' => 1,
                        ]);

                    if (!$busca->successful()) {
                        continue;
                    }

                    $fonteRespondeu = true;
                    $documento = $busca->json('docs.0');

                    if (!$documento || empty($documento['title'])) {
                        continue;
                    }

                    $imagem = !empty($documento['cover_i'])
                        ? 'https://covers.openlibrary.org/b/id/'
                            . $documento['cover_i'] . '-L.jpg'
                        : '';

                    return response()->json([
                        'titulo' => $documento['title'],
                        'sinopse' => '',
                        'autores' => $documento['author_name'] ?? [],
                        'ano_publicacao' => isset($documento['first_publish_year'])
                            ? (string) $documento['first_publish_year']
                            : '',
                        'imagem' => $imagem,
                        'isbn' => $isbn,
                    ]);
                } catch (\Throwable $e) {
                    \Log::warning('Falha na busca do catálogo Open Library', [
                        'mensagem' => $e->getMessage(),
                    ]);
                }
            }

            if (!$fonteRespondeu) {
                return response()->json([
                    'erro' => 'As fontes de livros estão indisponíveis. Tente novamente.',
                ], 503);
            }

            return response()->json([
                'erro' => 'Livro não encontrado. Você pode preencher os dados manualmente.',
            ], 404);
        } catch (\Throwable $e) {
            \Log::error('Erro ao buscar livro por ISBN', [
                'mensagem' => $e->getMessage(),
            ]);

            return response()->json([
                'erro' => 'Erro ao consultar as fontes de livros.',
            ], 500);
        }
    }
}
