
import { Component, ViewChild } from '@angular/core';
import {
  MatCalendar,
  MatDatepickerModule
} from '@angular/material/datepicker';
import {
  MatNativeDateModule
} from '@angular/material/core';

interface Evento {
  id: number;
  titulo: string;
  descricao: string;
  data: string;
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
export class CalendarioComponent {
  @ViewChild('calendario')
  calendario!: MatCalendar<Date>;

  anoAtual = new Date().getFullYear();

  dataMinima = new Date(this.anoAtual, 0, 1);
  dataMaxima = new Date(this.anoAtual, 11, 31);

  dataSelecionada: Date | null = new Date();
  mesAtivo = new Date();

  eventos: Evento[] = [
    {
      id: 1,
      titulo: 'Prova de Matemática',
      descricao: 'Prova do segundo bimestre.',
      data: '2026-10-20'
    },
    {
      id: 2,
      titulo: 'Reunião de pais',
      descricao: 'Reunião com os responsáveis.',
      data: '2026-10-25'
    }
  ];

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
