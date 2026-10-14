<?php

namespace App\Http\Controllers;

use App\Models\Livro;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http; // facade pra fazer requisições HTTP a outras APIs
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
            $livroArray['quantidade_exemplares'] = $livro->quantidade_exemplares ?? 1;
            $livroArray['quantidade_emprestada'] = $livro->quantidade_emprestada;
            $livroArray['quantidade_disponivel'] = max(
                0,
                $livroArray['quantidade_exemplares'] - $livroArray['quantidade_emprestada']
            );

            return $livroArray;
        });

        return response()->json($livrosFormatados);
    }   


    public function show($id)
{
    $livro = Livro::with('generos')->findOrFail($id);

    // Transforma o livro num array, mas troca o campo 'generos'
    // por só os nomes, usando pluck('nome') — que extrai apenas
    // o valor de uma coluna específica de uma coleção, descartando o resto
    $livroFormatado = $livro->toArray();
    $livroFormatado['generos'] = $livro->generos->pluck('genero');

    return response()->json($livroFormatado);
}

    public function store(Request $request)
{
    if (Gate::denies('gerenciar-biblioteca')) {
        return response()->json(['erro' => 'Sem permissão'], 403);
    }

    $request->validate([
    'titulo' => 'required|string',
    'isbn' => 'required|string|unique:livros,isbn',
    'ano_publicacao' => 'required|digits:4',
    'generos' => 'nullable|array',
    'generos.*' => 'exists:generos,id',
]);

    // except('generos') cria o livro com todos os campos, MENOS 'generos'
    // (que não é coluna de livros, só existe pra alimentar a tabela pivô)
    $livro = Livro::create($request->except('generos'));

    // attach() insere as linhas na tabela genero_livro,
    // uma pra cada id que vier no array
    if ($request->has('generos')) {
    $livro->generos()->attach($request->generos);
}

    // load('generos') garante que a resposta já venha com os gêneros vinculados
    return response()->json($livro->load('generos'), 201);
}

    public function update(Request $request, $id)
{
    if (Gate::denies('gerenciar-biblioteca')) {
        return response()->json(['erro' => 'Sem permissão'], 403);
    }

    $livro = Livro::findOrFail($id);

    $request->validate([
    'isbn' => 'sometimes|required|string|unique:livros,isbn,' . $livro->id,
    'ano_publicacao' => 'sometimes|required|digits:4',
    'generos' => 'sometimes|array',
    'generos.*' => 'exists:generos,id',
    'quantidade_exemplares' => 'required|integer|min:1',
    'localizacoes' => 'nullable|string|max:255',
]);

    // except('generos') atualiza todos os campos comuns, MENOS generos
    // (que não é uma coluna de livros, não faz sentido passar pro update() padrão)
    $livro->update($request->except('generos'));

    // has('generos') confirma que o campo veio na requisição antes de tentar sincronizar
    // sync() substitui todos os vínculos antigos pelos novos ids que vierem no array
    if ($request->has('generos')) {
        $livro->generos()->sync($request->generos);
    }

    // Formatando a resposta igual fizemos no show(), pra já devolver os gêneros atualizados
    $livroFormatado = $livro->fresh()->load('generos')->toArray();
    $livroFormatado['generos'] = $livro->generos()->get()->pluck('genero');

    return response()->json($livroFormatado);
}

    public function destroy($id)
    {
        if (Gate::denies('gerenciar-biblioteca')) {
            return response()->json(['erro' => 'Sem permissão'], 403);
        }

        $livro = Livro::findOrFail($id);
        $livro->delete();

        return response()->json(['mensagem' => 'Removido com sucesso'], 200);
    }

    // Método novo: recebe um ISBN e busca os dados na Google Books API,
    // pra já vir pronto no formulário do Angular antes do usuário salvar.
    public function buscarPorIsbn($isbn)                                                
    {
        // Http::get() faz uma requisição GET pra URL informada, igual o Postman faz manualmente
        $chave = env('GOOGLE_BOOKS_API_KEY');
        $resposta = Http::get("https://www.googleapis.com/books/v1/volumes?q=isbn:{$isbn}&key={$chave}");

        // Se a API externa não respondeu com sucesso, avisa o Angular
        if (!$resposta->successful()) {
            return response()->json(['erro' => 'Não foi possível consultar o ISBN'], 500);
        }

        $dados = $resposta->json();

        // Se a busca não retornou nenhum item, o livro não foi encontrado
        if (!isset($dados['items'][0])) {
            return response()->json(['erro' => 'Livro não encontrado para esse ISBN'], 404);
        }

        // A Google Books API devolve uma estrutura aninhada; pegamos só o que precisamos
        $info = $dados['items'][0]['volumeInfo'];

        return response()->json([
            'titulo' => $info['title'] ?? '',
            'sinopse' => $info['description'] ?? '',
            'autores' => $info['authors'] ?? '',
            'ano_publicacao' => $info['publishedDate'] ?? '',
            'imagem' => $info['imageLinks']['thumbnail'] ?? '',
            'isbn' => $isbn,
        ]);
    }
}