
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { LivrosService } from '../../service/livros';
import { AdicionarLivro } from '../../components/adicionar-livro/adicionar-livro';
import { AdicionarCategoria } from '../../components/adicionar-categoria/adicionar-categoria';
import { GerenciarCategorias } from '../../components/gerenciar-categorias/gerenciar-categorias';

type SecaoDashboard = 'inicio' | 'emprestimos' | 'atrasados';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, MatDialogModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private dialog = inject(MatDialog);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  private apiUrl = 'http://127.0.0.1:8000/api';
  private apiGeneros = `${this.apiUrl}/generos`;

  secaoAtual: SecaoDashboard = 'inicio';

  livrosRecentes: any[] = [];
  todosLivros: any[] = [];
  categorias: string[] = [];

  emprestimos: any[] = [];
  emprestimosAtrasados: any[] = [];

  totalLivros = 0;
  livrosDisponiveis = 0;
  livrosIndisponiveis = 0;
  totalCategorias = 0;

  nomeAluno = '';
  livroSelecionadoId: number | null = null;

  carregandoEmprestimos = false;
  salvandoEmprestimo = false;

  mensagemEmprestimoErro = '';
  mensagemEmprestimoSucesso = '';

  constructor(private livrosService: LivrosService) { }

  ngOnInit(): void {
    this.carregarLivrosRecentes();
    this.carregarCategorias();
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

  private erroApi(erro: any, mensagemPadrao: string): string {
    if (erro?.status === 401) {
      return 'Sua sessão expirou ou o token não foi aceito. Entre novamente no sistema.';
    }

    if (erro?.status === 403) {
      return 'Seu usuário não tem permissão para realizar esta operação.';
    }

    const errosValidacao = erro?.error?.errors;

    if (errosValidacao) {
      return Object.values(errosValidacao).flat().join(' ');
    }

    return erro?.error?.erro
      ?? erro?.error?.message
      ?? mensagemPadrao;
  }

  mudarSecao(secao: SecaoDashboard): void {
    this.secaoAtual = secao;
    this.mensagemEmprestimoErro = '';
    this.mensagemEmprestimoSucesso = '';

    if (secao === 'emprestimos') {
      this.carregarLivrosRecentes();
      this.carregarEmprestimos();
      this.carregarEmprestimosAtrasados();
    }

    if (secao === 'atrasados') {
      this.carregarEmprestimosAtrasados();
    }

    this.cdr.detectChanges();
  }

  carregarLivrosRecentes(): void {
    this.livrosService.obterLivros().subscribe({
      next: (resposta: any) => {
        const livros = Array.isArray(resposta)
          ? resposta
          : resposta?.data ?? [];

        const livrosFormatados = livros.map((livro: any) => {
          const disponibilidade = String(
            livro.disponibilidade ?? ''
          ).trim().toLowerCase();

          const quantidadeDisponivel =
            livro.quantidade_disponivel !== undefined &&
              livro.quantidade_disponivel !== null
              ? Number(livro.quantidade_disponivel)
              : (
                disponibilidade === 'disponível' ||
                  disponibilidade === 'disponivel' ||
                  disponibilidade === '1' ||
                  disponibilidade === 'true'
                  ? 1
                  : 0
              );

          const quantidadeEmprestada =
            livro.quantidade_emprestada !== undefined &&
              livro.quantidade_emprestada !== null
              ? Number(livro.quantidade_emprestada)
              : Math.max(
                0,
                Number(livro.quantidade_exemplares ?? 0) -
                quantidadeDisponivel
              );

          const generos = Array.isArray(livro.generos)
            ? livro.generos
              .map((genero: any) =>
                typeof genero === 'string'
                  ? genero
                  : genero?.genero
              )
              .filter(Boolean)
            : [];

          return {
            ...livro,
            autor: Array.isArray(livro.autores)
              ? livro.autores.join(', ')
              : livro.autores ?? '',
            categoria: generos.join(', ') || livro.categoria || '',
            quantidadeDisponivel,
            quantidadeEmprestada,
            disponivel: quantidadeDisponivel > 0
          };
        });

        const ordenados = [...livrosFormatados].sort(
          (a: any, b: any) => Number(b.id) - Number(a.id)
        );

        this.todosLivros = ordenados;
        this.livrosRecentes = ordenados.slice(0, 5);

        this.totalLivros = ordenados.length;

        // Soma todos os exemplares físicos que continuam disponíveis.
        this.livrosDisponiveis = ordenados.reduce(
          (total: number, livro: any) =>
            total + Number(livro.quantidadeDisponivel || 0),
          0
        );

        // Soma todos os exemplares físicos atualmente emprestados.
        this.livrosIndisponiveis = ordenados.reduce(
          (total: number, livro: any) =>
            total + Number(livro.quantidadeEmprestada || 0),
          0
        );

        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro ao carregar livros:', erro);
      }
    });
  }

  get livrosParaEmprestimo(): any[] {
    return this.todosLivros.filter(
      livro => Number(livro.quantidadeDisponivel) > 0
    );
  }

  carregarCategorias(): void {
    this.http.get<any[]>(this.apiGeneros).subscribe({
      next: (generos) => {
        this.categorias = generos.map(
          (genero: any) => genero.genero
        );

        this.totalCategorias = this.categorias.length;
        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro ao carregar categorias:', erro);
      }
    });
  }

  abrirAdicionarLivro(): void {
    this.dialog.open(AdicionarLivro, {
      width: '650px',
      height: 'auto',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: false,
      panelClass: 'gerenciar-avisos-dialog'
    }).afterClosed().subscribe((resultado) => {
      if (resultado) {
        this.carregarLivrosRecentes();
      }
    });
  }

  aoCadastrarLivro(): void {
    this.carregarLivrosRecentes();
    this.mudarSecao('inicio');
  }

  editarLivro(livro: any): void {
    if (!livro?.id) {
      window.alert('Não foi possível identificar o livro selecionado.');
      return;
    }

    this.dialog.open(AdicionarLivro, {
      width: '650px',
      height: 'auto',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: false,
      panelClass: 'gerenciar-avisos-dialog',
      data: {
        modo: 'editar',
        livro
      }
    }).afterClosed().subscribe((resultado) => {
      if (resultado) {
        this.carregarLivrosRecentes();
      }
    });
  }

  excluirLivro(id: number): void {
    const livro = this.todosLivros.find(
      item => Number(item.id) === Number(id)
    );

    if (!livro) {
      window.alert('Não foi possível localizar esse livro na lista.');
      return;
    }

    const confirmar = window.confirm(
      `Deseja realmente excluir o livro "${livro.titulo}"? Esta ação não poderá ser desfeita.`
    );

    if (!confirmar) {
      return;
    }

    this.http.delete(
      `${this.apiUrl}/livros/${id}`,
      this.opcoesRequisicao()
    ).subscribe({
      next: () => {
        window.alert('Livro excluído com sucesso!');
        this.carregarLivrosRecentes();
      },
      error: (erro) => {
        console.error('Erro ao excluir livro:', erro);

        window.alert(
          this.erroApi(
            erro,
            'Não foi possível excluir o livro. Ele pode estar relacionado a empréstimos ou a API retornou um erro.'
          )
        );
      }
    });
  }

  abrirAdicionarCategoria(): void {
    this.dialog.open(AdicionarCategoria, {
      width: '450px',
      maxWidth: '95vw',
      autoFocus: false,
      data: {
        categorias: this.categorias
      }
    }).afterClosed().subscribe((resultado) => {
      if (!resultado) {
        return;
      }

      if (resultado.acao === 'adicionar') {
        this.carregarCategorias();
      }

      if (resultado.acao === 'gerenciar') {
        this.abrirGerenciarCategorias();
      }
    });
  }

  abrirGerenciarCategorias(): void {
    this.dialog.open(GerenciarCategorias, {
      width: '500px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: false,
      data: {
        categorias: this.categorias
      }
    }).afterClosed().subscribe(() => {
      this.carregarCategorias();
    });
  }

  carregarEmprestimos(): void {
    this.carregandoEmprestimos = true;

    this.http.get<any[]>(
      `${this.apiUrl}/emprestimos`,
      this.opcoesRequisicao()
    ).subscribe({
      next: (resposta: any) => {
        this.emprestimos = Array.isArray(resposta)
          ? resposta
          : resposta?.data ?? [];

        this.carregandoEmprestimos = false;
        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro ao carregar empréstimos:', erro);

        this.carregandoEmprestimos = false;
        this.mensagemEmprestimoErro = this.erroApi(
          erro,
          'Não foi possível carregar os empréstimos.'
        );

        this.cdr.detectChanges();
      }
    });
  }

  carregarEmprestimosAtrasados(): void {
    this.http.get<any[]>(
      `${this.apiUrl}/emprestimos-atrasados`,
      this.opcoesRequisicao()
    ).subscribe({
      next: (resposta: any) => {
        this.emprestimosAtrasados = Array.isArray(resposta)
          ? resposta
          : resposta?.data ?? [];

        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro ao carregar empréstimos atrasados:', erro);

        this.mensagemEmprestimoErro = this.erroApi(
          erro,
          'Não foi possível carregar a lista de atrasados.'
        );

        this.cdr.detectChanges();
      }
    });
  }

  registrarEmprestimo(): void {
    this.mensagemEmprestimoErro = '';
    this.mensagemEmprestimoSucesso = '';

    const nome = this.nomeAluno.trim();

    if (!nome) {
      this.mensagemEmprestimoErro = 'Informe o nome do aluno.';
      return;
    }

    if (this.livroSelecionadoId === null) {
      this.mensagemEmprestimoErro = 'Selecione um livro disponível.';
      return;
    }

    const livroSelecionado = this.todosLivros.find(
      livro => Number(livro.id) === Number(this.livroSelecionadoId)
    );

    if (
      !livroSelecionado ||
      Number(livroSelecionado.quantidadeDisponivel) < 1
    ) {
      this.mensagemEmprestimoErro =
        'Esse livro não tem exemplares disponíveis para empréstimo.';

      this.carregarLivrosRecentes();
      return;
    }

    this.salvandoEmprestimo = true;

    const dados = {
      livro_id: Number(this.livroSelecionadoId),
      nome_aluno: nome
    };

    this.http.post(
      `${this.apiUrl}/emprestimos`,
      dados,
      this.opcoesRequisicao()
    ).subscribe({
      next: () => {
        this.salvandoEmprestimo = false;
        this.nomeAluno = '';
        this.livroSelecionadoId = null;

        this.mensagemEmprestimoSucesso =
          'Empréstimo registrado com sucesso!';

        this.carregarLivrosRecentes();
        this.carregarEmprestimos();
        this.carregarEmprestimosAtrasados();
        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro ao registrar empréstimo:', erro);

        this.salvandoEmprestimo = false;
        this.mensagemEmprestimoErro = this.erroApi(
          erro,
          'Não foi possível registrar o empréstimo.'
        );

        this.carregarLivrosRecentes();
        this.cdr.detectChanges();
      }
    });
  }

  devolverEmprestimo(emprestimo: any): void {
    if (emprestimo.data_devolucao) {
      return;
    }

    const confirmar = window.confirm(
      `Confirmar a devolução do livro "${emprestimo.livro?.titulo ?? 'selecionado'}"?`
    );

    if (!confirmar) {
      return;
    }

    this.http.patch(
      `${this.apiUrl}/emprestimos/${emprestimo.id}/devolver`,
      {},
      this.opcoesRequisicao()
    ).subscribe({
      next: () => {
        this.mensagemEmprestimoErro = '';
        this.mensagemEmprestimoSucesso =
          'Devolução registrada com sucesso!';

        this.carregarLivrosRecentes();
        this.carregarEmprestimos();
        this.carregarEmprestimosAtrasados();
        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro ao registrar devolução:', erro);

        this.mensagemEmprestimoErro = this.erroApi(
          erro,
          'Não foi possível registrar a devolução.'
        );

        this.cdr.detectChanges();
      }
    });
  }

  estaAtrasado(emprestimo: any): boolean {
    if (emprestimo.data_devolucao) {
      return false;
    }

    return this.emprestimosAtrasados.some(
      item => Number(item.id) === Number(emprestimo.id)
    );
  }
}
