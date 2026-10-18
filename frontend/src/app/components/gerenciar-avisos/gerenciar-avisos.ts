
import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { Aviso } from '../../models/avisos';
import { AvisosService } from '../../service/avisos';

@Component({
  selector: 'app-gerenciar-avisos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gerenciar-avisos.html',
  styleUrl: './gerenciar-avisos.css',
})
export class GerenciarAvisos {
  private readonly avisoService = inject(AvisosService);

  private readonly dialogRef = inject(
    MatDialogRef<GerenciarAvisos>,
    { optional: true }
  );

  novoTitulo = '';
  novoDescricao = '';
  novaDataExpiracao = '';

  carregando = false;
  mensagem = '';
  erro = '';

  readonly limiteTitulo = 100;
  readonly limiteDescricao = 1000;

  get dataMinima(): string {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  adicionarAviso(): void {
    if (this.carregando) {
      return;
    }

    const titulo = this.novoTitulo.trim();
    const descricao = this.novoDescricao.trim();

    this.mensagem = '';
    this.erro = '';

    if (!titulo || !descricao || !this.novaDataExpiracao) {
      this.erro = 'Preencha todos os campos antes de publicar o aviso.';
      return;
    }

    if (titulo.length > this.limiteTitulo) {
      this.erro = `O título deve ter no máximo ${this.limiteTitulo} caracteres.`;
      return;
    }

    if (descricao.length > this.limiteDescricao) {
      this.erro = `A descrição deve ter no máximo ${this.limiteDescricao} caracteres.`;
      return;
    }

    if (this.novaDataExpiracao < this.dataMinima) {
      this.erro = 'A data de expiração não pode ser anterior a hoje.';
      return;
    }

    const novoAviso: Aviso = {
      id: 0,
      titulo,
      descricao,
      data_expiracao: this.novaDataExpiracao,
    };

    this.carregando = true;

    this.avisoService.adicionarAviso(novoAviso).subscribe({
      next: () => {
        this.mensagem = 'Aviso publicado com sucesso!';
        this.carregando = false;

        // Fecha o diálogo e solicita a atualização da lista na página anterior.
        if (this.dialogRef) {
          this.dialogRef.close(true);
          return;
        }

        this.limparFormulario();
      },

      error: (erro: unknown) => {
        console.error('Erro ao adicionar aviso:', erro);

        const status =
          typeof erro === 'object' &&
          erro !== null &&
          'status' in erro
            ? (erro as { status: number }).status
            : 0;

        if (status === 401) {
          this.erro =
            'Sua sessão expirou ou você não está autenticado. Entre novamente no sistema.';
        } else if (status === 403) {
          this.erro =
            'Você não tem permissão para publicar avisos.';
        } else if (status === 422) {
          this.erro =
            'Os dados informados são inválidos. Confira os campos e tente novamente.';
        } else {
          this.erro =
            'Não foi possível publicar o aviso. Verifique sua conexão e tente novamente.';
        }

        this.carregando = false;
      },
    });
  }

  limparFormulario(): void {
    this.novoTitulo = '';
    this.novoDescricao = '';
    this.novaDataExpiracao = '';
    this.mensagem = '';
    this.erro = '';
  }
}
