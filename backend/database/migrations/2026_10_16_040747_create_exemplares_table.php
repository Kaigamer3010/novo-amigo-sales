
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exemplares', function (Blueprint $table) {
            $table->id();

            $table->foreignId('livro_id')
                ->constrained('livros')
                ->cascadeOnDelete();

            $table->string('codigo')->unique();
            $table->string('localizacao')->nullable();

            $table->string('status')->default('disponivel');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exemplares');
    }
};
