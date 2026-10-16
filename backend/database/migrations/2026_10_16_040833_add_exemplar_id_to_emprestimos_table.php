
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('emprestimos', function (Blueprint $table) {
            $table->foreignId('exemplar_id')
                ->nullable()
                ->constrained('exemplares')
                ->nullOnDelete();
        });

       
        $livros = DB::table('livros')->get();

        foreach ($livros as $livro) {
            $emprestimosAtivos = DB::table('emprestimos')
                ->where('livro_id', $livro->id)
                ->whereNull('data_devolucao')
                ->orderBy('id')
                ->get();

            $quantidade = max(
                1,
                (int) ($livro->quantidade_exemplares ?? 1),
                $emprestimosAtivos->count()
            );

            $idsExemplares = [];

            for ($i = 1; $i <= $quantidade; $i++) {
                $id = DB::table('exemplares')->insertGetId([
                    'livro_id' => $livro->id,
                    'codigo' => sprintf(
                        'LIV-%04d-EX-%03d',
                        $livro->id,
                        $i
                    ),
                    'localizacao' => $livro->localizacoes ?? null,
                    'status' => $i <= $emprestimosAtivos->count()
                        ? 'emprestado'
                        : 'disponivel',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $idsExemplares[] = $id;
            }
            
            foreach ($emprestimosAtivos as $indice => $emprestimo) {
                DB::table('emprestimos')
                    ->where('id', $emprestimo->id)
                    ->update([
                        'exemplar_id' => $idsExemplares[$indice],
                    ]);
            }
        }
    }

    public function down(): void
    {
        Schema::table('emprestimos', function (Blueprint $table) {
            $table->dropConstrainedForeignId('exemplar_id');
        });
    }
};
