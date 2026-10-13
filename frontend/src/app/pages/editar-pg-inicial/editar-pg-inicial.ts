
import { Component, inject } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { GerenciarAvisos } from '../../components/gerenciar-avisos/gerenciar-avisos';
import { GerenciarCardapio } from '../../components/gerenciar-cardapio/gerenciar-cardapio';

import { Aviso } from '../../models/avisos';
import { Cardapio } from '../../models/cardapio';

@Component({
  selector: 'app-editar-pg-inicial',
  standalone: true,
  imports: [MatDialogModule],
  templateUrl: './editar-pg-inicial.html',
  styleUrl: './editar-pg-inicial.css',
})
export class EditarPgInicial {

  private dialog = inject(MatDialog);

  cardapios: Cardapio[] = [];
  avisos: Aviso[] = [];

  abrirGerenciarAvisos(): void {
    this.dialog.open(GerenciarAvisos, {
      width: '500px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: false,
      panelClass: "gerenciar-avisos-dialog"
    });
  }

  abrirGerenciarCardapio(): void {
    this.dialog.open(GerenciarCardapio, {
      width: '500px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: false,
      panelClass: "gerenciar-cardapio-dialog"
    });
  }

  editarAviso(aviso: Aviso): void {
    this.dialog.open(GerenciarAvisos, {
      width: '500px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: false,
      data: aviso
    });
  }

  editarCardapio(cardapio: Cardapio): void {
    this.dialog.open(GerenciarCardapio, {
      width: '500px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: false,
      data: cardapio,
      panelClass: "gerenciar-cardapio-dialog"
    });
  }

  excluirAviso(id: number): void {
    if (confirm('Deseja excluir este aviso?')) {
      this.avisos = this.avisos.filter(aviso => aviso.id !== id);
    }
  }

  excluirCardapio(id: number): void {
    if (confirm('Deseja excluir este cardápio?')) {
      this.cardapios = this.cardapios.filter(item => item.id !== id);
    }
  }
}
