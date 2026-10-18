<?php

namespace App\Http\Controllers;

use App\Models\Atividade;
use App\Models\Sala;
use Illuminate\Http\Request;

class AtividadeController extends Controller
{
    public function index(Request $request)
    {
        $usuario = $request->user();

        $consulta = Atividade::with(['sala', 'usuario']);

        if ($usuario->nivel_acesso === 'administrador') {
            return response()->json($consulta->get());
        }

        if ($usuario->sala_id) {
            return response()->json(
                $consulta->where('sala_id', $usuario->sala_id)->get()
            );
        }

        return response()->json([]);
    }

    public function show(Request $request, $id)
    {
        $usuario = $request->user();
        $atividade = Atividade::with(['sala', 'usuario'])->findOrFail($id);

        if (
            $usuario->nivel_acesso !== 'administrador'
            && (int) $usuario->sala_id !== (int) $atividade->sala_id
        ) {
            return response()->json(['erro' => 'Sem permissão'], 403);
        }

        return response()->json($atividade);
    }

    public function porSala(Request $request, $salaId)
    {
        $usuario = $request->user();

        if (
            $usuario->nivel_acesso !== 'administrador'
            && (int) $usuario->sala_id !== (int) $salaId
        ) {
            return response()->json(['erro' => 'Sem permissão'], 403);
        }

        $atividades = Atividade::with(['sala', 'usuario'])
            ->where('sala_id', $salaId)
            ->orderBy('data_entrega')
            ->get();

        return response()->json($atividades);
    }

    private function podeGerenciar(Request $request, Sala $sala): bool
    {
        $usuario = $request->user();

        if ($usuario->nivel_acesso === 'administrador') {
            return true;
        }

        return $usuario->nivel_acesso === 'aluno'
            && (int) $sala->representante_id === (int) $usuario->id;
    }

    public function store(Request $request)
    {
        $dados = $request->validate([
            'titulo' => 'required|string|max:255',
            'descricao' => 'nullable|string',
            'disciplina' => 'required|string|max:255',
            'data_entrega' => 'required|date',
            'sala_id' => 'required|exists:salas,id',
        ]);

        $sala = Sala::findOrFail($dados['sala_id']);

        if (!$this->podeGerenciar($request, $sala)) {
            return response()->json(['erro' => 'Sem permissão'], 403);
        }

        $atividade = Atividade::create([
            'titulo' => $dados['titulo'],
            'descricao' => $dados['descricao'] ?? null,
            'disciplina' => $dados['disciplina'],
            'data_entrega' => $dados['data_entrega'],
            'sala_id' => $sala->id,
            'usuario_id' => $request->user()->id,
        ]);

        return response()->json(
            $atividade->load(['sala', 'usuario']),
            201
        );
    }

    public function update(Request $request, $id)
    {
        $atividade = Atividade::findOrFail($id);
        $sala = $atividade->sala;

        if (!$sala || !$this->podeGerenciar($request, $sala)) {
            return response()->json(['erro' => 'Sem permissão'], 403);
        }

        $dados = $request->validate([
            'titulo' => 'sometimes|required|string|max:255',
            'descricao' => 'sometimes|nullable|string',
            'disciplina' => 'sometimes|required|string|max:255',
            'data_entrega' => 'sometimes|required|date',
        ]);

        $atividade->update($dados);

        return response()->json(
            $atividade->fresh()->load(['sala', 'usuario'])
        );
    }

    public function destroy(Request $request, $id)
    {
        $atividade = Atividade::findOrFail($id);
        $sala = $atividade->sala;

        if (!$sala || !$this->podeGerenciar($request, $sala)) {
            return response()->json(['erro' => 'Sem permissão'], 403);
        }

        $atividade->delete();

        return response()->json([
            'mensagem' => 'Atividade removida com sucesso'
        ]);
    }
}
