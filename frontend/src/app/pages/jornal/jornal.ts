  import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
  import { HttpClient } from '@angular/common/http';
  import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
  import { FormsModule } from '@angular/forms';
  import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

  import { Edicao } from '../../models/edicaoJornal';
  import { Artigo } from '../../models/artigoJornal';

  type ConteudoJornal = {
    id: number;
    titulo: string;
    descricao: string;
    data_publicacao: string;
    capa: string;
    pdf: string;
    tipo: 'edicao' | 'artigo';
  };

  @Component({
    selector: 'app-jornal',
    standalone: true,
    imports: [MatPaginatorModule, FormsModule],
    templateUrl: './jornal.html',
    styleUrl: './jornal.css',
  })
  export class Jornal implements OnInit {
    private readonly apiUrl = 'http://127.0.0.1:8000/api/noticias';
    private readonly apiEdicoesUrl = 'http://127.0.0.1:8000/api/edicoes';
    private readonly storageUrl = 'http://127.0.0.1:8000/storage/';

    edicoes: ConteudoJornal[] = [];
    artigos: ConteudoJornal[] = [];

    filtroAtual: 'todos' | 'edicoes' | 'artigos' = 'todos';

    conteudosFiltrados: ConteudoJornal[] = [];
    conteudosVisiveis: ConteudoJornal[] = [];

    busca = '';
    edicaoSelecionada: ConteudoJornal | null = null;

    paginaAtual = 0;
    tamanhoPagina = 5;

    constructor(
      private readonly http: HttpClient,
      private readonly sanitizer: DomSanitizer,
      private readonly cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
      this.carregarEdicoes();
      this.carregarArtigos();
    }

    carregarEdicoes(): void {
      this.http.get<Edicao[]>(this.apiEdicoesUrl).subscribe({
        next: (edicoes) => {
          this.edicoes = edicoes.map((edicao) => ({
            id: edicao.id,
            titulo: edicao.titulo,
            descricao: edicao.descricao ?? '',
            data_publicacao: edicao.data_publicacao ?? '',
            capa: edicao.capa ?? '',
            pdf: edicao.pdf ?? '',
            tipo: 'edicao',
          }));

          console.log('Edições recebidas do Laravel:', this.edicoes);
          this.aplicarFiltros();
        },
        error: (erro) => {
          console.error('Erro ao carregar edições:', erro);
          this.edicoes = [];
          this.aplicarFiltros();
        },
      });
    }

    carregarArtigos(): void {
      this.http.get<Artigo[]>(this.apiUrl).subscribe({
        next: (noticias) => {
          this.artigos = noticias.map((artigo) => ({
            id: artigo.id,
            titulo: artigo.titulo,
            descricao: artigo.descricao ?? '',
            data_publicacao: artigo.data_publicacao ?? '',
            capa: artigo.capa ?? '',
            pdf: artigo.pdf ?? '',
            tipo: 'artigo',
          }));

          console.log('Artigos recebidos do Laravel:', this.artigos);
          this.aplicarFiltros();
        },
        error: (erro) => {
          console.error('Erro ao carregar artigos:', erro);
          this.artigos = [];
          this.aplicarFiltros();
        },
      });
    }

    aplicarFiltros(): void {
      const termo = this.busca.toLocaleLowerCase().trim();

      let conteudos: ConteudoJornal[];

      if (this.filtroAtual === 'edicoes') {
        conteudos = [...this.edicoes];
      } else if (this.filtroAtual === 'artigos') {
        conteudos = [...this.artigos];
      } else {
        conteudos = [...this.edicoes, ...this.artigos];
      }

      this.conteudosFiltrados = conteudos.filter((item) =>
        item.titulo.toLocaleLowerCase().includes(termo) ||
        item.descricao.toLocaleLowerCase().includes(termo)
      );

      this.paginaAtual = 0;
      this.atualizarPagina();
    }

    atualizarPagina(): void {
      const inicio = this.paginaAtual * this.tamanhoPagina;
      const fim = inicio + this.tamanhoPagina;

      this.conteudosVisiveis =
        this.conteudosFiltrados.slice(inicio, fim);

      this.cdr.detectChanges();
    }

    mudarPagina(event: PageEvent): void {
      this.paginaAtual = event.pageIndex;
      this.tamanhoPagina = event.pageSize;
      this.atualizarPagina();
    }

    buscarEdicao(): void {
      this.aplicarFiltros();
    }

    selecionarEdicao(item: ConteudoJornal): void {
      this.edicaoSelecionada = item;
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

    urlPdf(item: ConteudoJornal): string {
      if (!item.pdf) {
        return '';
      }

      if (/^https?:\/\//i.test(item.pdf)) {
        return item.pdf;
      }

      const caminho = item.pdf.replace(/^\/+/, '');

      if (caminho.startsWith('storage/')) {
        return `http://127.0.0.1:8000/${caminho}`;
      }

      return `${this.storageUrl}${caminho}`;
    }

    urlPdfSeguro(item: ConteudoJornal): SafeResourceUrl | null {
      const url = this.urlPdf(item);

      if (!url) {
        return null;
      }

      return this.sanitizer.bypassSecurityTrustResourceUrl(
        `${url}#page=1&toolbar=0&navpanes=0`
      );
    }

    formatarData(data: string): string {
      if (!data) {
        return '';
      }

      const partes = data.split('-');

      if (partes.length === 3 && partes[0].length === 4) {
        return `${partes[2].slice(0, 2)}/${partes[1]}/${partes[0]}`;
      }

      return data;
    }
  }