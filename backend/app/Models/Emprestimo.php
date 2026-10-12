<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Emprestimo extends Model
{
    protected $fillable = [
        'livro_id',
        'nome_aluno',
        'data_emprestimo',
        'data_devolucao_prevista',
        'data_devolucao',
    ];

    protected function casts(): array
    {
        return [
            'data_emprestimo' => 'date',
            'data_devolucao_prevista' => 'date',
            'data_devolucao' => 'date',
        ];
    }

    public function livro()
    {
        return $this->belongsTo(Livro::class);
    }

    public function estaAtrasado(): bool
    {
        return $this->data_devolucao === null
            && $this->data_devolucao_prevista->isBefore(today());
    }
}
