import { Component, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AvisosSalaComponent } from '../../components/avisos-sala-component/avisos-sala-component';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Aviso } from '../../models/avisos';
import { AvisosSalaService } from '../../service/avisos-sala';
import { GradeHorarios } from '../../components/grade-horarios/grade-horarios';
import { CalendarioComponent } from '../../components/calendario/calendario';


@Component({
  selector: 'app-sala',
  imports: [RouterLink, AvisosSalaComponent, MatPaginatorModule, CalendarioComponent],
  templateUrl: './sala.html',
  styleUrl: './sala.css',
})
export class Sala {

  constructor(
    private dialog: MatDialog,
    private avisoSalaService: AvisosSalaService,
    private cdr: ChangeDetectorRef
  ) {}

  abrirGradeHorarios() {
      this.dialog.open(GradeHorarios, {
        panelClass: 'cardapio-dialog'
      });
    }

 noticias: Aviso[] = [];
noticiasVisiveis: Aviso[] = [];

ngOnInit() {
    this.carregarAvisos();
  }

  carregandoAvisos = true;

carregarAvisos() {
  this.carregandoAvisos = true;

  this.avisoSalaService.obterAvisos().subscribe({
    next: (avisos) => {
      this.noticias = [...avisos];
      this.noticiasVisiveis = avisos.slice(0, 2);
      this.carregandoAvisos = false;

      this.cdr.detectChanges();
    },
    error: (erro) => {
      console.error('Erro ao carregar avisos:', erro);
      this.carregandoAvisos = false;

      this.cdr.detectChanges();
    }
  });
}

  mudarPagina(event: PageEvent) {
    const inicio = event.pageIndex * event.pageSize;
    const fim = inicio + event.pageSize;

    this.noticiasVisiveis = this.noticias.slice(inicio, fim);
  }

}
