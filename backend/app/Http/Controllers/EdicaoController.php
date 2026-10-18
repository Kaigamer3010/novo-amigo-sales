<?php
namespace App\Http\Controllers;

use App\Models\Edicao;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class EdicaoController extends Controller
{
    
    public function index()
    {
        return response()->json(
            Edicao::orderByDesc('data_publicacao')->get()
        );
    }

    
    public function show(string $id)
    {
        $edicao = Edicao::find($id);

        if (!$edicao) {
            return response()->json([
                'mensagem' => 'Edição não encontrada.'
            ], 404);
        }

        return response()->json($edicao);
    }

    
    public function store(Request $request)
    {
        if (Gate::denies('gerenciar-noticia')) {
            abort(403, 'Você não tem permissão para cadastrar edições.');
        }

        $dados = $request->validate([
            'titulo' => 'required|string|max:255',
            'data_publicacao' => 'required|date',
            'capa' => 'nullable|string|max:2048',
            'descricao' => 'required|string',
            'pdf' => 'nullable|string|max:2048',
        ]);

        $edicao = Edicao::create($dados);

        return response()->json($edicao, 201);
    }

   
    public function update(Request $request, string $id)
    {
        if (Gate::denies('gerenciar-noticia')) {
            abort(403, 'Você não tem permissão para editar edições.');
        }

        $edicao = Edicao::find($id);

        if (!$edicao) {
            return response()->json([
                'mensagem' => 'Edição não encontrada.'
            ], 404);
        }

        $dados = $request->validate([
            'titulo' => 'sometimes|required|string|max:255',
            'data_publicacao' => 'sometimes|required|date',
            'capa' => 'nullable|string|max:2048',
            'descricao' => 'sometimes|required|string',
            'pdf' => 'nullable|string|max:2048',
        ]);

        $edicao->update($dados);

        return response()->json($edicao);
    }

    
    public function destroy(string $id)
    {
        if (Gate::denies('gerenciar-noticia')) {
            abort(403, 'Você não tem permissão para excluir edições.');
        }

        $edicao = Edicao::find($id);

        if (!$edicao) {
            return response()->json([
                'mensagem' => 'Edição não encontrada.'
            ], 404);
        }

        $edicao->delete();

        return response()->json([
            'mensagem' => 'Edição excluída com sucesso.'
        ]);
    }
}
