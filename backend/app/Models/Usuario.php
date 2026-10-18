<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute; // 
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Support\Str; // 
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasApiTokens;

    protected $fillable = [
        'nome_completo',
        'nome_usuario',
        'senha',
        'nivel_acesso',
        'sala_id',
    ];

    protected $hidden = [
        'senha',
    ];

    protected function nomeCompleto(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => Str::lower($value),
        );
    }

    // Mutator para o campo nome_usuario
    protected function nomeUsuario(): Attribute
    {
        return Attribute::make(
            set: fn (string $value) => Str::lower($value),
        );
    }

    public function getAuthPassword()
    {
        return $this->senha;
    }

    public function sala() {
        return $this->belongsTo(Sala::class);
}
}
