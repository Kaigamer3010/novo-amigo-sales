
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

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
  private cdr = inject(ChangeDetectorRef);

  horarios: GradeHorarios[] = [];

  carregando = false;
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
    this.horarios = [];

    const usuario = this.authService.obterUsuario();
    const salaId = usuario?.sala_id;

    console.log('Usuário conectado:', usuario);
    console.log('ID da sala do usuário:', salaId);

    if (!salaId) {
      this.erro = 'Sua conta não está vinculada a uma sala.';
      this.carregando = false;
      this.cdr.detectChanges();
      return;
    }

    this.horariosService.obterHorario(salaId).subscribe({
      next: (horarios) => {
        console.log('Horários recebidos da API:', horarios);

        this.horarios = Array.isArray(horarios) ? horarios : [];
        this.carregando = false;

        if (this.horarios.length === 0) {
          this.erro = 'Nenhum horário cadastrado para sua sala.';
        }

        this.cdr.detectChanges();
      },

      error: (erro) => {
        console.error('Erro ao carregar horários:', erro);

        if (erro.status === 401) {
          this.erro = 'Sua sessão expirou. Entre novamente no sistema.';
        } else if (erro.status === 403) {
          this.erro = 'Você não tem autorização para consultar os horários.';
        } else if (erro.status === 404) {
          this.erro = 'A rota de horários não foi encontrada na API.';
        } else {
          this.erro = 'Não foi possível carregar os horários. Verifique o servidor.';
        }

        this.carregando = false;
        this.cdr.detectChanges();
      }
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
      .filter(
        horario => horario.dia_semana === this.diaSelecionado
      )
      .sort(
        (a, b) => a.hora_inicio.localeCompare(b.hora_inicio)
      );
  }
}
