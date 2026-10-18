<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Atividade extends Model
{
    protected $fillable = [
        'titulo',
        'descricao',
        'disciplina',
        'data_entrega',
        'sala_id',
        'usuario_id',
    ];

    public function sala()
    {
        return $this->belongsTo(Sala::class);
    }

    public function usuario()
    {
        return $this->belongsTo(Usuario::class);
    }
}
