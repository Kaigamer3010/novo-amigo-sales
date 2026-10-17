
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

interface Livro {
  id: number;
  titulo: string;
  autor?: string;
  autores?: string[];
  categoria?: string;
  quantidadeDisponivel?: number;
  disponivel?: boolean;
}

interface DadosGerenciarLivros {
  obterLivros: () => Livro[];
  editarLivro: (livro: Livro) => void;
  excluirLivro: (id: number) => void;
}

@Component({
  selector: 'app-gerenciar-livros',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './gerenciar-livros.html',
  styleUrl: './gerenciar-livros.css'
})
export class GerenciarLivros {
  busca = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DadosGerenciarLivros,
    private dialogRef: MatDialogRef<GerenciarLivros>
  ) {}

  get livros(): Livro[] {
    return this.data.obterLivros();
  }

  get livrosFiltrados(): Livro[] {
    const termo = this.busca.trim().toLocaleLowerCase('pt-BR');

    if (!termo) {
      return this.livros;
    }

    return this.livros.filter((livro) => {
      const titulo = String(livro.titulo ?? '')
        .toLocaleLowerCase('pt-BR');

      const autor = String(
        livro.autor ??
        (Array.isArray(livro.autores)
          ? livro.autores.join(', ')
          : '')
      ).toLocaleLowerCase('pt-BR');

      return titulo.includes(termo) || autor.includes(termo);
    });
  }

  editar(livro: Livro): void {
    this.data.editarLivro(livro);
  }

  excluir(livro: Livro): void {
    this.data.excluirLivro(livro.id);
  }

  fechar(): void {
    this.dialogRef.close();
  }
}
