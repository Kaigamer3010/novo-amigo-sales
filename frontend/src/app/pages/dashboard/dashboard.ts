
import { Component, OnInit, inject } from '@angular/core';
import { LivrosService } from '../../service/livros';
import { AdicionarLivro } from '../../components/adicionar-livro/adicionar-livro';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatDialogModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

  private dialog = inject(MatDialog);

  livrosRecentes: any[] = [];

  totalLivros = 0;
  livrosDisponiveis = 0;
  livrosIndisponiveis = 0;
  totalCategorias = 0;

  constructor(private livrosService: LivrosService) {}

  ngOnInit(): void {
    this.carregarLivrosRecentes();
  }

  carregarLivrosRecentes(): void {
    this.livrosService.obterLivros().subscribe({
      next: (resposta: any) => {
        const livros = Array.isArray(resposta)
          ? resposta
          : resposta.data ?? [];

        // Ordena do mais recente para o mais antigo
        const livrosOrdenados = [...livros].sort(
          (a, b) => Number(b.id) - Number(a.id)
        );

        // Exibe os últimos 5 livros
        this.livrosRecentes = livrosOrdenados.slice(0, 5);

        // Total de livros
        this.totalLivros = livros.length;

        // Livros disponíveis
        this.livrosDisponiveis = livros.filter(
          (livro: any) =>
            livro.disponivel === true ||
            livro.disponivel === 1 ||
            livro.disponivel === '1'
        ).length;

        // Livros indisponíveis
        this.livrosIndisponiveis =
          this.totalLivros - this.livrosDisponiveis;

        // Total de categorias diferentes
        this.totalCategorias = new Set(
          livros
            .map((livro: any) => livro.categoria ?? livro.genero)
            .filter(Boolean)
        ).size;

        console.log('Livros recebidos:', livros);
      },

      error: (erro) => {
        console.error('Erro ao carregar livros:', erro);
      }
    });
  }

  editarLivro(livro: any): void {
    console.log('Editar livro:', livro);
  }

  excluirLivro(id: number): void {
    console.log('Excluir livro:', id);
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
