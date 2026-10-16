<?php
namespace App\Http\Controllers;

use App\Models\Emprestimo;
use App\Models\Exemplar;
use App\Models\Livro;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class EmprestimoController extends Controller
{
    /**
     * Lista empréstimos, incluindo livros arquivados no histórico.
     */
    public function index()
    {
        Gate::authorize('gerenciar-biblioteca');

        return response()->json(
            Emprestimo::with(['livro', 'exemplar'])
                ->orderByDesc('id')
                ->get()
        );
    }

    /**
     * Registra o empréstimo de uma cópia física disponível.
     */
    public function store(Request $request)
    {
        Gate::authorize('gerenciar-biblioteca');

        $dados = $request->validate([
            'livro_id' => ['required', 'integer', 'exists:livros,id'],
            'nome_aluno' => ['required', 'string', 'max:255'],
        ]);

        $emprestimo = DB::transaction(function () use ($dados) {
            $livro = Livro::where('ativo', true)
                ->whereKey($dados['livro_id'])
                ->lockForUpdate()
                ->firstOrFail();

            $exemplar = Exemplar::where('livro_id', $livro->id)
                ->where('status', 'disponivel')
                ->orderBy('id')
                ->lockForUpdate()
                ->first();

            if (!$exemplar) {
                throw ValidationException::withMessages([
                    'livro_id' => [
                        'Não há exemplares disponíveis para esse livro.',
                    ],
                ]);
            }

            // 1. Atualiza a cópia que está sendo emprestada.
            $exemplar->update([
                'status' => 'emprestado',
            ]);

            // 2. Recalcula a disponibilidade do título.
            $temDisponivel = $livro->exemplares()
                ->where('status', 'disponivel')
                ->exists();

            $livro->update([
                'disponibilidade' => $temDisponivel,
            ]);

            // 3. Registra o histórico de empréstimo.
            $novoEmprestimo = Emprestimo::create([
                'livro_id' => $livro->id,
                'exemplar_id' => $exemplar->id,
                'nome_aluno' => $dados['nome_aluno'],
                'data_emprestimo' => today(),
                'data_devolucao_prevista' => today()->addDays(7),
            ]);

            return $novoEmprestimo->load(['livro', 'exemplar']);
        });

        return response()->json([
            'mensagem' => 'Empréstimo registrado com sucesso!',
            'emprestimo' => $emprestimo,
        ], 201);
    }

    /**
     * Registra a devolução e libera a cópia física.
     */
    public function devolver(Emprestimo $emprestimo)
    {
        Gate::authorize('gerenciar-biblioteca');

        $resultado = DB::transaction(function () use ($emprestimo) {
            $registro = Emprestimo::whereKey($emprestimo->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($registro->data_devolucao !== null) {
                return null;
            }

            $registro->update([
                'data_devolucao' => today(),
            ]);

            if ($registro->exemplar_id !== null) {
                $exemplar = Exemplar::whereKey($registro->exemplar_id)
                    ->lockForUpdate()
                    ->first();

                if ($exemplar) {
                    $exemplar->update([
                        'status' => 'disponivel',
                    ]);
                }
            }

            // Um livro arquivado permanece fora do catálogo, mas seu
            // histórico é preservado e sua disponibilidade é atualizada.
            $livro = Livro::whereKey($registro->livro_id)->first();

            if ($livro) {
                $livro->update([
                    'disponibilidade' => $livro->exemplares()
                        ->where('status', 'disponivel')
                        ->exists(),
                ]);
            }

            return $registro->fresh()->load(['livro', 'exemplar']);
        });

        if ($resultado === null) {
            return response()->json([
                'erro' => 'Este empréstimo já foi devolvido.',
            ], 422);
        }

        return response()->json([
            'mensagem' => 'Devolução registrada com sucesso!',
            'emprestimo' => $resultado,
        ]);
    }

    /**
     * Lista empréstimos vencidos ainda não devolvidos.
     */
    public function atrasados()
    {
        Gate::authorize('gerenciar-biblioteca');

        $atrasados = Emprestimo::with(['livro', 'exemplar'])
            ->whereNull('data_devolucao')
            ->whereDate('data_devolucao_prevista', '<', today())
            ->orderBy('data_devolucao_prevista')
            ->get();

        return response()->json($atrasados);
    }
}
