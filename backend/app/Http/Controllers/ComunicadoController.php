<?php

namespace App\Http\Controllers;

use App\Models\Comunicado;
use Illuminate\Http\Request;

class ComunicadoController extends Controller
{
    public function index(Request $request)
    {
        $usuario = $request->user();

        $consulta = Comunicado::with([
            'sala.curso',
            'usuario:id,nome_completo',
        ])->orderByDesc('created_at');

        if ($usuario->nivel_acesso === 'administrador') {
            return response()->json($consulta->get());
        }

        if ($usuario->nivel_acesso === 'aluno' && $usuario->sala_id) {
            return response()->json(
                $consulta->where('sala_id', $usuario->sala_id)->get()
            );
        }

        return response()->json([]);
    }

    private function podeGerenciar(Request $request, Comunicado $comunicado): bool
    {
        $usuario = $request->user();

        return $usuario->nivel_acesso === 'aluno'
            && (int) $comunicado->sala?->representante_id === (int) $usuario->id
            && (int) $comunicado->sala_id === (int) $usuario->sala_id;
    }

    public function store(Request $request)
    {
        $usuario = $request->user();

        if ($usuario->nivel_acesso !== 'aluno') {
            return response()->json([
                'erro' => 'Somente o representante da sala pode publicar comunicados.'
            ], 403);
        }

        $sala = $usuario->sala;

        if (
            !$sala ||
            (int) $sala->representante_id !== (int) $usuario->id
        ) {
            return response()->json([
                'erro' => 'Você não é o representante autorizado de uma sala.'
            ], 403);
        }

        $dados = $request->validate([
            'titulo' => 'required|string|max:255',
            'descricao' => 'required|string',
        ]);

        $comunicado = Comunicado::create([
            'titulo' => $dados['titulo'],
            'descricao' => $dados['descricao'],
            'sala_id' => $sala->id,
            'usuario_id' => $usuario->id,
        ]);

        return response()->json(
            $comunicado->load([
                'sala.curso',
                'usuario:id,nome_completo',
            ]),
            201
        );
    }

    public function update(Request $request, $id)
    {
        $comunicado = Comunicado::with('sala')->findOrFail($id);

        if (!$this->podeGerenciar($request, $comunicado)) {
            return response()->json([
                'erro' => 'Você não tem permissão para editar este comunicado.'
            ], 403);
        }

        $dados = $request->validate([
            'titulo' => 'sometimes|required|string|max:255',
            'descricao' => 'sometimes|required|string',
        ]);

        $comunicado->update($dados);

        return response()->json(
            $comunicado->fresh()->load([
                'sala.curso',
                'usuario:id,nome_completo',
            ])
        );
    }

    public function destroy(Request $request, $id)
    {
        $comunicado = Comunicado::with('sala')->findOrFail($id);

        if (!$this->podeGerenciar($request, $comunicado)) {
            return response()->json([
                'erro' => 'Você não tem permissão para excluir este comunicado.'
            ], 403);
        }

        $comunicado->delete();

        return response()->json([
            'mensagem' => 'Comunicado excluído com sucesso.'
        ]);
    }
}
