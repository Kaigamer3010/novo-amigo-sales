<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

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

    public function generos(): BelongsToMany
    {
        return $this->belongsToMany(Genero::class, 'genero_livro');
    }

    public function emprestimos(): HasMany
    {
        return $this->hasMany(Emprestimo::class);
    }

    public function exemplares(): HasMany
    {
        return $this->hasMany(Exemplar::class);
    }
}
