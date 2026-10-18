
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject,
} from '@angular/core';

import { FormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { Cardapio } from '../../models/cardapio';
import { CardapioService } from '../../service/cardapio';

@Component({
  selector: 'app-gerenciar-cardapio',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './gerenciar-cardapio.html',
  styleUrl: './gerenciar-cardapio.css',
})
export class GerenciarCardapio implements OnInit {
  private readonly cardapioService = inject(CardapioService);

  private readonly cdr = inject(ChangeDetectorRef);

  private readonly dialogRef = inject(
    MatDialogRef<GerenciarCardapio>,
    { optional: true }
  );

  cardapios: Cardapio[] = [];

  novoDia = 'segunda';
  novaRefeicao = '';

  mensagem = '';
  erro = '';

  carregando = false;
  carregandoLista = false;

  modoSubstituicao = false;
  cardapioExistente: Cardapio | null = null;

  dias = [
    { dia_semana: 'segunda', nome: 'Segunda-feira' },
    { dia_semana: 'terca', nome: 'Terça-feira' },
    { dia_semana: 'quarta', nome: 'Quarta-feira' },
    { dia_semana: 'quinta', nome: 'Quinta-feira' },
    { dia_semana: 'sexta', nome: 'Sexta-feira' },
  ];

  ngOnInit(): void {
    this.carregarCardapios();
  }

  carregarCardapios(): void {
    this.carregandoLista = true;
    this.erro = '';

    this.cdr.markForCheck();

    this.cardapioService.obterCardapio().subscribe({
      next: (cardapios) => {
        this.cardapios = Array.isArray(cardapios)
          ? cardapios
          : [];

        this.verificarDia();

        this.carregandoLista = false;

        this.cdr.markForCheck();
      },

      error: (erro) => {
        console.error('Erro ao carregar cardápios:', erro);

        if (erro.status === 401) {
          this.erro =
            'Sua sessão expirou ou você não está autenticado. Entre novamente no sistema.';
        } else {
          this.erro =
            'Não foi possível carregar os cardápios cadastrados.';
        }

        this.carregandoLista = false;

        this.cdr.markForCheck();
      },
    });
  }

  verificarDia(): void {
    this.cardapioExistente =
      this.cardapioDoDia(this.novoDia) ?? null;

    this.modoSubstituicao =
      this.cardapioExistente !== null;

    this.mensagem = '';
    this.erro = '';

    this.cdr.markForCheck();
  }

  cardapioDoDia(diaSemana: string): Cardapio | undefined {
    return this.cardapios.find(
      (item) => item.dia_semana === diaSemana
    );
  }

  adicionarCardapio(): void {
    if (this.carregando || this.carregandoLista) {
      return;
    }

    const refeicao = this.novaRefeicao.trim();

    if (!refeicao) {
      this.erro = 'Digite a descrição da refeição.';
      this.mensagem = '';

      this.cdr.markForCheck();
      return;
    }

    this.erro = '';
    this.mensagem = '';
    this.carregando = true;

    this.cdr.markForCheck();

    const dados = {
      dia_semana: this.novoDia,
      refeicao,
    };

    const existente = this.cardapioDoDia(this.novoDia);

    if (existente) {
      this.cardapioService
        .atualizarCardapio(existente.id, dados)
        .subscribe({
          next: () => {
            this.mensagem =
              'Cardápio do dia substituído com sucesso!';

            this.novaRefeicao = '';
            this.carregando = false;

            this.cdr.markForCheck();

            if (this.dialogRef) {
              this.dialogRef.close(true);
            } else {
              this.carregarCardapios();
            }
          },

          error: (erro) => {
            this.tratarErro(erro, 'substituir');
          },
        });

      return;
    }

    this.cardapioService.adicionarCardapio(dados).subscribe({
      next: () => {
        this.mensagem = 'Cardápio cadastrado com sucesso!';
        this.novaRefeicao = '';
        this.carregando = false;

        this.cdr.markForCheck();

        if (this.dialogRef) {
          this.dialogRef.close(true);
        } else {
          this.carregarCardapios();
        }
      },

      error: (erro) => {
        this.tratarErro(erro, 'cadastrar');
      },
    });
  }

  private tratarErro(erro: any, acao: string): void {
    console.error(`Erro ao ${acao} cardápio:`, erro);

    if (erro.status === 401) {
      this.erro =
        'Não foi possível autenticar. Entre novamente no sistema e tente de novo.';
    } else if (erro.status === 403) {
      this.erro =
        'Você não tem permissão para realizar esta ação.';
    } else if (erro.status === 404) {
      this.erro =
        'O cardápio ou a rota de atualização não foi encontrado.';
    } else if (erro.status === 422) {
      this.erro =
        'Os dados enviados são inválidos. Confira o dia e a descrição da refeição.';
    } else {
      this.erro =
        `Não foi possível ${acao} o cardápio. Tente novamente.`;
    }

    this.carregando = false;

    this.cdr.markForCheck();
  }

  nomeDia(diaSemana: string): string {
    return this.dias.find(
      (dia) => dia.dia_semana === diaSemana
    )?.nome ?? diaSemana;
  }

  cancelar(): void {
    this.dialogRef?.close(false);
  }
}
