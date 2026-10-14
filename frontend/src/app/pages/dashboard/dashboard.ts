import { Component, OnInit } from '@angular/core';
import { LivrosService } from '../../service/livros';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {

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

        // Ordena do livro mais recente para o mais antigo
        const livrosOrdenados = [...livros].sort(
          (a, b) => Number(b.id) - Number(a.id)
        );

        // Exibe somente os últimos 5 livros
        this.livrosRecentes = livrosOrdenados.slice(0, 5);

        this.totalLivros = livros.length;

        this.livrosDisponiveis = livros.filter(
          (livro: any) =>
            livro.disponivel === true ||
            livro.disponivel === 1
        ).length;

        this.livrosIndisponiveis =
          this.totalLivros - this.livrosDisponiveis;

        this.totalCategorias = new Set(
          livros
            .map((livro: any) => livro.categoria)
            .filter(Boolean)
        ).size;
      },

      error: (erro) => {
        console.error('Erro ao carregar livros:', erro);
      } 
    });
  }

  adicionarLivro(): void {
    // Abrir popup de cadastro
  }

  editarLivro(livro: any): void {
    console.log('Editar livro:', livro);
  }

  excluirLivro(id: number): void {
    console.log('Excluir livro:', id);
  }
}