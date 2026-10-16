import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, afterNextRender, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

interface Genero {
  id: number;
  genero: string;
}

interface DadosLivro {
  titulo: string;
  sinopse?: string;
  autores: string[];
  ano_publicacao: string;
  imagem?: string;
  isbn: string;
}

@Component({
  selector: 'app-adicionar-livro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './adicionar-livro.html',
  styleUrl: './adicionar-livro.css',
})
export class AdicionarLivro {
  private http = inject(HttpClient);
  private dialogRef = inject(MatDialogRef<AdicionarLivro>);
  private cdr = inject(ChangeDetectorRef);

  private apiUrl = 'http://127.0.0.1:8000/api';;

  isbn = '';
  titulo = '';
  autor = '';
  anoPublicacao = '';
  sinopse = '';
  imagem = '';

  generos: Genero[] = [];
  generoSelecionado: number | null = null;

  carregandoBusca = false;
  salvando = false;
  mensagemErro = '';
  mensagemSucesso = '';

  constructor() {
    afterNextRender(() => {
      this.carregarGeneros();
    });
  }
  
carregarGeneros(): void {
  this.http.get<Genero[]>(`${this.apiUrl}/generos`).subscribe({
    next: (resposta) => {
      this.generos = Array.isArray(resposta)
        ? resposta
        : (resposta as any)?.data ?? [];

      this.cdr.markForCheck();
    },
    error: (erro) => {
      console.error('Erro ao carregar gêneros:', erro);

      this.mensagemErro =
        'Não foi possível carregar as categorias. Verifique se o Laravel está funcionando.';

      this.cdr.markForCheck();
    },
  });
}


  
buscarLivro(): void {
  this.mensagemErro = '';
  this.mensagemSucesso = '';

  const isbnLimpo = this.isbn.trim();

  if (!isbnLimpo) {
    this.mensagemErro = 'Digite o ISBN do livro antes de buscar.';
    return;
  }

  this.carregandoBusca = true;

  this.http
    .get<DadosLivro>(
      `${this.apiUrl}/livros/buscar-isbn/${encodeURIComponent(isbnLimpo)}`
    )
    .subscribe({
      next: (livro) => {
        this.titulo = livro.titulo ?? '';

        this.autor = Array.isArray(livro.autores)
          ? livro.autores.join(', ')
          : String(livro.autores ?? '');

        this.anoPublicacao = livro.ano_publicacao ?? '';
        this.sinopse = livro.sinopse ?? '';
        this.imagem = livro.imagem ?? '';
        this.isbn = livro.isbn ?? isbnLimpo;

        this.carregandoBusca = false;
        this.mensagemSucesso = 'Dados do livro encontrados!';

        // Solicita a atualização automática da tela.
        this.cdr.markForCheck();
      },
      error: (erro) => {
        console.error('Erro ao buscar livro:', erro);

        this.carregandoBusca = false;
        this.mensagemErro =
          erro.error?.erro ??
          erro.error?.message ??
          'Não foi possível encontrar o livro. Verifique o ISBN e tente novamente.';

        this.cdr.markForCheck();
      },
    });
}


  adicionarLivro(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    if (!this.isbn.trim() || !this.titulo.trim() || !this.anoPublicacao.trim()) {
      this.mensagemErro =
        'Preencha o ISBN, o título e o ano de publicação. Use Buscar para preencher os dados.';
      return;
    }

    if (!/^\d{4}$/.test(this.anoPublicacao)) {
      this.mensagemErro = 'O ano de publicação precisa ter quatro números.';
      return;
    }

    if (!this.generoSelecionado) {
      this.mensagemErro = 'Selecione uma categoria para o livro.';
      return;
    }

    const genero = this.generos.find(
      (item) => item.id === Number(this.generoSelecionado)
    );

    const dados = {
      titulo: this.titulo.trim(),
      isbn: this.isbn.trim(),
      ano_publicacao: this.anoPublicacao,
      autores: this.autor
        .split(',')
        .map((nome) => nome.trim())
        .filter((nome) => nome.length > 0),
      sinopse: this.sinopse || null,
      imagem: this.imagem || null,
      categoria: genero?.genero ?? null,
      generos: [Number(this.generoSelecionado)],
      disponibilidade: true,
      quantidade_exemplares: 1,
      localizacoes: null,
    };

    this.salvando = true;

    this.http.post(`${this.apiUrl}/livros`, dados).subscribe({
      next: (resposta) => {
        console.log('Livro cadastrado:', resposta);
        this.salvando = false;
        this.mensagemSucesso = 'Livro cadastrado com sucesso!';
        this.dialogRef.close(true);
      },
      error: (erro) => {
        console.error('Erro ao cadastrar livro:', erro);
        this.salvando = false;

        if (erro.status === 422) {
          const errosValidacao = erro.error?.errors;
          this.mensagemErro = errosValidacao
            ? Object.values(errosValidacao).flat().join(' ')
            : erro.error?.message ?? 'Confira os dados preenchidos.';
        } else if (erro.status === 401 || erro.status === 403) {
          this.mensagemErro =
            'Você não tem autorização para cadastrar livros. Verifique o login e a permissão de bibliotecário/administrador.';
        } else {
          this.mensagemErro =
            erro.error?.message ??
            'Não foi possível cadastrar o livro. Confira se o Laravel está funcionando.';
        }
      },
    });
  }
}