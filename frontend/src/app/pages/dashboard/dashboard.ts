
import {
  Component,
  OnInit,
  LOCALE_ID,
  inject,
  ChangeDetectorRef
} from '@angular/core';

import {
  DatePipe,
  registerLocaleData
} from '@angular/common';

import localePt from '@angular/common/locales/pt';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { LivrosService } from '../../service/livros';
import { AdicionarLivro } from '../../components/adicionar-livro/adicionar-livro';
import { AdicionarCategoria } from '../../components/adicionar-categoria/adicionar-categoria';
import { GerenciarCategorias } from '../../components/gerenciar-categorias/gerenciar-categorias';
import { GerenciarLivros } from '../../components/gerenciar-livros/gerenciar-livros';
import { environment } from '../../../environments/environment';

registerLocaleData(localePt);

type SecaoDashboard = 'inicio' | 'emprestimos' | 'atrasados';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, MatDialogModule, DatePipe],
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private dialog = inject(MatDialog);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  private apiUrl = environment.baseUrl + '/api';
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

  buscaLivroEmprestimo = '';
  mostrarResultadosLivros = false;

  dataEmprestimo = this.dataHojeLocal();
  prazoDevolucaoDias = 7;

  buscaEmprestimos = '';
  buscaAtrasados = '';

  carregandoEmprestimos = false;
  salvandoEmprestimo = false;

  mensagemEmprestimoErro = '';
  mensagemEmprestimoSucesso = '';

  constructor(private livrosService: LivrosService) {}

  ngOnInit(): void {
    this.carregarLivrosRecentes();
    this.carregarCategorias();
    this.carregarEmprestimos();
    this.carregarEmprestimosAtrasados();
  }

  private atualizarTela(): void {
    this.cdr.detectChanges();
  }

  private dataHojeLocal(): string {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  get dataDevolucaoPrevistaCalculada(): string {
    if (
      !this.dataEmprestimo ||
      !Number.isInteger(Number(this.prazoDevolucaoDias)) ||
      Number(this.prazoDevolucaoDias) < 1 ||
      Number(this.prazoDevolucaoDias) > 365
    ) {
      return '—';
    }

    const [ano, mes, dia] = this.dataEmprestimo.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);

    data.setDate(data.getDate() + Number(this.prazoDevolucaoDias));

    return data.toLocaleDateString('pt-BR');
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

  private emprestimoEstaAtivo(emprestimo: any): boolean {
    if (!emprestimo) {
      return false;
    }

    const dataDevolucao = emprestimo.data_devolucao;

    if (
      dataDevolucao !== null &&
      dataDevolucao !== undefined &&
      dataDevolucao !== ''
    ) {
      return false;
    }

    if (
      emprestimo.devolvido === true ||
      Number(emprestimo.devolvido) === 1
    ) {
      return false;
    }

    const status = String(
      emprestimo.status ?? emprestimo.situacao ?? ''
    ).trim().toLocaleLowerCase('pt-BR');

    if (
      ['devolvido', 'devolvida', 'finalizado', 'finalizada'].includes(status)
    ) {
      return false;
    }

    return true;
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

    this.atualizarTela();
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
          ).trim().toLocaleLowerCase('pt-BR');

          const quantidadeDisponivel =
            livro.quantidade_disponivel !== undefined &&
            livro.quantidade_disponivel !== null
              ? Number(livro.quantidade_disponivel)
              : (
                  ['disponível', 'disponivel', '1', 'true'].includes(
                    disponibilidade
                  )
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

        this.livrosDisponiveis = ordenados.reduce(
          (total: number, livro: any) =>
            total + Number(livro.quantidadeDisponivel || 0),
          0
        );

        this.livrosIndisponiveis = ordenados.reduce(
          (total: number, livro: any) =>
            total + Number(livro.quantidadeEmprestada || 0),
          0
        );

        const selecionado = this.todosLivros.find(
          (livro: any) =>
            Number(livro.id) === Number(this.livroSelecionadoId)
        );

        if (
          this.livroSelecionadoId !== null &&
          (!selecionado || selecionado.quantidadeDisponivel < 1)
        ) {
          this.limparLivroSelecionado();
        }

        this.atualizarTela();
      },
      error: (erro) => {
        console.error('Erro ao carregar livros:', erro);
        this.atualizarTela();
      }
    });
  }

  get livrosParaEmprestimo(): any[] {
    return this.todosLivros.filter(
      (livro: any) => Number(livro.quantidadeDisponivel) > 0
    );
  }

  get livrosEncontradosParaEmprestimo(): any[] {
    const termo = this.normalizarTexto(this.buscaLivroEmprestimo);

    if (!termo || this.livroSelecionadoId !== null) {
      return [];
    }

    return this.livrosParaEmprestimo
      .filter((livro: any) => {
        const titulo = this.normalizarTexto(livro.titulo);
        const isbn = this.obterIsbn(livro);

        return titulo.includes(termo) || isbn.includes(termo);
      })
      .slice(0, 10);
  }

  selecionarLivroEmprestimo(livro: any): void {
    if (!livro || Number(livro.quantidadeDisponivel) < 1) {
      this.mensagemEmprestimoErro =
        'Esse livro não tem exemplares disponíveis para empréstimo.';
      return;
    }

    this.livroSelecionadoId = Number(livro.id);
    this.buscaLivroEmprestimo = livro.titulo;
    this.mostrarResultadosLivros = false;

    this.mensagemEmprestimoErro = '';
    this.mensagemEmprestimoSucesso = '';
  }

  limparLivroSelecionado(): void {
    this.livroSelecionadoId = null;
    this.buscaLivroEmprestimo = '';
    this.mostrarResultadosLivros = false;
  }

  aoAlterarBuscaLivro(): void {
    this.livroSelecionadoId = null;
    this.mostrarResultadosLivros =
      this.normalizarTexto(this.buscaLivroEmprestimo).length > 0;

    this.mensagemEmprestimoErro = '';
  }

  get emprestimosFiltrados(): any[] {
    const termo = this.normalizarTexto(this.buscaEmprestimos);

    if (!termo) {
      return this.emprestimos;
    }

    return this.emprestimos.filter((emprestimo: any) => {
      const nomeAluno = this.normalizarTexto(
        emprestimo.nome_aluno ??
        emprestimo.aluno?.nome ??
        emprestimo.usuario?.nome ??
        emprestimo.nome_completo ??
        ''
      );

      const tituloLivro = this.normalizarTexto(
        emprestimo.livro?.titulo ??
        emprestimo.titulo_livro ??
        emprestimo.livro_titulo ??
        ''
      );

      const isbn = this.obterIsbn(emprestimo.livro);

      return (
        nomeAluno.includes(termo) ||
        tituloLivro.includes(termo) ||
        isbn.includes(termo)
      );
    });
  }

  get emprestimosAtrasadosFiltrados(): any[] {
    const termo = this.normalizarTexto(this.buscaAtrasados);

    if (!termo) {
      return this.emprestimosAtrasados;
    }

    return this.emprestimosAtrasados.filter((emprestimo: any) => {
      const nomeAluno = this.normalizarTexto(
        emprestimo.nome_aluno ??
        emprestimo.aluno?.nome ??
        emprestimo.usuario?.nome ??
        emprestimo.nome_completo ??
        ''
      );

      const tituloLivro = this.normalizarTexto(
        emprestimo.livro?.titulo ??
        emprestimo.titulo_livro ??
        emprestimo.livro_titulo ??
        ''
      );

      const isbn = this.obterIsbn(emprestimo.livro);

      return (
        nomeAluno.includes(termo) ||
        tituloLivro.includes(termo) ||
        isbn.includes(termo)
      );
    });
  }

  private obterIsbn(livro: any): string {
    if (!livro) {
      return '';
    }

    return this.normalizarTexto(
      livro.isbn ??
      livro.ISBN ??
      livro.isbn13 ??
      livro.isbn_13 ??
      livro.codigo_isbn ??
      livro.codigoIsbn ??
      ''
    );
  }

  private normalizarTexto(valor: unknown): string {
    return String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLocaleLowerCase('pt-BR');
  }

  abrirGerenciarLivros(): void {
    this.dialog.open(GerenciarLivros, {
      width: '1100px',
      maxWidth: '96vw',
      maxHeight: '90vh',
      autoFocus: false,
      panelClass: 'gerenciar-avisos-dialog',
      data: {
        obterLivros: () => this.todosLivros,
        editarLivro: (livro: any) => this.editarLivro(livro),
        excluirLivro: (id: number) => this.excluirLivro(id)
      }
    });
  }

  carregarCategorias(): void {
    this.http.get<any[]>(
      this.apiGeneros,
      this.opcoesRequisicao()
    ).subscribe({
      next: (resposta: any) => {
        const generos = Array.isArray(resposta)
          ? resposta
          : resposta?.data ?? [];

        this.categorias = generos
          .map((genero: any) => genero.genero)
          .filter(Boolean);

        this.totalCategorias = this.categorias.length;
        this.atualizarTela();
      },
      error: (erro) => {
        console.error('Erro ao carregar categorias:', erro);
        this.atualizarTela();
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
      (item: any) => Number(item.id) === Number(id)
    );

    if (!livro) {
      window.alert('Não foi possível localizar esse livro na lista.');
      return;
    }

    const confirmar = window.confirm(
      `Deseja retirar "${livro.titulo}" do catálogo?\n\n` +
      'Se houver histórico de empréstimos, o livro será arquivado ' +
      'para preservar os registros. Se houver um empréstimo em aberto, ' +
      'a operação será bloqueada.'
    );

    if (!confirmar) {
      return;
    }

    this.http.delete<any>(
      `${this.apiUrl}/livros/${id}`,
      this.opcoesRequisicao()
    ).subscribe({
      next: (resposta) => {
        window.alert(
          resposta?.mensagem ?? 'Operação concluída com sucesso!'
        );
        this.carregarLivrosRecentes();
      },
      error: (erro) => {
        console.error('Erro ao excluir ou arquivar livro:', erro);

        window.alert(
          this.erroApi(
            erro,
            'Não foi possível retirar o livro do catálogo.'
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

    this.http.get<any>(
      `${this.apiUrl}/emprestimos`,
      this.opcoesRequisicao()
    ).subscribe({
      next: (resposta: any) => {
        const lista = Array.isArray(resposta)
          ? resposta
          : resposta?.data ?? [];

        this.emprestimos = lista.filter(
          (emprestimo: any) => this.emprestimoEstaAtivo(emprestimo)
        );

        this.carregandoEmprestimos = false;
        this.atualizarTela();
      },
      error: (erro) => {
        console.error('Erro ao carregar empréstimos:', erro);

        this.carregandoEmprestimos = false;
        this.mensagemEmprestimoErro = this.erroApi(
          erro,
          'Não foi possível carregar os empréstimos.'
        );

        this.atualizarTela();
      }
    });
  }

  carregarEmprestimosAtrasados(): void {
    this.http.get<any>(
      `${this.apiUrl}/emprestimos-atrasados`,
      this.opcoesRequisicao()
    ).subscribe({
      next: (resposta: any) => {
        const lista = Array.isArray(resposta)
          ? resposta
          : resposta?.data ?? [];

        this.emprestimosAtrasados = lista.filter(
          (emprestimo: any) => this.emprestimoEstaAtivo(emprestimo)
        );

        this.atualizarTela();
      },
      error: (erro) => {
        console.error('Erro ao carregar empréstimos atrasados:', erro);

        this.mensagemEmprestimoErro = this.erroApi(
          erro,
          'Não foi possível carregar a lista de atrasados.'
        );

        this.atualizarTela();
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

    if (!this.dataEmprestimo) {
      this.mensagemEmprestimoErro = 'Selecione a data do empréstimo.';
      return;
    }

    if (
      !Number.isInteger(Number(this.prazoDevolucaoDias)) ||
      Number(this.prazoDevolucaoDias) < 1 ||
      Number(this.prazoDevolucaoDias) > 365
    ) {
      this.mensagemEmprestimoErro =
        'Informe um prazo entre 1 e 365 dias.';
      return;
    }

    const livroSelecionado = this.todosLivros.find(
      (livro: any) =>
        Number(livro.id) === Number(this.livroSelecionadoId)
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
      nome_aluno: nome,
      data_emprestimo: this.dataEmprestimo,
      prazo_devolucao_dias: Number(this.prazoDevolucaoDias)
    };

    this.http.post(
      `${this.apiUrl}/emprestimos`,
      dados,
      this.opcoesRequisicao()
    ).subscribe({
      next: () => {
        this.salvandoEmprestimo = false;
        this.nomeAluno = '';
        this.limparLivroSelecionado();
        this.dataEmprestimo = this.dataHojeLocal();
        this.prazoDevolucaoDias = 7;

        this.mensagemEmprestimoSucesso =
          'Empréstimo registrado com sucesso!';

        this.carregarLivrosRecentes();
        this.carregarEmprestimos();
        this.carregarEmprestimosAtrasados();
        this.atualizarTela();
      },
      error: (erro) => {
        console.error('Erro ao registrar empréstimo:', erro);

        this.salvandoEmprestimo = false;
        this.mensagemEmprestimoErro = this.erroApi(
          erro,
          'Não foi possível registrar o empréstimo.'
        );

        this.carregarLivrosRecentes();
        this.atualizarTela();
      }
    });
  }

  devolverEmprestimo(emprestimo: any): void {
    if (!this.emprestimoEstaAtivo(emprestimo)) {
      return;
    }

    const nomeLivro =
      emprestimo.livro?.titulo ??
      emprestimo.titulo_livro ??
      emprestimo.livro_titulo ??
      'selecionado';

    const confirmar = window.confirm(
      `Confirmar a devolução do livro "${nomeLivro}"?`
    );

    if (!confirmar) {
      return;
    }

    this.mensagemEmprestimoErro = '';
    this.mensagemEmprestimoSucesso = '';

    this.http.patch(
      `${this.apiUrl}/emprestimos/${emprestimo.id}/devolver`,
      {},
      this.opcoesRequisicao()
    ).subscribe({
      next: () => {
        this.emprestimos = this.emprestimos.filter(
          (item: any) => Number(item.id) !== Number(emprestimo.id)
        );

        this.emprestimosAtrasados = this.emprestimosAtrasados.filter(
          (item: any) => Number(item.id) !== Number(emprestimo.id)
        );

        this.mensagemEmprestimoSucesso =
          'Devolução registrada com sucesso!';

        this.carregarLivrosRecentes();
        this.carregarEmprestimos();
        this.carregarEmprestimosAtrasados();
        this.atualizarTela();
      },
      error: (erro) => {
        console.error('Erro ao registrar devolução:', erro);

        this.mensagemEmprestimoErro = this.erroApi(
          erro,
          'Não foi possível registrar a devolução.'
        );

        this.atualizarTela();
      }
    });
  }

  estaAtrasado(emprestimo: any): boolean {
    if (!this.emprestimoEstaAtivo(emprestimo)) {
      return false;
    }

    return this.emprestimosAtrasados.some(
      (item: any) => Number(item.id) === Number(emprestimo.id)
    );
  }
}
