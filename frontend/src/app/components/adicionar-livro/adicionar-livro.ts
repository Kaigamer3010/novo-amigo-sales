
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  Component,
  afterNextRender,
  ChangeDetectorRef,
  EventEmitter,
  Output,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef
} from '@angular/material/dialog';

interface Genero {
  id: number;
  genero: string;
}

interface DadosDialogo {
  modo?: 'editar';
  livro?: any;
}

interface DadosLivro {
  titulo: string;
  sinopse?: string;
  autores: string[] | string;
  ano_publicacao: string | number;
  imagem?: string;
  isbn: string;
}

@Component({
  selector: 'app-adicionar-livro',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './adicionar-livro.html',
  styleUrl: './adicionar-livro.css'
})
export class AdicionarLivro {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  private dialogRef = inject(MatDialogRef<AdicionarLivro>, {
    optional: true
  });

  private dadosDialogo = inject(MAT_DIALOG_DATA, {
    optional: true
  }) as DadosDialogo | null;

  @Output() livroSalvo = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  private apiUrl = 'http://127.0.0.1:8000/api';
  private generoInicialId: number | null = null;

  editando = false;
  livroId: number | null = null;

  isbn = '';
  titulo = '';
  autor = '';
  anoPublicacao = '';
  sinopse = '';
  imagem = '';

  tituloBusca = '';
  resultadosBusca: DadosLivro[] = [];
  buscandoPorTitulo = false;

  generos: Genero[] = [];
  generoSelecionado: number | null = null;

  quantidadeExemplares = 1;
  localizacoes = '';

  carregandoBusca = false;
  salvando = false;
  mensagemErro = '';
  mensagemSucesso = '';

  constructor() {
    const livro = this.dadosDialogo?.livro;

    if (this.dadosDialogo?.modo === 'editar' && livro) {
      this.editando = true;
      this.livroId = Number(livro.id);

      this.isbn = String(livro.isbn ?? '');
      this.titulo = String(livro.titulo ?? '');

      this.autor = Array.isArray(livro.autores)
        ? livro.autores.join(', ')
        : String(livro.autores ?? '');

      this.anoPublicacao = String(
        livro.ano_publicacao ?? ''
      ).slice(0, 4);

      this.sinopse = String(livro.sinopse ?? '');
      this.imagem = String(livro.imagem ?? '');
      this.localizacoes = String(livro.localizacoes ?? '');

      this.quantidadeExemplares = Number(
        livro.quantidade_exemplares ??
        livro.total_exemplares ??
        1
      );

      const primeiroGenero = Array.isArray(livro.generos)
        ? livro.generos[0]
        : null;

      this.generoInicialId = primeiroGenero?.id
        ? Number(primeiroGenero.id)
        : null;
    }

    afterNextRender(() => {
      this.carregarGeneros();
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

  fecharFormulario(): void {
    if (this.dialogRef) {
      this.dialogRef.close(false);
    } else {
      this.cancelar.emit();
    }
  }

  carregarGeneros(): void {
    this.http.get<Genero[]>(`${this.apiUrl}/generos`).subscribe({
      next: (resposta) => {
        this.generos = Array.isArray(resposta)
          ? resposta
          : [];

        if (this.editando) {
          const livro = this.dadosDialogo?.livro;

          const categoriaAtual = String(
            livro?.categoria ?? ''
          ).trim().toLocaleLowerCase();

          const genero = this.generos.find(
            item => item.id === this.generoInicialId
          ) ?? this.generos.find(
            item =>
              item.genero.trim().toLocaleLowerCase() === categoriaAtual
          );

          this.generoSelecionado = genero?.id ?? null;
        }

        this.cdr.markForCheck();
      },
      error: (erro) => {
        console.error('Erro ao carregar gêneros:', erro);

        this.mensagemErro =
          erro.error?.erro ??
          erro.error?.message ??
          'Não foi possível carregar os gêneros. Verifique se o Laravel está funcionando.';

        this.cdr.markForCheck();
      }
    });
  }

  buscarLivro(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    const isbnLimpo = this.isbn.trim();

    if (!isbnLimpo) {
      this.mensagemErro =
        'Digite o ISBN do livro antes de buscar.';
      return;
    }

    this.carregandoBusca = true;

    this.http.get<DadosLivro>(
      `${this.apiUrl}/livros/buscar-isbn/${encodeURIComponent(isbnLimpo)}`
    ).subscribe({
      next: (livro) => {
        this.preencherFormulario(livro);

        this.carregandoBusca = false;
        this.mensagemSucesso = 'Dados do livro encontrados!';

        this.cdr.markForCheck();
      },
      error: (erro) => {
        console.error('Erro ao buscar livro por ISBN:', erro);

        this.carregandoBusca = false;

        this.mensagemErro =
          erro.error?.erro ??
          erro.error?.message ??
          'Não foi possível encontrar o livro. Verifique o ISBN e tente novamente.';

        this.cdr.markForCheck();
      }
    });
  }

  buscarPorTitulo(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';
    this.resultadosBusca = [];

    const tituloLimpo = this.tituloBusca.trim();

    if (!tituloLimpo) {
      this.mensagemErro =
        'Digite o título do livro que deseja pesquisar.';
      return;
    }

    this.buscandoPorTitulo = true;

    this.http.get<DadosLivro[]>(
      `${this.apiUrl}/livros/buscar-titulo/${encodeURIComponent(tituloLimpo)}`
    ).subscribe({
      next: (resposta) => {
        this.resultadosBusca = Array.isArray(resposta)
          ? resposta
          : [];

        this.buscandoPorTitulo = false;

        if (this.resultadosBusca.length === 0) {
          this.mensagemErro =
            'Nenhum livro foi encontrado com esse título.';
        }

        this.cdr.markForCheck();
      },
      error: (erro) => {
        console.error('Erro ao buscar livro por título:', erro);

        this.buscandoPorTitulo = false;

        this.mensagemErro =
          erro.error?.erro ??
          erro.error?.message ??
          'Não foi possível pesquisar pelo título. Verifique se o Laravel está funcionando.';

        this.cdr.markForCheck();
      }
    });
  }

  selecionarLivro(livro: DadosLivro): void {
    this.preencherFormulario(livro);

    this.resultadosBusca = [];
    this.tituloBusca = livro.titulo;

    this.mensagemErro = '';
    this.mensagemSucesso =
      'Livro selecionado! Confira os dados antes de salvar.';

    this.cdr.markForCheck();
  }

  private preencherFormulario(livro: DadosLivro): void {
    this.titulo = livro.titulo ?? '';

    this.autor = Array.isArray(livro.autores)
      ? livro.autores.join(', ')
      : String(livro.autores ?? '');

    this.anoPublicacao = String(
      livro.ano_publicacao ?? ''
    ).slice(0, 4);

    this.sinopse = livro.sinopse ?? '';
    this.imagem = livro.imagem ?? '';
    this.isbn = livro.isbn ?? '';
  }

  adicionarLivro(): void {
    this.mensagemErro = '';
    this.mensagemSucesso = '';

    const isbnLimpo = this.isbn.trim();
    const tituloLimpo = this.titulo.trim();
    const ano = String(this.anoPublicacao).trim();
    const quantidade = Number(this.quantidadeExemplares);

    if (!isbnLimpo || !tituloLimpo || !ano) {
      this.mensagemErro =
        'Preencha o ISBN, o título e o ano de publicação.';
      return;
    }

    if (!/^\d{4}$/.test(ano)) {
      this.mensagemErro =
        'O ano de publicação precisa ter quatro números.';
      return;
    }

    if (!Number.isInteger(quantidade) || quantidade < 1) {
      this.mensagemErro =
        'A quantidade de exemplares deve ser um número inteiro maior que zero.';
      return;
    }

    if (this.generoSelecionado === null) {
      this.mensagemErro =
        'Selecione um gênero para o livro.';
      return;
    }

    const genero = this.generos.find(
      item => item.id === Number(this.generoSelecionado)
    );

    if (!genero) {
      this.mensagemErro =
        'O gênero selecionado não foi encontrado. Atualize a lista e tente novamente.';
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      this.mensagemErro =
        'Sua sessão não foi encontrada. Entre novamente no sistema antes de salvar.';
      return;
    }

    if (this.editando && !this.livroId) {
      this.mensagemErro =
        'Não foi possível identificar o livro que será editado.';
      return;
    }

    const dados: any = {
      titulo: tituloLimpo,
      isbn: isbnLimpo,
      ano_publicacao: ano,
      autores: this.autor
        .split(',')
        .map(nome => nome.trim())
        .filter(nome => nome.length > 0),
      sinopse: this.sinopse.trim() || null,
      imagem: this.imagem.trim() || null,
      categoria: genero.genero,
      generos: [genero.id],
      quantidade_exemplares: quantidade,
      localizacoes: this.localizacoes.trim() || null
    };

    if (!this.editando) {
      dados.disponibilidade = true;
    }

    this.salvando = true;

    const requisicao = this.editando
      ? this.http.put(
        `${this.apiUrl}/livros/${this.livroId}`,
        dados,
        this.opcoesRequisicao()
      )
      : this.http.post(
        `${this.apiUrl}/livros`,
        dados,
        this.opcoesRequisicao()
      );

    requisicao.subscribe({
      next: (resposta) => {
        console.log(
          this.editando
            ? 'Livro atualizado no Laravel:'
            : 'Livro cadastrado no Laravel:',
          resposta
        );

        this.salvando = false;

        this.mensagemSucesso = this.editando
          ? 'Livro atualizado com sucesso!'
          : 'Livro cadastrado com sucesso!';

        this.cdr.markForCheck();

        if (this.dialogRef) {
          this.dialogRef.close(true);
        } else {
          this.livroSalvo.emit();
        }
      },
      error: (erro) => {
        console.error('Erro ao salvar livro:', erro);

        this.salvando = false;

        if (erro.status === 401) {
          this.mensagemErro =
            'Sua sessão expirou ou o token não foi aceito. Entre novamente no sistema.';
        } else if (erro.status === 403) {
          this.mensagemErro =
            'Seu usuário não tem permissão para salvar livros. É necessário ter acesso de administrador ou bibliotecário.';
        } else if (erro.status === 422) {
          const errosValidacao = erro.error?.errors;

          this.mensagemErro = errosValidacao
            ? Object.values(errosValidacao).flat().join(' ')
            : erro.error?.erro ??
            erro.error?.message ??
            'Confira os dados preenchidos.';
        } else {
          this.mensagemErro =
            erro.error?.erro ??
            erro.error?.message ??
            `Não foi possível ${this.editando ? 'atualizar' : 'cadastrar'} o livro.`;
        }

        this.cdr.markForCheck();
      }
    });
  }

  autoresDoLivro(livro: DadosLivro): string {
    return Array.isArray(livro.autores)
      ? livro.autores.join(', ')
      : String(livro.autores ?? '');
  }


  limparFormulario(): void {
    this.isbn = '';
    this.titulo = '';
    this.autor = '';
    this.anoPublicacao = '';
    this.sinopse = '';
    this.imagem = '';

    this.tituloBusca = '';
    this.resultadosBusca = [];
    this.buscandoPorTitulo = false;
    this.carregandoBusca = false;

    this.quantidadeExemplares = 1;
    this.localizacoes = '';

    this.generoSelecionado = this.editando
      ? this.generoInicialId
      : null;

    this.mensagemErro = '';
    this.mensagemSucesso = '';

    this.cdr.markForCheck();
  }

}
