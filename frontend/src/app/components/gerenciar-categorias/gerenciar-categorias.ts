
import {
  Component,
  ChangeDetectorRef,
  afterNextRender,
  inject
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialogRef } from '@angular/material/dialog';

interface Genero {
  id: number;
  genero: string;
}

@Component({
  selector: 'app-gerenciar-categorias',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './gerenciar-categorias.html',
  styleUrl: './gerenciar-categorias.css'
})
export class GerenciarCategorias {
  categorias: Genero[] = [];

  categoriaEditando: number | null = null;
  novoNome = '';

  erro = '';
  carregando = false;
  salvando = false;

  private http = inject(HttpClient);
  private dialogRef = inject(MatDialogRef<GerenciarCategorias>);
  private cdr = inject(ChangeDetectorRef);

  private apiUrl = 'http://127.0.0.1:8000/api/generos';

  constructor() {
    // Inicia a consulta depois da primeira renderização do diálogo.
    afterNextRender(() => {
      this.carregarCategorias();
    });
  }

  private opcoesRequisicao() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      })
    };
  }

  carregarCategorias(): void {
    this.carregando = true;
    this.erro = '';
    this.cdr.markForCheck();

    this.http.get<any>(
      this.apiUrl,
      this.opcoesRequisicao()
    ).subscribe({
      next: (resposta) => {
        const lista = Array.isArray(resposta)
          ? resposta
          : Array.isArray(resposta?.data)
            ? resposta.data
            : [];

        this.categorias = lista;
        this.carregando = false;
        this.cdr.markForCheck();

        console.log('Gêneros carregados:', this.categorias);
      },
      error: (erro) => {
        console.error('Erro ao carregar gêneros:', erro);

        this.carregando = false;
        this.exibirErro(erro, 'carregar');
        this.cdr.markForCheck();
      }
    });
  }

  editarCategoria(id: number): void {
    const categoria = this.categorias.find(
      item => item.id === id
    );

    if (!categoria) {
      this.erro = 'Gênero não encontrado.';
      this.cdr.markForCheck();
      return;
    }

    this.categoriaEditando = categoria.id;
    this.novoNome = categoria.genero;
    this.erro = '';

    this.cdr.markForCheck();
  }

  salvarEdicao(): void {
    const nome = this.novoNome.trim();

    if (this.categoriaEditando === null) {
      this.erro = 'Selecione um gênero para editar.';
      this.cdr.markForCheck();
      return;
    }

    if (!nome) {
      this.erro = 'Digite o nome do gênero.';
      this.cdr.markForCheck();
      return;
    }

    const categoria = this.categorias.find(
      item => item.id === this.categoriaEditando
    );

    if (!categoria) {
      this.erro = 'Gênero não encontrado.';
      this.cdr.markForCheck();
      return;
    }

    const duplicado = this.categorias.some(
      item =>
        item.id !== categoria.id &&
        item.genero.toLocaleLowerCase() === nome.toLocaleLowerCase()
    );

    if (duplicado) {
      this.erro = 'Esse gênero já existe.';
      this.cdr.markForCheck();
      return;
    }

    if (nome === categoria.genero) {
      this.cancelarEdicao();
      return;
    }

    this.salvando = true;
    this.erro = '';
    this.cdr.markForCheck();

    this.http.put<any>(
      `${this.apiUrl}/${categoria.id}`,
      { genero: nome },
      this.opcoesRequisicao()
    ).subscribe({
      next: (resposta) => {
        const generoAtualizado: Genero = {
          id: categoria.id,
          genero: resposta?.genero ?? nome
        };

        this.categorias = this.categorias.map(item =>
          item.id === categoria.id
            ? generoAtualizado
            : item
        );

        this.salvando = false;
        this.cancelarEdicao();

        this.cdr.markForCheck();
        console.log('Gênero atualizado:', generoAtualizado);
      },
      error: (erro) => {
        console.error('Erro ao editar gênero:', erro);

        this.salvando = false;
        this.exibirErro(erro, 'editar');
        this.cdr.markForCheck();
      }
    });
  }

  excluirCategoria(id: number): void {
    const categoria = this.categorias.find(
      item => item.id === id
    );

    if (!categoria) {
      this.erro = 'Gênero não encontrado.';
      this.cdr.markForCheck();
      return;
    }

    const confirmar = confirm(
      `Deseja excluir o gênero "${categoria.genero}"?`
    );

    if (!confirmar) {
      return;
    }

    this.salvando = true;
    this.erro = '';
    this.cdr.markForCheck();

    this.http.delete(
      `${this.apiUrl}/${categoria.id}`,
      this.opcoesRequisicao()
    ).subscribe({
      next: () => {
        this.categorias = this.categorias.filter(
          item => item.id !== categoria.id
        );

        this.salvando = false;
        this.cancelarEdicao();

        this.cdr.markForCheck();
        console.log('Gênero excluído:', categoria);
      },
      error: (erro) => {
        console.error('Erro ao excluir gênero:', erro);

        this.salvando = false;
        this.exibirErro(erro, 'excluir');
        this.cdr.markForCheck();
      }
    });
  }

  private exibirErro(erro: any, operacao: string): void {
    if (erro.status === 401 || erro.status === 403) {
      this.erro =
        `Você não tem autorização para ${operacao} gêneros. Confira o login e as permissões.`;
    } else if (erro.status === 422) {
      this.erro =
        Object.values(erro.error?.errors ?? {}).flat().join(' ') ||
        erro.error?.erro ||
        erro.error?.message ||
        'Confira os dados informados.';
    } else if (erro.status === 409) {
      this.erro =
        erro.error?.erro ||
        'Não é possível realizar a operação porque existe um conflito.';
    } else {
      this.erro =
        erro.error?.erro ||
        erro.error?.message ||
        `Não foi possível ${operacao} os gêneros no banco de dados.`;
    }

    this.cdr.markForCheck();
  }

  cancelarEdicao(): void {
    this.categoriaEditando = null;
    this.novoNome = '';
    this.cdr.markForCheck();
  }

  fechar(): void {
    this.dialogRef.close(true);
  }
}
