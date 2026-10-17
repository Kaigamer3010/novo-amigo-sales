<?php
namespace App\Http\Controllers;

use App\Models\Emprestimo;
use App\Models\Exemplar;
use App\Models\Livro;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class LivroController extends Controller
{
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

        $quantidadeSalva = (int) (
            $livro->getAttribute('quantidade_exemplares') ?? 0
        );

        $resultado['quantidade_exemplares'] = (int) $total > 0
            ? (int) $total
            : max(1, $quantidadeSalva);

        $resultado['disponibilidade'] = (int) $disponiveis > 0;
        $resultado['ativo'] = (bool) ($livro->ativo ?? true);

        return $resultado;
    }

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

    public function show($id)
    {
        $livro = Livro::where('ativo', true)
            ->with('generos')
            ->withCount($this->contagensExemplares())
            ->findOrFail($id);

        return response()->json($this->formatarLivro($livro));
    }

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
        $dados['disponibilidade'] = true;

        $livro = DB::transaction(function () use (
            $dados,
            $generos,
            $quantidade
        ) {
            $livro = Livro::create($dados);
            $livro->ativo = true;
            $livro->save();

            if (!empty($generos)) {
                $livro->generos()->sync($generos);
            }

            for ($i = 1; $i <= $quantidade; $i++) {
                Exemplar::create([
                    'livro_id' => $livro->id,
                    'codigo' => sprintf(
                        'LIV-%04d-EX-%03d',
                        $livro->id,
                        $i
                    ),
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
            'quantidade_exemplares' => [
                'sometimes',
                'required',
                'integer',
                'min:1',
            ],
            'localizacoes' => ['sometimes', 'nullable', 'string', 'max:255'],
            'generos' => ['sometimes', 'nullable', 'array'],
            'generos.*' => ['integer', 'distinct', 'exists:generos,id'],
        ]);

        $generos = $dados['generos'] ?? null;
        unset($dados['generos'], $dados['disponibilidade']);

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

    public function destroy($id)
    {
        Gate::authorize('gerenciar-biblioteca');

        return DB::transaction(function () use ($id) {
            $livro = Livro::whereKey($id)
                ->lockForUpdate()
                ->firstOrFail();

            /*
             * REGRA 1:
             * Não permitir excluir nem arquivar um livro que ainda
             * tenha algum empréstimo sem devolução registrada.
             *
             * Verificamos tanto os empréstimos vinculados diretamente
             * ao livro quanto os vinculados aos exemplares dele.
             */
            $temEmprestimoEmAberto = Emprestimo::where('livro_id', $livro->id)
                ->whereNull('data_devolucao')
                ->exists()
                || $livro->exemplares()
                    ->whereHas('emprestimos', function ($query) {
                        $query->whereNull('data_devolucao');
                    })
                    ->exists();

            if ($temEmprestimoEmAberto) {
                return response()->json([
                    'erro' => 'Não é possível excluir este livro porque existe um empréstimo em aberto. Registre a devolução antes de excluí-lo.',
                ], 422);
            }

            /*
             * REGRA 2:
             * Se existir histórico de empréstimos já finalizados,
             * arquivamos o livro para preservar o histórico.
             */
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

            /*
             * REGRA 3:
             * Se não houver empréstimos abertos nem histórico,
             * podemos excluir o livro e seus exemplares.
             */
            $livro->generos()->detach();
            $livro->exemplares()->delete();
            $livro->delete();

            return response()->json([
                'mensagem' => 'Livro excluído com sucesso!',
                'arquivado' => false,
            ]);
        });
    }

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

            if (strlen($numero) === 10) {
                $base13 = '978' . substr($numero, 0, 9);
                $soma = 0;

                for ($i = 0; $i < 12; $i++) {
                    $soma += (int) $base13[$i]
                        * (($i % 2 === 0) ? 1 : 3);
                }

                $isbns[] = $base13 . ((10 - ($soma % 10)) % 10);
            } elseif (str_starts_with($numero, '978')) {
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

            $livro = [
                'titulo' => '',
                'sinopse' => '',
                'autores' => [],
                'ano_publicacao' => '',
                'imagem' => '',
                'isbn' => $numero,
            ];

            $preencher = function (array $dados) use (&$livro) {
                foreach ([
                    'titulo',
                    'sinopse',
                    'ano_publicacao',
                    'imagem',
                ] as $campo) {
                    if (
                        empty($livro[$campo])
                        && isset($dados[$campo])
                        && is_string($dados[$campo])
                        && trim($dados[$campo]) !== ''
                    ) {
                        $livro[$campo] = trim($dados[$campo]);
                    }
                }

                if (empty($livro['autores']) && !empty($dados['autores'])) {
                    $autores = is_array($dados['autores'])
                        ? $dados['autores']
                        : [$dados['autores']];

                    $livro['autores'] = array_values(array_unique(
                        array_filter(
                            array_map(
                                fn ($autor) => is_string($autor)
                                    ? trim($autor)
                                    : (is_array($autor)
                                        ? trim($autor['name'] ?? '')
                                        : ''),
                                $autores
                            ),
                            fn ($autor) => $autor !== ''
                        )
                    ));
                }
            };

            // BrasilAPI
            foreach ($isbns as $isbnBusca) {
                try {
                    $resposta = Http::connectTimeout(2)
                        ->timeout(5)
                        ->acceptJson()
                        ->get(
                            "https://brasilapi.com.br/api/isbn/v1/{$isbnBusca}"
                        );

                    if ($resposta->successful()) {
                        $dados = $resposta->json() ?? [];
                        $ano = (string) ($dados['year'] ?? '');

                        $preencher([
                            'titulo' => $dados['title'] ?? '',
                            'sinopse' => $dados['synopsis'] ?? '',
                            'autores' => $dados['authors'] ?? [],
                            'ano_publicacao' => preg_match(
                                '/\b(?:18|19|20|21)\d{2}\b/',
                                $ano,
                                $matches
                            ) ? $matches[0] : '',
                            'imagem' => $dados['cover_url'] ?? '',
                        ]);
                    }
                } catch (\Throwable $e) {
                }
            }

            // Google Books
            if (!empty($chave)) {
                foreach ($isbns as $isbnBusca) {
                    try {
                        $resposta = Http::connectTimeout(2)
                        ->timeout(4)
                        ->acceptJson()
                        ->get(
                            'https://www.googleapis.com/books/v1/volumes',
                            [
                                'q' => "isbn:{$isbnBusca}",
                                'key' => $chave,
                                'maxResults' => 5,
                            ]
                        );

                        if (!$resposta->successful()) {
                            continue;
                        }

                        foreach ($resposta->json('items', []) as $item) {
                            $info = $item['volumeInfo'] ?? [];

                            if (empty($info['title'])) {
                                continue;
                            }

                            $ano = (string) ($info['publishedDate'] ?? '');

                            $preencher([
                                'titulo' => $info['title'] ?? '',
                                'sinopse' => $info['description'] ?? '',
                                'autores' => $info['authors'] ?? [],
                                'ano_publicacao' => preg_match(
                                    '/\b(?:18|19|20|21)\d{2}\b/',
                                    $ano,
                                    $matches
                                ) ? $matches[0] : '',
                                'imagem' => $info['imageLinks']['thumbnail']
                                    ?? $info['imageLinks']['smallThumbnail']
                                    ?? '',
                            ]);

                            if (
                                !empty($livro['titulo'])
                                && !empty($livro['autores'])
                                && !empty($livro['ano_publicacao'])
                                && !empty($livro['sinopse'])
                                && !empty($livro['imagem'])
                            ) {
                                break 2;
                            }
                        }
                    } catch (\Throwable $e) {
                    }
                }
            }

            // Open Library
            try {
                $bibkeys = implode(',', array_map(
                    fn ($item) => "ISBN:{$item}",
                    $isbns
                ));

                $resposta = Http::connectTimeout(2)
                    ->timeout(5)
                    ->withHeaders(['User-Agent' => 'JornalSales/1.0'])
                    ->get('https://openlibrary.org/api/books', [
                        'bibkeys' => $bibkeys,
                        'jscmd' => 'data',
                        'format' => 'json',
                    ]);

                if ($resposta->successful()) {
                    $resultados = $resposta->json() ?? [];

                    foreach ($isbns as $isbnBusca) {
                        $dados = $resultados["ISBN:{$isbnBusca}"] ?? [];

                        if (empty($dados['title'])) {
                            continue;
                        }

                        $autores = array_map(
                            fn ($autor) => $autor['name'] ?? '',
                            $dados['authors'] ?? []
                        );

                        $data = (string) ($dados['publish_date'] ?? '');

                        $ano = preg_match(
                            '/\b(?:18|19|20|21)\d{2}\b/',
                            $data,
                            $matches
                        ) ? $matches[0] : '';

                        $sinopse = $dados['description']
                            ?? $dados['notes']
                            ?? '';

                        if (is_array($sinopse)) {
                            $sinopse = $sinopse['value']
                                ?? $sinopse['text']
                                ?? '';
                        }

                        $preencher([
                            'titulo' => $dados['title'] ?? '',
                            'sinopse' => is_string($sinopse)
                                ? strip_tags($sinopse)
                                : '',
                            'autores' => $autores,
                            'ano_publicacao' => $ano,
                            'imagem' => $dados['cover']['large']
                                ?? $dados['cover']['medium']
                                ?? $dados['cover']['small']
                                ?? '',
                        ]);
                    }
                }
            } catch (\Throwable $e) {
            }

            // Open Library Search
            foreach ($isbns as $isbnBusca) {
                try {
                    $resposta = Http::connectTimeout(2)
                        ->timeout(5)
                        ->withHeaders(['User-Agent' => 'JornalSales/1.0'])
                        ->get('https://openlibrary.org/search.json', [
                            'isbn' => $isbnBusca,
                            'fields' => 'title,author_name,first_publish_year,cover_i',
                            'limit' => 5,
                        ]);

                    if (!$resposta->successful()) {
                        continue;
                    }

                    foreach ($resposta->json('docs', []) as $dados) {
                        if (empty($dados['title'])) {
                            continue;
                        }

                        $imagem = !empty($dados['cover_i'])
                            ? 'https://covers.openlibrary.org/b/id/'
                                . $dados['cover_i'] . '-L.jpg'
                            : '';

                        $preencher([
                            'titulo' => $dados['title'] ?? '',
                            'autores' => $dados['author_name'] ?? [],
                            'ano_publicacao' => isset($dados['first_publish_year'])
                                ? (string) $dados['first_publish_year']
                                : '',
                            'imagem' => $imagem,
                        ]);

                        if (
                            !empty($livro['titulo'])
                            && !empty($livro['autores'])
                            && !empty($livro['ano_publicacao'])
                            && !empty($livro['sinopse'])
                            && !empty($livro['imagem'])
                        ) {
                            break 2;
                        }
                    }
                } catch (\Throwable $e) {
                }
            }

            // Crossref
            foreach ($isbns as $isbnBusca) {
                try {
                    $resposta = Http::connectTimeout(2)
                        ->timeout(5)
                        ->acceptJson()
                        ->get('https://api.crossref.org/works', [
                            'filter' => "isbn:{$isbnBusca}",
                            'rows' => 5,
                        ]);

                    if (!$resposta->successful()) {
                        continue;
                    }

                    foreach ($resposta->json('message.items', []) as $dados) {
                        $titulo = $dados['title'][0] ?? '';

                        if ($titulo === '') {
                            continue;
                        }

                        $autores = array_map(
                            fn ($autor) => trim(
                                ($autor['given'] ?? '') . ' '
                                . ($autor['family'] ?? '')
                            ),
                            $dados['author'] ?? []
                        );

                        $data = $dados['published-print']['date-parts'][0]
                            ?? $dados['published-online']['date-parts'][0]
                            ?? $dados['created']['date-parts'][0]
                            ?? [];

                        $ano = isset($data[0]) ? (string) $data[0] : '';

                        $preencher([
                            'titulo' => $titulo,
                            'autores' => $autores,
                            'ano_publicacao' => $ano,
                            'sinopse' => isset($dados['abstract'])
                                ? strip_tags($dados['abstract'])
                                : '',
                        ]);

                        if (
                            !empty($livro['titulo'])
                            && !empty($livro['autores'])
                            && !empty($livro['ano_publicacao'])
                            && !empty($livro['sinopse'])
                            && !empty($livro['imagem'])
                        ) {
                            break 2;
                        }
                    }
                } catch (\Throwable $e) {
                }
            }

            if (empty($livro['titulo'])) {
                return response()->json([
                    'erro' => 'Livro não encontrado. Você pode preencher os dados manualmente.',
                ], 404);
            }

            return response()->json($livro);
        } catch (\Throwable $e) {
            \Log::error('Erro ao buscar livro por ISBN', [
                'mensagem' => $e->getMessage(),
            ]);

            return response()->json([
                'erro' => 'Erro ao consultar as fontes de livros.',
            ], 500);
        }
    }

    public function buscarPorTitulo($titulo)
    {
        $termo = trim((string) $titulo);

        if (mb_strlen($termo) < 2) {
            return response()->json([
                'erro' => 'Digite pelo menos 2 caracteres do título.',
            ], 422);
        }

        try {
            $livros = [];

            // Google Books
            $parametros = [
                'q' => 'intitle:' . $termo,
                'maxResults' => 5,
                'printType' => 'books',
            ];

            $chave = env('GOOGLE_BOOKS_API_KEY');

            if (!empty($chave)) {
                $parametros['key'] = $chave;
            }

            try {
                $resposta = Http::connectTimeout(2)
                    ->timeout(5)
                    ->acceptJson()
                    ->get(
                        'https://www.googleapis.com/books/v1/volumes',
                        $parametros
                    );

                if ($resposta->successful()) {
                    foreach ($resposta->json('items', []) as $item) {
                        $info = $item['volumeInfo'] ?? [];

                        if (empty($info['title'])) {
                            continue;
                        }

                        $isbn = '';

                        foreach ($info['industryIdentifiers'] ?? [] as $identificador) {
                            if (
                                in_array(
                                    $identificador['type'] ?? '',
                                    ['ISBN_13', 'ISBN_10'],
                                    true
                                )
                            ) {
                                $isbn = $identificador['identifier'] ?? '';

                                if (($identificador['type'] ?? '') === 'ISBN_13') {
                                    break;
                                }
                            }
                        }

                        $data = (string) ($info['publishedDate'] ?? '');

                        $ano = preg_match(
                            '/\b(?:18|19|20|21)\d{2}\b/',
                            $data,
                            $matches
                        ) ? $matches[0] : '';

                        $livros[] = [
                            'titulo' => $info['title'],
                            'sinopse' => $info['description'] ?? '',
                            'autores' => $info['authors'] ?? [],
                            'ano_publicacao' => $ano,
                            'imagem' => $info['imageLinks']['thumbnail']
                                ?? $info['imageLinks']['smallThumbnail']
                                ?? '',
                            'isbn' => $isbn,
                        ];
                    }
                }
            } catch (\Throwable $e) {
            }

            // Open Library
            if (count($livros) < 5) {
                try {
                    $resposta = Http::connectTimeout(2)
                        ->timeout(5)
                        ->withHeaders(['User-Agent' => 'JornalSales/1.0'])
                        ->get('https://openlibrary.org/search.json', [
                            'title' => $termo,
                            'fields' => 'title,author_name,first_publish_year,cover_i,isbn',
                            'limit' => 5,
                        ]);

                    if ($resposta->successful()) {
                        foreach ($resposta->json('docs', []) as $dados) {
                            if (empty($dados['title'])) {
                                continue;
                            }

                            $isbn = $dados['isbn'][0] ?? '';

                            $imagem = !empty($dados['cover_i'])
                                ? 'https://covers.openlibrary.org/b/id/'
                                    . $dados['cover_i'] . '-L.jpg'
                                : '';

                            $ano = isset($dados['first_publish_year'])
                                ? (string) $dados['first_publish_year']
                                : '';

                            $livros[] = [
                                'titulo' => $dados['title'],
                                'sinopse' => '',
                                'autores' => $dados['author_name'] ?? [],
                                'ano_publicacao' => $ano,
                                'imagem' => $imagem,
                                'isbn' => $isbn,
                            ];
                        }
                    }
                } catch (\Throwable $e) {
                }
            }

            $livros = collect($livros)
                ->unique(fn ($livro) => mb_strtolower(
                    $livro['titulo'] . '|' . $livro['isbn']
                ))
                ->values()
                ->all();

            if (empty($livros)) {
                return response()->json([
                    'erro' => 'Nenhum livro encontrado com esse título. Tente outro termo ou preencha os dados manualmente.',
                ], 404);
            }

            return response()->json($livros);
        } catch (\Throwable $e) {
            \Log::error('Erro ao buscar livro por título', [
                'mensagem' => $e->getMessage(),
            ]);

            return response()->json([
                'erro' => 'Não foi possível consultar as fontes de livros.',
            ], 500);
        }
    }
}