
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GradeHorarios } from '../../models/gradeHorario';

@Component({
  selector: 'app-grade-horarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grade-horarios.html',
  styleUrl: './grade-horarios.css',
})
export class GradeHorariosComponent {
  horarios: GradeHorarios[] = [
    // Segunda-feira
    { id: 1, sala_id: 1, dia_semana: 'segunda', materia: 'Matemática', hora_inicio: '07:00' },
    { id: 2, sala_id: 1, dia_semana: 'segunda', materia: 'Português', hora_inicio: '07:50' },
    { id: 3, sala_id: 1, dia_semana: 'segunda', materia: 'Desenvolvimento de Sistemas', hora_inicio: '08:40' },
    { id: 4, sala_id: 1, dia_semana: 'segunda', materia: 'Inglês', hora_inicio: '09:50' },
    { id: 5, sala_id: 1, dia_semana: 'segunda', materia: 'Banco de Dados', hora_inicio: '10:40' },
    { id: 6, sala_id: 1, dia_semana: 'segunda', materia: 'Programação Web', hora_inicio: '07:00' },

    // Terça-feira
    { id: 7, sala_id: 1, dia_semana: 'terca', materia: 'Física', hora_inicio: '07:50' },
    { id: 8, sala_id: 1, dia_semana: 'terca', materia: 'História', hora_inicio: '08:40' },
    { id: 9, sala_id: 1, dia_semana: 'terca', materia: 'Banco de Dados', hora_inicio: '09:50' },
    { id: 10, sala_id: 1, dia_semana: 'terca', materia: 'Matemática', hora_inicio: '07:00' },
    { id: 11, sala_id: 1, dia_semana: 'terca', materia: 'Química', hora_inicio: '07:50' },
    { id: 12, sala_id: 1, dia_semana: 'terca', materia: 'Desenvolvimento de Sistemas', hora_inicio: '08:40' },

    // Quarta-feira
    { id: 13, sala_id: 1, dia_semana: 'quarta', materia: 'Educação Física', hora_inicio: '09:50' },
    { id: 14, sala_id: 1, dia_semana: 'quarta', materia: 'Português', hora_inicio: '07:00' },
    { id: 15, sala_id: 1, dia_semana: 'quarta', materia: 'Programação Web', hora_inicio: '07:50' },
    { id: 16, sala_id: 1, dia_semana: 'quarta', materia: 'Geografia', hora_inicio: '08:40' },
    { id: 17, sala_id: 1, dia_semana: 'quarta', materia: 'Inglês', hora_inicio: '09:50' },

    // Quinta-feira
    { id: 18, sala_id: 1, dia_semana: 'quinta', materia: 'Banco de Dados', hora_inicio: '07:00' },
    { id: 19, sala_id: 1, dia_semana: 'quinta', materia: 'Matemática', hora_inicio: '07:50' },
    { id: 20, sala_id: 1, dia_semana: 'quinta', materia: 'Desenvolvimento de Sistemas', hora_inicio: '08:40' },
    { id: 21, sala_id: 1, dia_semana: 'quinta', materia: 'Filosofia', hora_inicio: '09:50' },
    { id: 22, sala_id: 1, dia_semana: 'quinta', materia: 'Filosofia', hora_inicio: '09:50' },
    { id: 23, sala_id: 1, dia_semana: 'quinta', materia: 'Filosofia', hora_inicio: '09:50' },
    

    // Sexta-feira
    { id: 24, sala_id: 1, dia_semana: 'sexta', materia: 'Banco de Dados', hora_inicio: '07:00' },
    { id: 25, sala_id: 1, dia_semana: 'sexta', materia: 'Matemática', hora_inicio: '07:50' },
    { id: 26, sala_id: 1, dia_semana: 'sexta', materia: 'Desenvolvimento de Sistemas', hora_inicio: '08:40' },
    { id: 27, sala_id: 1, dia_semana: 'sexta', materia: 'Filosofia', hora_inicio: '09:50' },
    { id: 28, sala_id: 1, dia_semana: 'sexta', materia: 'Filosofia', hora_inicio: '09:50' },
    { id: 29, sala_id: 1, dia_semana: 'sexta', materia: 'Filosofia', hora_inicio: '09:50' },
  ];

  diaSelecionado = 'segunda';

  dias = [
    { dia_semana: 'segunda', letra: 'S', nome: 'Segunda-feira' },
    { dia_semana: 'terca', letra: 'T', nome: 'Terça-feira' },
    { dia_semana: 'quarta', letra: 'Q', nome: 'Quarta-feira' },
    { dia_semana: 'quinta', letra: 'Q', nome: 'Quinta-feira' },
    { dia_semana: 'sexta', letra: 'S', nome: 'Sexta-feira' },
  ];

  selecionarDia(dia: string): void {
    this.diaSelecionado = dia;
  }

  get diaAtual() {
    return this.dias.find(
      dia => dia.dia_semana === this.diaSelecionado
    );
  }

  get horariosDoDia(): GradeHorarios[] {
    return this.horarios
      .filter(horario => horario.dia_semana === this.diaSelecionado)
      .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
  }
}
