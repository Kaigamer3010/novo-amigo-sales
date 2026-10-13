import { Component } from '@angular/core';
import { Edicao } from '../../models/edicaoJornal';
import { Artigo } from '../../models/artigoJornal';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-jornal',
  standalone: true,
  imports: [MatPaginatorModule, FormsModule],
  templateUrl: './jornal.html',
  styleUrl: './jornal.css',
})
export class Jornal {

  edicoes: Edicao[] = [
    {id: 1,titulo: 'Edição #1',data_publicacao: '08/06/2026',capa: '',descricao: 'Interclasse, intercâmbio, reforma da estátua e corujão',pdf: ''},
    {id: 2,titulo: 'Edição #2',data_publicacao: '08/07/2026',capa: '',descricao: 'Notícias e acontecimentos da escola',pdf: ''},
    {id: 3,titulo: 'Edição #3',data_publicacao: '08/08/2026',capa: '',descricao: 'Eventos, projetos e novidades',pdf: ''},
    {id: 4,titulo: 'Edição #4',data_publicacao: '08/09/2026',capa: '',descricao: 'Interclasse e atividades escolares',pdf: ''},
    {id: 5,titulo: 'Edição #5',data_publicacao: '08/10/2026',capa: '',descricao: 'Novidades e notícias da comunidade escolar',pdf: ''},
    {id: 6,titulo: 'Edição #6',data_publicacao: '08/11/2026',capa: '',descricao: 'Projetos e acontecimentos do Sales',pdf: ''}
  ];

  filtroAtual: 'todos' | 'edicoes' | 'artigos' = 'todos';

  conteudosFiltrados: (Edicao | Artigo)[] = [];
  conteudosVisiveis: (Edicao | Artigo)[] = [];

  artigos: Artigo[] = [];

  edicoesFiltradas: Edicao[] = [...this.edicoes];
  edicoesVisiveis: Edicao[] = [];

  busca: string = '';
  edicaoSelecionada: Edicao | null = null;

  paginaAtual = 0;
  tamanhoPagina = 5;

  constructor() {
  this.aplicarFiltros();
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

  let conteudos: (Edicao | Artigo)[] = [];

  if (this.filtroAtual === 'todos') {
    conteudos = [...this.edicoes, ...this.artigos];
  } else if (this.filtroAtual === 'edicoes') {
    conteudos = [...this.edicoes];
  } else {
    conteudos = [...this.artigos];
  }

  this.conteudosFiltrados = conteudos.filter((item) => {
    return (
      item.titulo.toLocaleLowerCase().includes(termo) ||
      item.descricao.toLocaleLowerCase().includes(termo)
    );
  });

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