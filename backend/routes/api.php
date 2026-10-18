<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\LivroController;
use App\Http\Controllers\GeneroController;
use App\Http\Controllers\NoticiaController;
use App\Http\Controllers\AvisoController;
use App\Http\Controllers\CardapioController;
use App\Http\Controllers\SalaController;
use App\Http\Controllers\CursoController;
use App\Http\Controllers\HorarioAulaController;
use App\Http\Controllers\AtividadeController;
use App\Http\Controllers\EmprestimoController;
use App\Http\Controllers\EdicaoController;
use App\Http\Controllers\ComunicadoController;


// Autenticação

Route::post('/login', [AuthController::class, 'login']);
Route::post('/cadastro', [AuthController::class, 'cadastrar']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');


// Rotas públicas

// Livros
Route::get('/livros', [LivroController::class, 'index']);
Route::get('/livros/buscar-isbn/{isbn}', [LivroController::class, 'buscarPorIsbn']);
Route::get('/livros/buscar-titulo/{titulo}', [LivroController::class, 'buscarPorTitulo']);
Route::get('/livros/{id}', [LivroController::class, 'show']);

// Gêneros
Route::get('/generos', [GeneroController::class, 'index']);
Route::get('/generos/{id}', [GeneroController::class, 'show']);

// Notícias
Route::get('/noticias', [NoticiaController::class, 'index']);
Route::get('/noticias/{id}', [NoticiaController::class, 'show']);

// Edições do jornal
Route::get('/edicoes', [EdicaoController::class, 'index']);
Route::get('/edicoes/{id}', [EdicaoController::class, 'show']);

// Avisos
Route::get('/avisos', [AvisoController::class, 'index']);

// Cardápios
Route::get('/cardapios', [CardapioController::class, 'index']);
Route::get('/cardapios/{id}', [CardapioController::class, 'show']);



// Rotas que exigem autenticação

Route::middleware('auth:sanctum')->group(function () {

    // Sessão
    Route::post('/logout', [AuthController::class, 'logout']);

    // Usuários
    Route::get('/usuarios', [UsuarioController::class, 'index']);
    Route::post('/usuarios', [UsuarioController::class, 'store']);
    Route::get('/usuarios/{id}', [UsuarioController::class, 'show']);
    Route::put('/usuarios/{id}', [UsuarioController::class, 'update']);
    Route::delete('/usuarios/{id}', [UsuarioController::class, 'destroy']);

    // Livros
    Route::post('/livros', [LivroController::class, 'store']);
    Route::put('/livros/{id}', [LivroController::class, 'update']);
    Route::delete('/livros/{id}', [LivroController::class, 'destroy']);

    // Gêneros
    Route::post('/generos', [GeneroController::class, 'store']);
    Route::put('/generos/{id}', [GeneroController::class, 'update']);
    Route::delete('/generos/{id}', [GeneroController::class, 'destroy']);

    // Notícias
    Route::post('/noticias', [NoticiaController::class, 'store']);
    Route::put('/noticias/{id}', [NoticiaController::class, 'update']);
    Route::delete('/noticias/{id}', [NoticiaController::class, 'destroy']);

    // Edições do jornal
    Route::post('/edicoes', [EdicaoController::class, 'store']);
    Route::put('/edicoes/{id}', [EdicaoController::class, 'update']);
    Route::delete('/edicoes/{id}', [EdicaoController::class, 'destroy']);

    // Avisos
    Route::post('/avisos', [AvisoController::class, 'store']);
    Route::get('/avisos/{id}', [AvisoController::class, 'show']);
    Route::delete('/avisos/{id}', [AvisoController::class, 'destroy']);

    // Cardápios
    Route::post('/cardapios', [CardapioController::class, 'store']);
    Route::put('/cardapios/{id}', [CardapioController::class, 'update']);
    Route::delete('/cardapios/{id}', [CardapioController::class, 'destroy']);

    // Salas e representantes
    Route::get('/salas', [SalaController::class, 'index']);
    Route::post('/salas', [SalaController::class, 'store']);
    Route::get('/salas/{id}', [SalaController::class, 'show']);
    Route::put('/salas/{id}', [SalaController::class, 'update']);
    Route::delete('/salas/{id}', [SalaController::class, 'destroy']);
    Route::put('/salas/{id}/representante', [SalaController::class, 'definirRepresentante']);

    // Cursos
    Route::get('/cursos', [CursoController::class, 'index']);
    Route::post('/cursos', [CursoController::class, 'store']);
    Route::get('/cursos/{id}', [CursoController::class, 'show']);
    Route::put('/cursos/{id}', [CursoController::class, 'update']);
    Route::delete('/cursos/{id}', [CursoController::class, 'destroy']);

    // Horários das aulas
    Route::get('/horarios/sala/{salaId}', [HorarioAulaController::class, 'porSala']);
    Route::get('/horarios', [HorarioAulaController::class, 'index']);
    Route::post('/horarios/lote', [HorarioAulaController::class, 'storeLote']);
    Route::post('/horarios', [HorarioAulaController::class, 'store']);
    Route::get('/horarios/{id}', [HorarioAulaController::class, 'show']);
    Route::put('/horarios/{id}', [HorarioAulaController::class, 'update']);
    Route::delete('/horarios/{id}', [HorarioAulaController::class, 'destroy']);

    // Atividades
    Route::get('/atividades/sala/{salaId}', [AtividadeController::class, 'porSala']);
    Route::get('/atividades', [AtividadeController::class, 'index']);
    Route::post('/atividades', [AtividadeController::class, 'store']);
    Route::get('/atividades/{id}', [AtividadeController::class, 'show']);
    Route::put('/atividades/{id}', [AtividadeController::class, 'update']);
    Route::delete('/atividades/{id}', [AtividadeController::class, 'destroy']);

    // Comunicados da área do aluno
    Route::get('/comunicados', [ComunicadoController::class, 'index']);
    Route::post('/comunicados', [ComunicadoController::class, 'store']);
    Route::put('/comunicados/{id}', [ComunicadoController::class, 'update']);
    Route::delete('/comunicados/{id}', [ComunicadoController::class, 'destroy']);

    // Empréstimos da biblioteca
    Route::get('/emprestimos', [EmprestimoController::class, 'index']);
    Route::post('/emprestimos', [EmprestimoController::class, 'store']);
    Route::patch('/emprestimos/{emprestimo}/devolver', [EmprestimoController::class, 'devolver']);
    Route::get('/emprestimos-atrasados', [EmprestimoController::class, 'atrasados']);
});
