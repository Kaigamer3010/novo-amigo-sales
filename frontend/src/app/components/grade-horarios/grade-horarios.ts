import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GradeHorarios } from '../../models/gradeHorario';
import { HorariosGradeService } from '../../service/horarios-grade';

@Component({
  selector: 'app-grade-horarios',
  imports: [CommonModule],
  templateUrl: './grade-horarios.html',
  styleUrl: './grade-horarios.css',
})
export class GradeHorariosComponent {

horarios: GradeHorarios[] = []

diaSelecionado = 'segunda';

constructor(private horariosService: HorariosGradeService) {}

ngOnInit() {
this.horariosService.obterHorario().subscribe({
next: (horarios) => {
this.horarios = horarios;
},
error: (erro) => {
console.error('Erro ao carregar cardápio:', erro);
}
});
}

dias = [
{ dia_semana: 'segunda', letra: 'S', nome: 'Segunda-feira' },
{ dia_semana: 'terca', letra: 'T', nome: 'Terça-feira' },
{ dia_semana: 'quarta', letra: 'Q', nome: 'Quarta-feira' },
{ dia_semana: 'quinta', letra: 'Q', nome: 'Quinta-feira' },
{ dia_semana: 'sexta', letra: 'S', nome: 'Sexta-feira' },
];

selecionarDia(dia: string) {
this.diaSelecionado = dia;
}

get diaAtual() {
return this.dias.find(
dia => dia.dia_semana === this.diaSelecionado
);
}

get horariosDoDia() {
return this.horarios.filter(
horario => horario.dia_semana === this.diaSelecionado
);
}

}
