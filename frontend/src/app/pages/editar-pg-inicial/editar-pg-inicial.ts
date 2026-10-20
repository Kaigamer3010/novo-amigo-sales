
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { GerenciarAvisos } from '../../components/gerenciar-avisos/gerenciar-avisos';
import { GerenciarCardapio } from '../../components/gerenciar-cardapio/gerenciar-cardapio';

import { Aviso } from '../../models/avisos';
import { Cardapio } from '../../models/cardapio';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-editar-pg-inicial',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './editar-pg-inicial.html',
  styleUrl: './editar-pg-inicial.css',
})
export class EditarPgInicial implements OnInit {
  private readonly dialog = inject(MatDialog);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly api = environment.baseUrl + '/api';

  avisos: Aviso[] = [];
  cardapios: Cardapio[] = [];

  carregandoAvisos = false;
  carregandoCardapios = false;

  erroAvisos = '';
  erroCardapios = '';

  avisoSelecionado: number | null = null;
  cardapioSelecionado: number | null = null;

  ngOnInit(): void {
    this.carregarAvisos();
    this.carregarCardapios();
  }

  private obterHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    return token
      ? new HttpHeaders({
          Authorization: `Bearer ${token}`,
        })
      : new HttpHeaders();
  }

  carregarAvisos(): void {
    this.carregandoAvisos = true;
    this.erroAvisos = '';

    this.cdr.markForCheck();

    this.http
      .get<Aviso[] | { data: Aviso[] }>(
        `${this.api}/avisos`,
        { headers: this.obterHeaders() }
      )
      .subscribe({
        next: (resposta) => {
          this.avisos = Array.isArray(resposta)
            ? resposta
            : resposta?.data ?? [];

          this.carregandoAvisos = false;

          this.cdr.markForCheck();
        },

        error: (erro) => {
          console.error('Erro ao carregar avisos:', erro);

          this.erroAvisos =
            erro.status === 401
              ? 'Sua sessão expirou. Entre novamente no sistema.'
              : 'Não foi possível carregar os avisos.';

          this.carregandoAvisos = false;

          this.cdr.markForCheck();
        },
      });
  }

  carregarCardapios(): void {
    this.carregandoCardapios = true;
    this.erroCardapios = '';

    this.cdr.markForCheck();

    this.http
      .get<Cardapio[] | { data: Cardapio[] }>(
        `${this.api}/cardapios`,
        { headers: this.obterHeaders() }
      )
      .subscribe({
        next: (resposta) => {
          this.cardapios = Array.isArray(resposta)
            ? resposta
            : resposta?.data ?? [];

          this.carregandoCardapios = false;

          this.cdr.markForCheck();
        },

        error: (erro) => {
          console.error('Erro ao carregar cardápios:', erro);

          this.erroCardapios =
            erro.status === 401
              ? 'Sua sessão expirou. Entre novamente no sistema.'
              : 'Não foi possível carregar os cardápios.';

          this.carregandoCardapios = false;

          this.cdr.markForCheck();
        },
      });
  }

  abrirGerenciarAvisos(): void {
    this.dialog
      .open(GerenciarAvisos, {
        width: '560px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        autoFocus: false,
        panelClass: 'gerenciar-avisos-dialog',
      })
      .afterClosed()
      .subscribe((resultado) => {
        if (resultado) {
          this.carregarAvisos();
        }

        this.cdr.markForCheck();
      });
  }

  abrirGerenciarCardapio(): void {
    this.dialog
      .open(GerenciarCardapio, {
        width: '560px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        autoFocus: false,
        panelClass: 'gerenciar-cardapio-dialog',
      })
      .afterClosed()
      .subscribe((resultado) => {
        if (resultado) {
          this.carregarCardapios();
        }

        this.cdr.markForCheck();
      });
  }

  editarAviso(aviso: Aviso): void {
    this.dialog
      .open(GerenciarAvisos, {
        width: '560px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        autoFocus: false,
        data: aviso,
        panelClass: 'gerenciar-avisos-dialog',
      })
      .afterClosed()
      .subscribe((resultado) => {
        if (resultado) {
          this.carregarAvisos();
        }

        this.cdr.markForCheck();
      });
  }

  editarCardapio(cardapio: Cardapio): void {
    this.dialog
      .open(GerenciarCardapio, {
        width: '560px',
        maxWidth: '95vw',
        maxHeight: '90vh',
        autoFocus: false,
        data: cardapio,
        panelClass: 'gerenciar-cardapio-dialog',
      })
      .afterClosed()
      .subscribe((resultado) => {
        if (resultado) {
          this.carregarCardapios();
        }

        this.cdr.markForCheck();
      });
  }

  excluirAviso(id: number): void {
    const aviso = this.avisos.find((item) => item.id === id);

    if (!aviso) {
      return;
    }

    const confirmar = confirm(
      `Deseja excluir o aviso "${aviso.titulo}"?\nEssa ação não pode ser desfeita.`
    );

    if (!confirmar) {
      return;
    }

    this.http
      .delete(`${this.api}/avisos/${id}`, {
        headers: this.obterHeaders(),
      })
      .subscribe({
        next: () => {
          this.avisos = this.avisos.filter(
            (item) => item.id !== id
          );

          this.avisoSelecionado = null;

          this.cdr.markForCheck();
        },

        error: (erro) => {
          console.error('Erro ao excluir aviso:', erro);

          alert(
            'Não foi possível excluir o aviso. Verifique sua autenticação.'
          );

          this.cdr.markForCheck();
        },
      });
  }

  excluirCardapio(id: number): void {
    const cardapio = this.cardapios.find(
      (item) => item.id === id
    );

    if (!cardapio) {
      return;
    }

    const confirmar = confirm(
      `Deseja excluir o cardápio de "${cardapio.dia_semana}"?\nEssa ação não pode ser desfeita.`
    );

    if (!confirmar) {
      return;
    }

    this.http
      .delete(`${this.api}/cardapios/${id}`, {
        headers: this.obterHeaders(),
      })
      .subscribe({
        next: () => {
          this.cardapios = this.cardapios.filter(
            (item) => item.id !== id
          );

          this.cardapioSelecionado = null;

          this.cdr.markForCheck();
        },

        error: (erro) => {
          console.error('Erro ao excluir cardápio:', erro);

          alert(
            'Não foi possível excluir o cardápio. Verifique sua autenticação.'
          );

          this.cdr.markForCheck();
        },
      });
  }

  visualizarAviso(id: number): void {
    this.avisoSelecionado =
      this.avisoSelecionado === id ? null : id;

    this.cdr.markForCheck();
  }

  visualizarCardapio(id: number): void {
    this.cardapioSelecionado =
      this.cardapioSelecionado === id ? null : id;

    this.cdr.markForCheck();
  }

  trackById(_index: number, item: { id: number }): number {
    return item.id;
  }
}
