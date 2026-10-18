<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('salas', 'representante_id')) {
            Schema::table('salas', function (Blueprint $table) {
                $table->foreignId('representante_id')
                    ->nullable()
                    ->after('codigo_acesso')
                    ->constrained('usuarios')
                    ->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('salas', 'representante_id')) {
            Schema::table('salas', function (Blueprint $table) {
                $table->dropConstrainedForeignId('representante_id');
            });
        }
    }
};
