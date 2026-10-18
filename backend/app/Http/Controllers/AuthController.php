<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\Sala;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        
        $usuario = Usuario::where('nome_usuario', $request->nome_usuario)->first();

        
        if (!$usuario || !Hash::check($request->senha, $usuario->senha)) {
            return response()->json(['erro' => 'Credenciais inválidas'], 401);
            // 401 = "Unauthorized", código HTTP padrão para credenciais inválidas
        }

        $token = $usuario->createToken('token')->plainTextToken;

        return response()->json([
            'usuario' => $usuario,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        
        $request->user()->currentAccessToken()->delete();

        return response()->json(['mensagem' => 'Logout realizado com sucesso']);
    }

    public function cadastrar(Request $request)
{
   
    $request->validate([
        'nome_completo' => 'required|string',
      
        'nome_usuario' => 'required|string|unique:usuarios,nome_usuario',
        'senha' => 'required|string|min:6',
        
        'nivel_acesso' => 'required|in:aluno,administrador,bibliotecario',
        'codigo_acesso' => 'required|string',
    ]);

    $existeUsuario = Usuario::where('nome_usuario', $request->nome_usuario)->exists();
    if ($existeUsuario) {
        return response()->json(['erro' => 'Usuário já existente'], 422);
    }

    if ($request->nivel_acesso === 'aluno') {
        
        $sala = Sala::where('codigo_acesso', $request->codigo_acesso)->first();

        if (!$sala) {
            return response()->json(['erro' => 'Código de sala inválido'], 422);
        }

        $nivelAcesso = 'aluno';
        $salaId = $sala->id;

    } else {
       
        if ($request->codigo_acesso === env('CODIGO_ADMINISTRADOR')) {
            $nivelAcesso = 'administrador';
        } elseif ($request->codigo_acesso === env('CODIGO_BIBLIOTECARIO')) {
            $nivelAcesso = 'bibliotecario';
        } else {
            return response()->json(['erro' => 'Código de autoridade inválido'], 422);
        }

        $salaId = null; // bibliotecario/administrador não têm sala
    }

    $usuario = Usuario::create([
        'nome_completo' => $request->nome_completo,
        'nome_usuario' => $request->nome_usuario,
        'senha' => Hash::make($request->senha),
        'nivel_acesso' => $nivelAcesso,
        'sala_id' => $salaId,
    ]);

    
    $token = $usuario->createToken('token')->plainTextToken;

    return response()->json([
        'usuario' => $usuario,
        'token' => $token,
    ], 201);
}
}