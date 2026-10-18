<?php
namespace App\Http\Controllers;

use App\Models\Emprestimo;
use App\Models\Exemplar;
use App\Models\Livro;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class EmprestimoController extends Controller
{
    public function index()
    {
        Gate::authorize('gerenciar-biblioteca');

        return response()->json(
            Emprestimo::with(['livro', 'exemplar'])
                ->orderByDesc('id')
                ->get()
        );
    }

    public function store(Request $request)
    {
        Gate::authorize('gerenciar-biblioteca');

        $dados = $request->validate([
            'livro_id' => ['required', 'integer', 'exists:livros,id'],
            'nome_aluno' => ['required', 'string', 'max:255'],
            'data_emprestimo' => ['required', 'date_format:Y-m-d'],
            'prazo_devolucao_dias' => ['required', 'integer', 'min:1', 'max:365'],
        ], [
            'data_emprestimo.required' => 'Selecione a data do empréstimo.',
            'data_emprestimo.date_format' => 'A data do empréstimo é inválida.',
            'prazo_devolucao_dias.required' => 'Informe o prazo para devolução.',
            'prazo_devolucao_dias.integer' => 'O prazo deve ser informado em dias inteiros.',
            'prazo_devolucao_dias.min' => 'O prazo mínimo para devolução é de 1 dia.',
            'prazo_devolucao_dias.max' => 'O prazo máximo para devolução é de 365 dias.',
        ]);

        $dataEmprestimo = Carbon::createFromFormat(
            'Y-m-d',
            $dados['data_emprestimo']
        )->startOfDay();

        $dataDevolucaoPrevista = $dataEmprestimo
            ->copy()
            ->addDays((int) $dados['prazo_devolucao_dias']);

        $emprestimo = DB::transaction(function () use (
            $dados,
            $dataEmprestimo,
            $dataDevolucaoPrevista
        ) {
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

            $exemplar->update([
                'status' => 'emprestado',
            ]);

            $temDisponivel = $livro->exemplares()
                ->where('status', 'disponivel')
                ->exists();

            $livro->update([
                'disponibilidade' => $temDisponivel,
            ]);

            $novoEmprestimo = Emprestimo::create([
                'livro_id' => $livro->id,
                'exemplar_id' => $exemplar->id,
                'nome_aluno' => $dados['nome_aluno'],
                'data_emprestimo' => $dataEmprestimo->toDateString(),
                'data_devolucao_prevista' => $dataDevolucaoPrevista->toDateString(),
            ]);

            return $novoEmprestimo->load(['livro', 'exemplar']);
        });

        return response()->json([
            'mensagem' => 'Empréstimo registrado com sucesso!',
            'emprestimo' => $emprestimo,
        ], 201);
    }

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
