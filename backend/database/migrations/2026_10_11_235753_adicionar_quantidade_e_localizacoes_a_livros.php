
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Campo de quantidade e localização
     */
    public function up(): void
    {
        Schema::table('livros', function (Blueprint $table) {
            $table->unsignedInteger('quantidade_exemplares')
                ->default(1);

            $table->text('localizacoes')
                ->nullable();
        });
    }

    /**
     * Remove os campos caso seja necessário reverter.
     */
    public function down(): void
    {
        Schema::table('livros', function (Blueprint $table) {
            $table->dropColumn([
                'quantidade_exemplares',
                'localizacoes',
            ]);
        });
    }
};
