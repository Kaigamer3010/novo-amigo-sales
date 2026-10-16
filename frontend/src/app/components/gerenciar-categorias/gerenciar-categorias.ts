
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

@Component({
  selector: 'app-gerenciar-categorias',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './gerenciar-categorias.html',
  styleUrl: './gerenciar-categorias.css'
})
export class GerenciarCategorias {
  categorias: string[];
  categoriaEditando = -1;
  novoNome = '';
  erro = '';

  private dialogRef = inject(MatDialogRef<GerenciarCategorias>);

  constructor() {
    const data = inject<{ categorias: string[] }>(MAT_DIALOG_DATA);
    this.categorias = [...data.categorias];
  }

  editarCategoria(index: number): void {
    this.categoriaEditando = index;
    this.novoNome = this.categorias[index];
    this.erro = '';
  }

  salvarEdicao(): void {
    const nome = this.novoNome.trim();

    if (!nome) {
      this.erro = 'Digite o nome da categoria.';
      return;
    }

    const jaExiste = this.categorias.some(
      (categoria, index) =>
        index !== this.categoriaEditando &&
        categoria.toLocaleLowerCase() === nome.toLocaleLowerCase()
    );

    if (jaExiste) {
      this.erro = 'Essa categoria já existe.';
      return;
    }

    this.categorias[this.categoriaEditando] = nome;
    this.categorias = [...this.categorias];
    this.categoriaEditando = -1;
    this.novoNome = '';
    this.erro = '';
  }

  excluirCategoria(index: number): void {
    const confirmar = confirm(
      `Deseja excluir a categoria "${this.categorias[index]}"?`
    );

    if (!confirmar) {
      return;
    }

    this.categorias = this.categorias.filter((_, i) => i !== index);
    this.categoriaEditando = -1;
    this.erro = '';
  }

  cancelarEdicao(): void {
    this.categoriaEditando = -1;
    this.novoNome = '';
    this.erro = '';
  }

  fechar(): void {
    this.dialogRef.close(this.categorias);
  }
}
