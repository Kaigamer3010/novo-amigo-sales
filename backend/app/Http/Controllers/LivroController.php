<?php

namespace App\Http\Controllers;

use App\Models\Livro;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Gate;

class LivroController extends Controller
{
    public function index()
    {
        $livros = Livro::with('generos')->withCount([
            'emprestimos as quantidade_emprestada' => function ($query) {
                $query->whereNull('data_devolucao');
            }
        ])->get();

        $livrosFormatados = $livros->map(function ($livro) {
            $livroArray = $livro->toArray();

            $livroArray['generos'] = $livro->generos->pluck('genero');
            $livroArray['quantidade_exemplares'] =
                $livro->quantidade_exemplares ?? 1;

            $livroArray['quantidade_emprestada'] =
                $livro->quantidade_emprestada;

            $livroArray['quantidade_disponivel'] = max(
                0,
                $livroArray['quantidade_exemplares']
                    - $livroArray['quantidade_emprestada']
            );

            return $livroArray;
        });

        return response()->json($livrosFormatados);
    }

    public function show($id)
    {
        $livro = Livro::with('generos')->findOrFail($id);

        $livroFormatado = $livro->toArray();
        $livroFormatado['generos'] =
            $livro->generos->pluck('genero');

        return response()->json($livroFormatado);
    }

    public function store(Request $request)
    {
        if (Gate::denies('gerenciar-biblioteca')) {
            return response()->json([
                'erro' => 'Sem permissão'
            ], 403);
        }

        $dados = $request->validate([
            'titulo' => 'required|string|max:255',
            'isbn' => 'required|string|unique:livros,isbn',
            'ano_publicacao' => 'required|digits:4',
            'autores' => 'nullable|array',
            'autores.*' => 'string',
            'sinopse' => 'nullable|string',
            'imagem' => 'nullable|string',
            'categoria' => 'nullable|string|max:255',
            'disponibilidade' => 'required|boolean',
            'quantidade_exemplares' => 'required|integer|min:1',
            'localizacoes' => 'nullable|string|max:255',
            'generos' => 'nullable|array',
            'generos.*' => 'integer|exists:generos,id',
        ]);

        $generos = $dados['generos'] ?? [];
        unset($dados['generos']);

        $livro = Livro::create($dados);

        if (!empty($generos)) {
            $livro->generos()->attach($generos);
        }

        $livro->load('generos');

        return response()->json($livro, 201);
    }

    public function update(Request $request, $id)
    {
        if (Gate::denies('gerenciar-biblioteca')) {
            return response()->json([
                'erro' => 'Sem permissão'
            ], 403);
        }

        $livro = Livro::findOrFail($id);

        $dados = $request->validate([
            'titulo' => 'sometimes|required|string|max:255',
            'isbn' => 'sometimes|required|string|unique:livros,isbn,' . $livro->id,
            'ano_publicacao' => 'sometimes|required|digits:4',
            'autores' => 'sometimes|nullable|array',
            'autores.*' => 'string',
            'sinopse' => 'sometimes|nullable|string',
            'imagem' => 'sometimes|nullable|string',
            'categoria' => 'sometimes|nullable|string|max:255',
            'disponibilidade' => 'sometimes|required|boolean',
            'quantidade_exemplares' => 'sometimes|required|integer|min:1',
            'localizacoes' => 'sometimes|nullable|string|max:255',
            'generos' => 'sometimes|array',
            'generos.*' => 'integer|exists:generos,id',
        ]);

        $generos = $dados['generos'] ?? null;
        unset($dados['generos']);

        $livro->update($dados);

        if ($generos !== null) {
            $livro->generos()->sync($generos);
        }

        $livro->load('generos');

        $livroFormatado = $livro->toArray();
        $livroFormatado['generos'] =
            $livro->generos->pluck('genero');

        return response()->json($livroFormatado);
    }

    public function destroy($id)
    {
        if (Gate::denies('gerenciar-biblioteca')) {
            return response()->json([
                'erro' => 'Sem permissão'
            ], 403);
        }

        $livro = Livro::findOrFail($id);
        $livro->delete();

        return response()->json([
            'mensagem' => 'Removido com sucesso'
        ]);
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
        // Prepara o ISBN original e seu formato equivalente.
        $isbns = [$numero];

        if (strlen($numero) === 10) {
            $base13 = '978' . substr($numero, 0, 9);
            $soma = 0;

            for ($i = 0; $i < 12; $i++) {
                $peso = ($i % 2 === 0) ? 1 : 3;
                $soma += (int) $base13[$i] * $peso;
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
        $fonteRespondeu = false;

        /*
         * 1. PRIMEIRO: GOOGLE BOOKS
         */
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
                    $dados = $resposta->json() ?? [];
                    $info = $dados['items'][0]['volumeInfo'] ?? null;

                    if (!$info || empty($info['title'])) {
                        continue;
                    }

                    $ano = $info['publishedDate'] ?? '';

                    \Log::info('Livro encontrado no Google Books', [
                        'isbn' => $isbnBusca,
                        'titulo' => $info['title'],
                    ]);

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

        /*
         * 2. SEGUNDO: OPEN LIBRARY, CONSULTA DIRETA
         */
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
                    $livro = $resultados["ISBN:{$isbnBusca}"] ?? null;

                    if (!$livro || empty($livro['title'])) {
                        continue;
                    }

                    $autores = array_values(array_filter(array_map(
                        fn ($autor) => $autor['name'] ?? '',
                        $livro['authors'] ?? []
                    )));

                    $data = (string) ($livro['publish_date'] ?? '');
                    $ano = preg_match(
                        '/\b(?:18|19|20|21)\d{2}\b/',
                        $data,
                        $matches
                    ) ? $matches[0] : '';

                    $sinopse = $livro['description']
                        ?? $livro['notes']
                        ?? '';

                    if (is_array($sinopse)) {
                        $sinopse = $sinopse['value']
                            ?? $sinopse['text']
                            ?? '';
                    }

                    $imagem = $livro['cover']['medium']
                        ?? $livro['cover']['large']
                        ?? $livro['cover']['small']
                        ?? '';

                    \Log::info('Livro encontrado na Open Library', [
                        'isbn' => $isbnBusca,
                        'titulo' => $livro['title'],
                    ]);

                    return response()->json([
                        'titulo' => $livro['title'],
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

        /*
         * 3. ÚLTIMA TENTATIVA: BUSCA NO CATÁLOGO OPEN LIBRARY
         */
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

                \Log::info('Livro encontrado na busca da Open Library', [
                    'isbn' => $isbnBusca,
                    'titulo' => $documento['title'],
                ]);

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