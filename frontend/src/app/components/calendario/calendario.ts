
import {
  Component,
  ViewChild,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';

import {
  MatCalendar,
  MatDatepickerModule
} from '@angular/material/datepicker';

import {
  MatNativeDateModule
} from '@angular/material/core';

import { AuthService } from '../../service/auth';

interface Evento {
  id: number;
  titulo: string;
  descricao: string;
  data: string;
}

interface AtividadeApi {
  id: number;
  titulo: string;
  descricao: string | null;
  disciplina: string;
  data_entrega: string;
  sala_id: number;
}

@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './calendario.html',
  styleUrl: './calendario.css'
})
export class CalendarioComponent implements OnInit {
  @ViewChild('calendario')
  calendario!: MatCalendar<Date>;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  anoAtual = new Date().getFullYear();

  dataMinima: Date | null = null;
  dataMaxima: Date | null = null;

  dataSelecionada: Date | null = new Date();
  mesAtivo = new Date();

  eventos: Evento[] = [];

  ngOnInit(): void {
    this.carregarEventos();
  }

  carregarEventos(): void {
    const usuario = this.authService.obterUsuario();
    const salaId = usuario?.sala_id;
    const token = localStorage.getItem('token');

    if (!salaId) {
      this.eventos = [];
      return;
    }

    const headers = new HttpHeaders({
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });

    this.http
      .get<AtividadeApi[]>(
        `http://127.0.0.1:8000/api/atividades/sala/${salaId}`,
        { headers }
      )
      .subscribe({
        next: (atividades) => {
          this.eventos = atividades.map((atividade) => ({
            id: atividade.id,
            titulo: atividade.titulo,
            descricao: atividade.disciplina
              ? `${atividade.disciplina}${atividade.descricao ? ' — ' + atividade.descricao : ''}`
              : atividade.descricao ?? '',
            data: atividade.data_entrega.substring(0, 10)
          }));

          this.cdr.detectChanges();
          this.calendario?.updateTodaysDate();
        },
        error: (erro) => {
          console.error('Erro ao carregar eventos do calendário:', erro);
          this.eventos = [];
          this.cdr.detectChanges();
        }
      });
  }

  formatarData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  selecionarData(data: Date | null): void {
    this.dataSelecionada = data;
  }

  get eventosSelecionados(): Evento[] {
    if (!this.dataSelecionada) {
      return [];
    }

    const data = this.formatarData(this.dataSelecionada);

    return this.eventos.filter(evento => evento.data === data);
  }

  marcarDatas = (data: Date): string => {
    const dataFormatada = this.formatarData(data);

    return this.eventos.some(
      evento => evento.data === dataFormatada
    ) ? 'dia-com-evento' : '';
  };
}
