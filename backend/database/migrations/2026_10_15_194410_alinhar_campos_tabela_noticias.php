<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('noticias', function (Blueprint $table) {
            $table->renameColumn('texto', 'descricao');
            $table->renameColumn('imagem', 'capa');
        });

        Schema::table('noticias', function (Blueprint $table) {
            $table->date('data_publicacao')->nullable();
            $table->string('pdf')->nullable();
        });

     
        $noticias = DB::table('noticias')
            ->select('id', 'created_at')
            ->get();

        foreach ($noticias as $noticia) {
            DB::table('noticias')
                ->where('id', $noticia->id)
                ->update([
                    'data_publicacao' => $noticia->created_at
                        ? Carbon::parse($noticia->created_at)->toDateString()
                        : now()->toDateString(),
                ]);
        }
    }

    public function down(): void
    {
        Schema::table('noticias', function (Blueprint $table) {
            $table->dropColumn(['data_publicacao', 'pdf']);
        });

        Schema::table('noticias', function (Blueprint $table) {
            $table->renameColumn('descricao', 'texto');
            $table->renameColumn('capa', 'imagem');
        });
    }
};
