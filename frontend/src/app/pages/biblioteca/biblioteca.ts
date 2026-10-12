
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { FormsModule } from '@angular/forms';
import { LivrosService } from '../../service/livros';

@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [MatPaginatorModule, FormsModule],
  templateUrl: './biblioteca.html',
  styleUrl: './biblioteca.css',
})
export class Biblioteca implements OnInit {
  readonly Array = Array;

  livros: any[] = [];
  livrosVisiveis: any[] = [];
  livrosFiltrados: any[] = [];

  busca: string = '';
  livroSelecionado: any = null;

  carregando: boolean = true;
  erroCarregamento: string = '';

  constructor(
    private livrosService: LivrosService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarLivros();
  }

  carregarLivros(): void {
    this.carregando = true;
    this.erroCarregamento = '';
    this.cdr.detectChanges();

    this.livrosService.obterLivros().subscribe({
      next: (dados) => {
        console.log('Livros recebidos do Laravel:', dados);

        this.livros = dados;
        this.livrosFiltrados = dados;
        this.livrosVisiveis = dados.slice(0, 5);

        // Finaliza o carregamento
        this.carregando = false;

        // Atualiza a tela
        this.cdr.detectChanges();

        console.log('Livros visíveis:', this.livrosVisiveis);
        console.log('Carregando:', this.carregando);
      },

      error: (erro) => {
        console.error('Erro ao carregar livros:', erro);

        this.erroCarregamento =
          `Erro ao carregar livros (HTTP ${erro.status}).`;

        this.carregando = false;
        this.cdr.detectChanges();
      },
    });
  }

  mudarPagina(event: PageEvent): void {
    const inicio = event.pageIndex * event.pageSize;
    const fim = inicio + event.pageSize;

    this.livrosVisiveis = this.livrosFiltrados.slice(inicio, fim);
  }

  buscarLivro(): void {
    const termo = this.busca.toLocaleLowerCase().trim();

    this.livrosFiltrados = this.livros.filter((livro) => {
      const titulo = String(livro.titulo ?? '').toLocaleLowerCase();
      const isbn = String(livro.isbn ?? '').toLocaleLowerCase();

      const autores = Array.isArray(livro.autores)
        ? livro.autores.join(' ').toLocaleLowerCase()
        : String(livro.autores ?? '').toLocaleLowerCase();

      return (
        titulo.includes(termo) ||
        autores.includes(termo) ||
        isbn.includes(termo)
      );
    });

    // Ao pesquisar, volta para a primeira página
    this.livrosVisiveis = this.livrosFiltrados.slice(0, 5);
  }

  selecionarLivro(livro: any): void {
    this.livroSelecionado = livro;
  }
}
