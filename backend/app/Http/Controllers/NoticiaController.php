<?php
namespace App\Http\Controllers;

use App\Models\Noticia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class NoticiaController extends Controller
{
    public function index()
    {
        return response()->json(
            Noticia::orderByDesc('data_publicacao')->get()
        );
    }

    public function show($id)
    {
        $noticia = Noticia::findOrFail($id);

        return response()->json($noticia);
    }

    public function store(Request $request)
    {
        if (Gate::denies('gerenciar-noticia')) {
            return response()->json([
                'erro' => 'Você não tem permissão para postar essa notícia'
            ], 403);
        }

        $dados = $request->validate([
            'titulo' => 'required|string|max:255',
            'data_publicacao' => 'required|date',
            'capa' => 'nullable|string|max:2048',
            'descricao' => 'required|string',
            'pdf' => 'nullable|string|max:2048',
        ]);

        $noticia = Noticia::create($dados);

        return response()->json($noticia, 201);
    }

    public function update(Request $request, $id)
    {
        if (Gate::denies('gerenciar-noticia')) {
            return response()->json([
                'erro' => 'Você não tem permissão para editar essa notícia'
            ], 403);
        }

        $noticia = Noticia::findOrFail($id);

        $dados = $request->validate([
            'titulo' => 'sometimes|required|string|max:255',
            'data_publicacao' => 'sometimes|required|date',
            'capa' => 'sometimes|nullable|string|max:2048',
            'descricao' => 'sometimes|required|string',
            'pdf' => 'sometimes|nullable|string|max:2048',
        ]);

        $noticia->update($dados);

        return response()->json($noticia);
    }

    public function destroy($id)
    {
        if (Gate::denies('gerenciar-noticia')) {
            return response()->json([
                'erro' => 'Você não tem permissão para remover essa notícia'
            ], 403);
        }

        $noticia = Noticia::findOrFail($id);
        $noticia->delete();

        return response()->json([
            'mensagem' => 'Removido com sucesso'
        ], 200);
    }
}

