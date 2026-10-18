
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../service/auth';

interface Atividade {
  id: number;
  titulo: string;
  descricao: string | null;
  disciplina: string;
  data_entrega: string;
  sala_id: number;
  usuario_id?: number | null;
}

interface Comunicado {
  id: number;
  titulo: string;
  descricao: string;
  sala_id: number;
  usuario_id?: number | null;
  created_at?: string;
}

type Secao = 'atividades' | 'comunicados';
type ModoFormulario = 'criar' | 'editar';

@Component({
  selector: 'app-gerenciar-turma',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gerenciar-turma.html',
  styleUrl: './gerenciar-turma.css'
})
export class GerenciarTurma implements OnInit {
  private readonly apiUrl = 'http://127.0.0.1:8000/api';

  atividades: Atividade[] = [];
  comunicados: Comunicado[] = [];

  secao: Secao = 'atividades';
  carregando = false;
  salvando = false;

  mensagem = '';
  erro = '';

  podeGerenciar = false;
  salaId: number | null = null;

  formularioAberto = false;
  modoFormulario: ModoFormulario = 'criar';
  itemEditandoId: number | null = null;

  atividadeForm = {
    titulo: '',
    descricao: '',
    disciplina: '',
    data_entrega: ''
  };

  comunicadoForm = {
    titulo: '',
    descricao: ''
  };

  constructor(
    private http: HttpClient,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    const usuario = this.auth.obterUsuario();

    if (!usuario) {
      this.erro = 'Entre na sua conta para acessar esta página.';
      return;
    }

    this.salaId = usuario.sala_id ?? null;

    if (!this.salaId) {
      this.erro = 'Sua conta ainda não está vinculada a uma turma.';
      return;
    }

    this.carregarDados();
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    });
  }

  carregarDados(): void {
    if (!this.salaId) {
      return;
    }

    this.carregando = true;
    this.erro = '';

    this.http.get<Atividade[]>(
      `${this.apiUrl}/atividades/sala/${this.salaId}`,
      { headers: this.headers() }
    ).subscribe({
      next: (dados) => {
        this.atividades = dados;
        this.carregarComunicados();
      },
      error: (erro) => {
        this.carregando = false;
        this.erro = erro.error?.erro
          || 'Não foi possível carregar as atividades.';
      }
    });
  }

  private carregarComunicados(): void {
    this.http.get<Comunicado[]>(
      `${this.apiUrl}/comunicados`,
      { headers: this.headers() }
    ).subscribe({
      next: (dados) => {
        this.comunicados = dados;
        this.carregando = false;
      },
      error: (erro) => {
        this.carregando = false;
        this.erro = erro.error?.erro
          || 'Não foi possível carregar os comunicados.';
      }
    });
  }

  abrirSecao(secao: Secao): void {
    this.secao = secao;
    this.fecharFormulario();
    this.mensagem = '';
    this.erro = '';
  }

  novoItem(): void {
    this.modoFormulario = 'criar';
    this.itemEditandoId = null;
    this.limparFormularios();
    this.formularioAberto = true;
    this.mensagem = '';
    this.erro = '';
  }

  editarAtividade(atividade: Atividade): void {
    this.modoFormulario = 'editar';
    this.itemEditandoId = atividade.id;

    this.atividadeForm = {
      titulo: atividade.titulo,
      descricao: atividade.descricao ?? '',
      disciplina: atividade.disciplina,
      data_entrega: atividade.data_entrega?.substring(0, 10) ?? ''
    };

    this.formularioAberto = true;
    this.mensagem = '';
    this.erro = '';
  }

  editarComunicado(comunicado: Comunicado): void {
    this.modoFormulario = 'editar';
    this.itemEditandoId = comunicado.id;

    this.comunicadoForm = {
      titulo: comunicado.titulo,
      descricao: comunicado.descricao
    };

    this.formularioAberto = true;
    this.mensagem = '';
    this.erro = '';
  }

  salvar(): void {
    if (this.salvando) {
      return;
    }

    if (this.secao === 'atividades') {
      this.salvarAtividade();
    } else {
      this.salvarComunicado();
    }
  }

  private salvarAtividade(): void {
    if (!this.salaId) {
      return;
    }

    const dados = {
      titulo: this.atividadeForm.titulo.trim(),
      descricao: this.atividadeForm.descricao.trim() || null,
      disciplina: this.atividadeForm.disciplina.trim(),
      data_entrega: this.atividadeForm.data_entrega,
      sala_id: this.salaId
    };

    this.salvando = true;
    this.erro = '';

    const requisicao = this.modoFormulario === 'editar'
      ? this.http.put(
          `${this.apiUrl}/atividades/${this.itemEditandoId}`,
          dados,
          { headers: this.headers() }
        )
      : this.http.post(
          `${this.apiUrl}/atividades`,
          dados,
          { headers: this.headers() }
        );

    requisicao.subscribe({
      next: () => {
        this.salvando = false;
        this.fecharFormulario();
        this.mensagem = this.modoFormulario === 'editar'
          ? 'Atividade atualizada com sucesso.'
          : 'Atividade criada com sucesso.';
        this.carregarDados();
      },
      error: (erro) => {
        this.salvando = false;
        this.erro = erro.error?.erro
          || this.mensagemValidacao(erro.error)
          || 'Não foi possível salvar a atividade.';
      }
    });
  }

  private salvarComunicado(): void {
    const dados = {
      titulo: this.comunicadoForm.titulo.trim(),
      descricao: this.comunicadoForm.descricao.trim()
    };

    this.salvando = true;
    this.erro = '';

    const requisicao = this.modoFormulario === 'editar'
      ? this.http.put(
          `${this.apiUrl}/comunicados/${this.itemEditandoId}`,
          dados,
          { headers: this.headers() }
        )
      : this.http.post(
          `${this.apiUrl}/comunicados`,
          dados,
          { headers: this.headers() }
        );

    requisicao.subscribe({
      next: () => {
        const editando = this.modoFormulario === 'editar';
        this.salvando = false;
        this.fecharFormulario();
        this.mensagem = editando
          ? 'Comunicado atualizado com sucesso.'
          : 'Comunicado publicado com sucesso.';
        this.carregarDados();
      },
      error: (erro) => {
        this.salvando = false;
        this.erro = erro.error?.erro
          || this.mensagemValidacao(erro.error)
          || 'Não foi possível salvar o comunicado.';
      }
    });
  }

  excluirAtividade(atividade: Atividade): void {
    if (!confirm(`Deseja excluir a atividade "${atividade.titulo}"?`)) {
      return;
    }

    this.http.delete(
      `${this.apiUrl}/atividades/${atividade.id}`,
      { headers: this.headers() }
    ).subscribe({
      next: () => {
        this.mensagem = 'Atividade excluída com sucesso.';
        this.carregarDados();
      },
      error: (erro) => {
        this.erro = erro.error?.erro
          || 'Não foi possível excluir a atividade.';
      }
    });
  }

  excluirComunicado(comunicado: Comunicado): void {
    if (!confirm(`Deseja excluir o comunicado "${comunicado.titulo}"?`)) {
      return;
    }

    this.http.delete(
      `${this.apiUrl}/comunicados/${comunicado.id}`,
      { headers: this.headers() }
    ).subscribe({
      next: () => {
        this.mensagem = 'Comunicado excluído com sucesso.';
        this.carregarDados();
      },
      error: (erro) => {
        this.erro = erro.error?.erro
          || 'Não foi possível excluir o comunicado.';
      }
    });
  }

  fecharFormulario(): void {
    this.formularioAberto = false;
    this.itemEditandoId = null;
    this.limparFormularios();
  }

  private limparFormularios(): void {
    this.atividadeForm = {
      titulo: '',
      descricao: '',
      disciplina: '',
      data_entrega: ''
    };

    this.comunicadoForm = {
      titulo: '',
      descricao: ''
    };
  }

  private mensagemValidacao(resposta: any): string {
    if (!resposta?.errors) {
      return '';
    }

    const primeiroCampo = Object.keys(resposta.errors)[0];
    return resposta.errors[primeiroCampo]?.[0] ?? '';
  }
}
