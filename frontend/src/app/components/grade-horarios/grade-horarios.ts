
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GradeHorarios } from '../../models/gradeHorario';
import { HorariosGradeService } from '../../service/horarios-grade';
import { AuthService } from '../../service/auth';

@Component({
  selector: 'app-grade-horarios',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './grade-horarios.html',
  styleUrl: './grade-horarios.css',
})
export class GradeHorariosComponent implements OnInit {
  private horariosService = inject(HorariosGradeService);
  private authService = inject(AuthService);

  horarios: GradeHorarios[] = [];

  carregando = true;
  erro = '';

  diaSelecionado = 'segunda';

  dias = [
    { dia_semana: 'segunda', letra: 'S', nome: 'Segunda-feira' },
    { dia_semana: 'terca', letra: 'T', nome: 'Terça-feira' },
    { dia_semana: 'quarta', letra: 'Q', nome: 'Quarta-feira' },
    { dia_semana: 'quinta', letra: 'Q', nome: 'Quinta-feira' },
    { dia_semana: 'sexta', letra: 'S', nome: 'Sexta-feira' },
  ];

  ngOnInit(): void {
    this.carregarHorarios();
  }

  carregarHorarios(): void {
    this.carregando = true;
    this.erro = '';

    
    const salaId = this.authService.obterUsuario()?.sala_id ?? 1;

    this.horariosService.obterHorario(salaId).subscribe({
      next: (horarios) => {
        this.horarios = horarios;
        this.carregando = false;
      },
      error: (erro) => {
        console.error('Erro ao carregar horários:', erro);

        this.erro =
          erro.status === 401
            ? 'Faça login para consultar os horários.'
            : erro.status === 403
              ? 'Você não tem autorização para consultar os horários.'
              : 'Não foi possível carregar os horários. Verifique o servidor.';

        this.carregando = false;
      },
    });
  }

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
