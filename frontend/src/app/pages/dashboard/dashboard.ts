import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject
} from '@angular/core';

import { HttpClient } from '@angular/common/http';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { LivrosService } from '../../service/livros';
import { AdicionarLivro } from '../../components/adicionar-livro/adicionar-livro';
import { AdicionarCategoria } from '../../components/adicionar-categoria/adicionar-categoria';
import { GerenciarCategorias } from '../../components/gerenciar-categorias/gerenciar-categorias';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatDialogModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  private dialog = inject(MatDialog);
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  private apiGeneros = 'http://127.0.0.1:8000/api/generos';

  livrosRecentes: any[] = [];
  categorias: string[] = [];

  totalLivros = 0;
  livrosDisponiveis = 0;
  livrosIndisponiveis = 0;
  totalCategorias = 0;

  constructor(private livrosService: LivrosService) {}

  ngOnInit(): void {
    this.carregarLivrosRecentes();
    this.carregarCategorias();
  }

  carregarLivrosRecentes(): void {
    this.livrosService.obterLivros().subscribe({
      next: (resposta: any) => {
        const livros = Array.isArray(resposta)
          ? resposta
          : resposta?.data ?? [];

        const livrosFormatados = livros.map((livro: any) => {
          const quantidadeDisponivel =
            livro.quantidade_disponivel !== undefined
              ? Number(livro.quantidade_disponivel)
              : null;

          const disponibilidade = String(
            livro.disponibilidade ?? ''
          ).trim().toLowerCase();

          const disponivel =
            quantidadeDisponivel !== null
              ? quantidadeDisponivel > 0
              : disponibilidade === 'disponível' ||
                disponibilidade === 'disponivel' ||
                disponibilidade === '1' ||
                disponibilidade === 'true';

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
            categoria: generos.join(', '),
            disponivel
          };
        });

        const livrosOrdenados = [...livrosFormatados].sort(
          (a: any, b: any) => Number(b.id) - Number(a.id)
        );

        this.livrosRecentes = livrosOrdenados.slice(0, 5);
        this.totalLivros = livrosFormatados.length;

        this.livrosDisponiveis = livrosFormatados.filter(
          (livro: any) => livro.disponivel
        ).length;

        this.livrosIndisponiveis =
          this.totalLivros - this.livrosDisponiveis;

        console.log('Livros recebidos do Laravel:', resposta);

        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro ao carregar livros:', erro);
      }
    });
  }

  carregarCategorias(): void {
    this.http.get<any[]>(this.apiGeneros).subscribe({
      next: (generos) => {
        this.categorias = generos.map(
          (genero: any) => genero.genero
        );

        this.totalCategorias = this.categorias.length;

        console.log('Categorias recebidas do Laravel:', generos);

        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro ao carregar categorias:', erro);
      }
    });
  }

  editarLivro(livro: any): void {
    console.log('Editar livro:', livro);
  }

  excluirLivro(id: number): void {
    console.log('Excluir livro:', id);
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

  abrirAdicionarLivro(): void {
    this.dialog.open(AdicionarLivro, {
      width: '500px',
      height: '300px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: false,
      panelClass: 'gerenciar-avisos-dialog'
    });
  }
}
