
import {
  Component,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';

import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { AvisoComponent } from '../../components/aviso/aviso';
import { CardapioComponent } from '../../components/cardapio/cardapio';
import { AvisosService } from '../../service/avisos';
import { Aviso } from '../../models/avisos';

@Component({
  selector: 'app-pagina-inicial',
  standalone: true,
  imports: [
    RouterLink,
    AvisoComponent,
    CardapioComponent,
  ],
  templateUrl: './pagina-inicial.html',
  styleUrl: './pagina-inicial.css',
})
export class PaginaInicial implements OnInit {
  noticias: Aviso[] = [];
  carregandoAvisos = true;

  constructor(
    private readonly dialog: MatDialog,
    private readonly avisoService: AvisosService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.carregarAvisos();
  }

  abrirCardapio(): void {
    this.dialog.open(CardapioComponent, {
      panelClass: 'cardapio-dialog',
    });
  }

  carregarAvisos(): void {
    this.carregandoAvisos = true;

    this.avisoService.obterAvisos().subscribe({
      next: (avisos) => {
        this.noticias = Array.isArray(avisos) ? [...avisos] : [];
        this.carregandoAvisos = false;
        this.cdr.markForCheck();
      },

      error: (erro) => {
        console.error('Erro ao carregar avisos:', erro);
        this.noticias = [];
        this.carregandoAvisos = false;
        this.cdr.markForCheck();
      },
    });
  }
}
