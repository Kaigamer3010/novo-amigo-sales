<?php

namespace App\Http\Controllers;

use App\Models\Sala;
use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class SalaController extends Controller
{
    
    public function index()
    {
        $salas = Sala::with(['curso', 'representante'])->get();

        return response()->json($salas);
    }

    
    public function show($id)
    {
        $sala = Sala::with(['curso', 'representante'])->findOrFail($id);

        return response()->json($sala);
    }

    
    public function store(Request $request)
    {
        if (Gate::denies('gerenciar-sala')) {
            return response()->json([
                'erro' => 'Sem permissão.'
            ], 403);
        }

        $dados = $request->validate([
            'serie' => 'required|integer|min:1',
            'curso_id' => 'required|exists:cursos,id',
        ]);

        $sala = Sala::create([
            'serie' => $dados['serie'],
            'curso_id' => $dados['curso_id'],
            'codigo_acesso' => Str::random(8),
        ]);

        return response()->json(
            $sala->load(['curso', 'representante']),
            201
        );
    }

    
    
public function update(Request $request, $id)
{
    $sala = Sala::findOrFail($id);
    $usuario = $request->user();

   
    if (Gate::allows('gerenciar-sala')) {
        $dados = $request->validate([
            'serie' => 'sometimes|required|integer|min:1',
            'curso_id' => 'sometimes|required|exists:cursos,id',
        ]);

        $sala->update($dados);

        return response()->json(
            $sala->load(['curso', 'representante'])
        );
    }

    
    
    if (
        !$usuario ||
        (int) $sala->representante_id !== (int) $usuario->id ||
        (int) $sala->id !== (int) $usuario->sala_id
    ) {
        return response()->json([
            'erro' => 'Você não tem permissão para editar esta sala.'
        ], 403);
    }

    
    $dados = $request->validate([
        'serie' => 'required|integer|min:1',
    ]);

    $sala->update([
        'serie' => $dados['serie'],
    ]);

    return response()->json(
        $sala->load(['curso', 'representante'])
    );
}


   
    public function definirRepresentante(Request $request, $id)
    {
        if (Gate::denies('gerenciar-sala')) {
            return response()->json([
                'erro' => 'Você não tem permissão para designar representantes.'
            ], 403);
        }

        $dados = $request->validate([
            'representante_id' => 'required|integer|exists:usuarios,id',
        ]);

        $sala = Sala::findOrFail($id);
        $representante = Usuario::findOrFail(
            $dados['representante_id']
        );

        if (
            $representante->nivel_acesso !== 'aluno' ||
            (int) $representante->sala_id !== (int) $sala->id
        ) {
            return response()->json([
                'erro' => 'O representante precisa ser um aluno da própria sala.'
            ], 422);
        }

        $jaRepresentaOutraSala = Sala::where(
            'representante_id',
            $representante->id
        )
            ->where('id', '!=', $sala->id)
            ->exists();

        if ($jaRepresentaOutraSala) {
            return response()->json([
                'erro' => 'Esse aluno já é representante de outra sala.'
            ], 422);
        }

        $sala->representante_id = $representante->id;
        $sala->save();

        return response()->json(
            $sala->load(['curso', 'representante'])
        );
    }

   
    public function destroy($id)
    {
        if (Gate::denies('gerenciar-sala')) {
            return response()->json([
                'erro' => 'Sem permissão.'
            ], 403);
        }

        $sala = Sala::findOrFail($id);
        $sala->delete();

        return response()->json([
            'mensagem' => 'Sala removida com sucesso.'
        ]);
    }
}
