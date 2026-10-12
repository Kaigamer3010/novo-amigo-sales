<?php

namespace App\Http\Controllers;

use App\Models\Emprestimo;
use App\Models\Livro;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class EmprestimoController extends Controller
{
    public function index()
    {
        Gate::authorize('gerenciar-biblioteca');

        return response()->json(
            Emprestimo::with('livro')->latest()->get()
        );
    }

    public function store(Request $request)
    {
        Gate::authorize('gerenciar-biblioteca');

        $dados = $request->validate([
            'livro_id' => ['required', 'integer', 'exists:livros,id'],
            'nome_aluno' => ['required', 'string', 'max:255'],
        ]);

        $emprestimo = DB::transaction(function () use ($dados) {
            $livro = Livro::whereKey($dados['livro_id'])
                ->lockForUpdate()
                ->firstOrFail();

            $quantidadeEmprestada = $livro->emprestimos()
                ->whereNull('data_devolucao')
                ->count();

            if ($quantidadeEmprestada >= $livro->quantidade_exemplares) {
                abort(422, 'Não há exemplares disponíveis para empréstimo.');
            }

            return Emprestimo::create([
                'livro_id' => $livro->id,
                'nome_aluno' => $dados['nome_aluno'],
                'data_emprestimo' => today(),
                'data_devolucao_prevista' => today()->addDays(7),
            ]);
        });

        return response()->json([
            'mensagem' => 'Empréstimo registrado com sucesso!',
            'emprestimo' => $emprestimo->load('livro'),
        ], 201);
    }

    public function devolver(Emprestimo $emprestimo)
    {
        Gate::authorize('gerenciar-biblioteca');

        if ($emprestimo->data_devolucao !== null) {
            return response()->json([
                'mensagem' => 'Este livro já foi devolvido.',
            ], 422);
        }

        $emprestimo->update([
            'data_devolucao' => today(),
        ]);

        return response()->json([
            'mensagem' => 'Devolução registrada com sucesso!',
            'emprestimo' => $emprestimo->fresh()->load('livro'),
        ]);
    }

    public function atrasados()
    {
        Gate::authorize('gerenciar-biblioteca');

        return response()->json(
            Emprestimo::with('livro')
                ->whereNull('data_devolucao')
                ->whereDate('data_devolucao_prevista', '<', today())
                ->orderBy('data_devolucao_prevista')
                ->get()
        );
    }
}
