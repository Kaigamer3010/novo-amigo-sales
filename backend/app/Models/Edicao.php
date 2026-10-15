<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Edicao extends Model
{
    protected $table = 'edicoes';

    protected $fillable = [
        'titulo',
        'data_publicacao',
        'capa',
        'descricao',
        'pdf',
    ];

    protected function casts(): array
    {
        return [
            'data_publicacao' => 'date:Y-m-d',
        ];
    }
}
