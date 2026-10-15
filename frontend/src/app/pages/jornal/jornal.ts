import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Edicao } from '../../models/edicaoJornal';
import { Artigo } from '../../models/artigoJornal';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-jornal',
  standalone: true,
  imports: [MatPaginatorModule, FormsModule],
  templateUrl: './jornal.html',
  styleUrl: './jornal.css',
})
export class Jornal implements OnInit {

  private apiUrl = 'http://127.0.0.1:8000/api/noticias';
  private apiEdicoesUrl = 'http://127.0.0.1:8000/api/edicoes';


  edicoes: Edicao[] = [];

  filtroAtual: 'todos' | 'edicoes' | 'artigos' = 'todos';

  conteudosFiltrados: (Edicao | Artigo)[] = [];
  conteudosVisiveis: (Edicao | Artigo)[] = [];

  artigos: Artigo[] = [];

  busca = '';
  edicaoSelecionada: Edicao | null = null;

  paginaAtual = 0;
  tamanhoPagina = 5;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.carregarEdicoes();
    this.carregarArtigos();
  }

  carregarArtigos(): void {
    this.http.get<Artigo[]>(this.apiUrl).subscribe({
      next: (noticias) => {
        this.artigos = noticias.map((noticia) => ({
          ...noticia,
          capa: noticia.capa ?? '',
          pdf: noticia.pdf ?? ''
        }));

        console.log('Artigos recebidos do Laravel:', this.artigos);

        this.aplicarFiltros();
      },
      error: (erro) => {
        console.error('Erro ao carregar artigos:', erro);
        this.aplicarFiltros();
      }
    });
  }

  carregarEdicoes(): void {
    this.http.get<Edicao[]>(this.apiEdicoesUrl).subscribe({
      next: (edicoes) => {
        this.edicoes = edicoes.map((edicao) => ({
          ...edicao,
          capa: edicao.capa ?? '',
          pdf: edicao.pdf ?? ''
        }));

        console.log('Edições recebidas do Laravel:', this.edicoes);

        this.aplicarFiltros();
      },
      error: (erro) => {
        console.error('Erro ao carregar edições:', erro);
        this.aplicarFiltros();
      }
    });
  }

  urlPdf(item: Edicao | Artigo): string {
    if (!item.pdf) {
      return '';
    }

    if (item.pdf.startsWith('http://') ||
      item.pdf.startsWith('https://')) {
      return item.pdf;
    }

    const caminho = item.pdf.replace(/^\/+/, '');

    return `http://127.0.0.1:8000/storage/${caminho}`;
  }

  urlPdfSeguro(item: Edicao | Artigo): SafeResourceUrl | null {
    const url = this.urlPdf(item);

    if (!url) {
      return null;
    }

    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `${url}#page=1&toolbar=0&navpanes=0`
    );
  }

  atualizarPagina(): void {
    const inicio = this.paginaAtual * this.tamanhoPagina;
    const fim = inicio + this.tamanhoPagina;

    this.conteudosVisiveis = this.conteudosFiltrados.slice(inicio, fim);
  }

  mudarPagina(event: PageEvent): void {
    this.paginaAtual = event.pageIndex;
    this.tamanhoPagina = event.pageSize;
    this.atualizarPagina();
  }

  buscarEdicao(): void {
    this.aplicarFiltros();
  }

  selecionarEdicao(edicao: Edicao): void {
    this.edicaoSelecionada = edicao;
  }

  aplicarFiltros(): void {
    const termo = this.busca.toLocaleLowerCase().trim();

    let conteudos: (Edicao | Artigo)[];

    if (this.filtroAtual === 'todos') {
      conteudos = [...this.edicoes, ...this.artigos];
    } else if (this.filtroAtual === 'edicoes') {
      conteudos = [...this.edicoes];
    } else {
      conteudos = [...this.artigos];
    }

    this.conteudosFiltrados = conteudos.filter((item) =>
      item.titulo.toLocaleLowerCase().includes(termo) ||
      item.descricao.toLocaleLowerCase().includes(termo)
    );

    this.paginaAtual = 0;
    this.atualizarPagina();
  }

  deixarTodos(): void {
    this.filtroAtual = 'todos';
    this.aplicarFiltros();
  }

  deixarEdicoes(): void {
    this.filtroAtual = 'edicoes';
    this.aplicarFiltros();
  }

  deixarArtigos(): void {
    this.filtroAtual = 'artigos';
    this.aplicarFiltros();
  }
}
