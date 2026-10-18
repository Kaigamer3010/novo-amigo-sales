
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

import { AvisosSalaComponent } from '../../components/avisos-sala-component/avisos-sala-component';
import { GradeHorariosComponent } from '../../components/grade-horarios/grade-horarios';
import { CalendarioComponent } from '../../components/calendario/calendario';

import {
  ComunicadosSalaService,
  ComunicadoSala
} from '../../service/comunicados-sala';

@Component({
  selector: 'app-sala',
  imports: [
    RouterLink,
    AvisosSalaComponent,
    MatPaginatorModule,
    CalendarioComponent
  ],
  templateUrl: './sala.html',
  styleUrl: './sala.css',
})
export class Sala implements OnInit {

  constructor(
    private dialog: MatDialog,
    private comunicadosService: ComunicadosSalaService,
    private cdr: ChangeDetectorRef
  ) {}

  // Grade de horários
  abrirGradeHorarios(): void {
    this.dialog.open(GradeHorariosComponent, {
      width: '800px',
      maxWidth: '95vw',
      height: '100%',
      maxHeight: '310px',
      panelClass: 'cardapio-dialog'
    });
  }

  // Comunicados específicos da turma
  noticias: ComunicadoSala[] = [];
  noticiasVisiveis: ComunicadoSala[] = [];
  carregandoAvisos = true;

  ngOnInit(): void {
    this.carregarAvisos();
  }

  carregarAvisos(): void {
    this.carregandoAvisos = true;

    this.comunicadosService.obterComunicados().subscribe({
      next: (comunicados) => {
        this.noticias = [...comunicados];
        this.noticiasVisiveis = comunicados.slice(0, 2);
        this.carregandoAvisos = false;

        this.cdr.detectChanges();
      },

      error: (erro) => {
        console.error(
          'Erro ao carregar comunicados da turma:',
          erro
        );

        this.noticias = [];
        this.noticiasVisiveis = [];
        this.carregandoAvisos = false;

        this.cdr.detectChanges();
      }
    });
  }

  mudarPagina(event: PageEvent): void {
    const inicio = event.pageIndex * event.pageSize;
    const fim = inicio + event.pageSize;

    this.noticiasVisiveis = this.noticias.slice(inicio, fim);
  }
}
