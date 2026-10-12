<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Livro extends Model
{
    protected $fillable = [
        'titulo',
        'autores',
        'sinopse',
        'categoria',
        'ano_publicacao',
        'imagem',
        'isbn',
        'disponibilidade',
        'quantidade_exemplares',
        'localizacoes',
    ];

    protected $casts = [
        'autores' => 'array',
        'disponibilidade' => 'boolean',
        'quantidade_exemplares' => 'integer',
    ];

    public function generos()
    {
        return $this->belongsToMany(Genero::class, 'genero_livro');
    }

    public function emprestimos()
    {
        return $this->hasMany(Emprestimo::class);
    }
}
