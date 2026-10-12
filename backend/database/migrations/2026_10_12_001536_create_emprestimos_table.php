<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emprestimos', function (Blueprint $table) {
            $table->id();

            $table->foreignId('livro_id')
                ->constrained('livros')
                ->restrictOnDelete();

            $table->string('nome_aluno');

            $table->date('data_emprestimo');

            $table->date('data_devolucao_prevista');

            $table->date('data_devolucao')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emprestimos');
    }
};
