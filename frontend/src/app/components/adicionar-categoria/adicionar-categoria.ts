
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

@Component({
  selector: 'app-adicionar-categoria',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './adicionar-categoria.html',
  styleUrl: './adicionar-categoria.css',
})
export class AdicionarCategoria {
  nomeCategoria = '';
  erro = '';
  salvando = false;

  private http = inject(HttpClient);
  private dialogRef = inject(MatDialogRef<AdicionarCategoria>);

  private apiUrl = 'http://127.0.0.1:8000/api/generos';

  data = inject<{ categorias: string[] }>(MAT_DIALOG_DATA);

  private opcoesRequisicao() {
    const token = localStorage.getItem('token');

    return {
      headers: new HttpHeaders({
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      })
    };
  }

  salvarCategoria(): void {
    this.erro = '';

    const nome = this.nomeCategoria.trim();

    if (!nome) {
      this.erro = 'Digite o nome do gênero.';
      return;
    }

    const jaExiste = this.data.categorias.some(
      categoria =>
        categoria.toLocaleLowerCase() === nome.toLocaleLowerCase()
    );

    if (jaExiste) {
      this.erro = 'Esse gênero já está cadastrado.';
      return;
    }

    this.salvando = true;

    this.http.post(
      this.apiUrl,
      { genero: nome },
      this.opcoesRequisicao()
    ).subscribe({
      next: (resposta) => {
        console.log('Gênero cadastrado no Laravel:', resposta);

        this.salvando = false;
        this.dialogRef.close({
          acao: 'adicionar',
          sucesso: true
        });
      },
      error: (erro) => {
        console.error('Erro ao cadastrar gênero:', erro);
        this.salvando = false;

        if (erro.status === 401 || erro.status === 403) {
          this.erro =
            'Você não tem permissão para cadastrar gêneros. Confira seu login e seu nível de acesso.';
        } else if (erro.status === 422) {
          this.erro =
            Object.values(erro.error?.errors ?? {}).flat().join(' ') ||
            erro.error?.erro ||
            erro.error?.message ||
            'Confira os dados enviados.';
        } else {
          this.erro =
            erro.error?.erro ||
            erro.error?.message ||
            'Não foi possível cadastrar o gênero no banco de dados.';
        }
      }
    });
  }

  gerenciarCategorias(): void {
    this.dialogRef.close({
      acao: 'gerenciar'
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
