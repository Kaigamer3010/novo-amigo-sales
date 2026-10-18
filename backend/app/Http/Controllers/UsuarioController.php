<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Gate;

class UsuarioController extends Controller
{
    public function index()
    {
        
        $usuarios = Usuario::all();
        return response()->json($usuarios);
    }

    public function store(Request $request)
{
    if (Gate::denies('gerenciar-usuario')) {
        return response()->json(['erro' => 'Você não tem permissão para criar usuários'], 403);
    }

    $request->validate([
        'nome_completo' => 'required|string',
        'nome_usuario' => 'required|string|unique:usuarios,nome_usuario',
        'senha' => 'required|string|min:6',
        'nivel_acesso' => 'required|in:aluno,administrador,bibliotecario',
        'sala_id' => 'required_if:nivel_acesso,aluno|nullable|exists:salas,id',
    ]);

    $usuario = Usuario::create([
        'nome_completo' => $request->nome_completo,
        'nome_usuario' => $request->nome_usuario,
        'senha' => Hash::make($request->senha),
        'nivel_acesso' => $request->nivel_acesso,
        'sala_id' => $request->nivel_acesso === 'aluno' ? $request->sala_id : null,
    ]);

    return response()->json($usuario, 201);
}

    public function show($id)
    {
        // Continua liberado pra qualquer autenticado.
        $usuario = Usuario::findOrFail($id);
        return response()->json($usuario);
    }

    public function update(Request $request, $id)
    {
        $usuarioAlvo = Usuario::findOrFail($id);

        // Aqui o Gate recebe o usuarioAlvo como segundo parâmetro,
        // pra poder comparar se é administrador OU se é o próprio usuário editando.
        if (Gate::denies('editar-usuario', $usuarioAlvo)) {
            return response()->json(['erro' => 'Você não tem permissão para editar esse usuário'], 403);
        }

        $request->validate([
            'nome_usuario' => 'sometimes|string|unique:usuarios,nome_usuario,' . $usuarioAlvo->id,
            'sala_id' => 'sometimes|nullable|exists:salas,id',
        ]);

        $usuarioAlvo->nome_completo = $request->nome_completo ?? $usuarioAlvo->nome_completo;
        $usuarioAlvo->nome_usuario = $request->nome_usuario ?? $usuarioAlvo->nome_usuario;

        // Só administrador pode mudar o nivel_acesso de alguém (evita que um aluno
        // se autopromova a administrador editando o próprio perfil).
        if ($request->user()->nivel_acesso === 'administrador') {
            $usuarioAlvo->nivel_acesso = $request->nivel_acesso ?? $usuarioAlvo->nivel_acesso;
        } 

        if ($request->user()->nivel_acesso === 'aluno') {
            $usuarioAlvo->sala_id = $request->sala_id ?? $usuarioAlvo->sala_id;
        } 

        if ($request->senha) {
            $usuarioAlvo->senha = Hash::make($request->senha);
        }

        $usuarioAlvo->save();

        return response()->json($usuarioAlvo);
    }

    public function destroy($id)
    {
        if (Gate::denies('deletar-usuario')) {
            return response()->json(['erro' => 'Você não tem permissão para deletar usuários'], 403);
        }

        $usuario = Usuario::findOrFail($id);
        $usuario->delete();

        return response()->json(['mensagem' => 'Removido com sucesso'], 200);
    }
}