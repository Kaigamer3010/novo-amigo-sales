
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../service/auth';
import { environment } from '../../../environments/environment';

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

interface Sala {
  id: number;
  serie: number;
  curso_id: number;
  representante_id: number | null;
  curso?: {
    id: number;
    nome?: string;
  } | null;
}

interface HorarioAula {
  id: number;
  sala_id: number;
  dia_semana: string;
  disciplina: string;
  num_aula: number;
}

type Secao = 'sala' | 'atividades' | 'comunicados' | 'horarios';
type ModoFormulario = 'criar' | 'editar';

@Component({
  selector: 'app-gerenciar-turma',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gerenciar-turma.html',
  styleUrl: './gerenciar-turma.css'
})
export class GerenciarTurma implements OnInit {
  private readonly apiUrl = environment.baseUrl + '/api';

  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor(public auth: AuthService) {}

  atividades: Atividade[] = [];
  comunicados: Comunicado[] = [];
  horariosTurma: HorarioAula[] = [];
  sala: Sala | null = null;

  secao: Secao = 'sala';

  carregando = false;
  salvando = false;
  carregandoHorarios = false;
  salvandoHorario = false;

  mensagem = '';
  erro = '';

  podeGerenciar = false;
  salaId: number | null = null;

  formularioAberto = false;
  modoFormulario: ModoFormulario = 'criar';
  itemEditandoId: number | null = null;

  formularioHorarioAberto = false;
  horarioEditando: number | null = null;

  serieForm = 1;

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

  horarioForm = {
    dia_semana: 'segunda',
    disciplina: '',
    num_aula: 1
  };

  readonly diasSemana = [
    { valor: 'segunda', nome: 'Segunda-feira' },
    { valor: 'terca', nome: 'Terça-feira' },
    { valor: 'quarta', nome: 'Quarta-feira' },
    { valor: 'quinta', nome: 'Quinta-feira' },
    { valor: 'sexta', nome: 'Sexta-feira' }
  ];

  ngOnInit(): void {
    this.carregarDados();
  }

  private atualizarTela(): void {
    this.cdr.detectChanges();
  }

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });
  }

  carregarDados(): void {
    const usuario = this.auth.obterUsuario();

    if (!usuario) {
      this.erro = 'Entre na sua conta para acessar esta página.';
      this.carregando = false;
      this.atualizarTela();
      return;
    }

    this.salaId = usuario.sala_id ?? null;

    if (!this.salaId) {
      this.erro = 'Sua conta ainda não está vinculada a uma sala.';
      this.carregando = false;
      this.atualizarTela();
      return;
    }

    this.carregando = true;
    this.erro = '';
    this.mensagem = '';
    this.atualizarTela();

    this.http.get<Sala>(
      `${this.apiUrl}/salas/${this.salaId}`,
      { headers: this.headers() }
    ).subscribe({
      next: sala => {
        this.sala = sala;

        this.podeGerenciar =
          usuario.nivel_acesso === 'aluno' &&
          Number(usuario.sala_id) === Number(sala.id) &&
          Number(sala.representante_id) === Number(usuario.id);

        this.serieForm = sala.serie;
        this.carregarAtividades();
      },
      error: erro => {
        this.carregando = false;
        this.podeGerenciar = false;
        this.erro =
          erro.error?.erro ||
          'Não foi possível carregar os dados da sala.';
        this.atualizarTela();
      }
    });
  }

  private carregarAtividades(): void {
    if (!this.salaId) {
      this.carregando = false;
      this.atualizarTela();
      return;
    }

    this.http.get<Atividade[]>(
      `${this.apiUrl}/atividades/sala/${this.salaId}`,
      { headers: this.headers() }
    ).subscribe({
      next: dados => {
        this.atividades = Array.isArray(dados) ? dados : [];
        this.carregarComunicados();
      },
      error: erro => {
        this.carregando = false;
        this.erro =
          erro.error?.erro ||
          'Não foi possível carregar as atividades.';
        this.atualizarTela();
      }
    });
  }

  private carregarComunicados(): void {
    this.http.get<Comunicado[]>(
      `${this.apiUrl}/comunicados`,
      { headers: this.headers() }
    ).subscribe({
      next: dados => {
        this.comunicados = (Array.isArray(dados) ? dados : []).filter(
          comunicado =>
            Number(comunicado.sala_id) === Number(this.salaId)
        );

        this.carregarHorarios(true);
      },
      error: erro => {
        this.carregando = false;
        this.erro =
          erro.error?.erro ||
          'Não foi possível carregar os comunicados.';
        this.atualizarTela();
      }
    });
  }

  carregarHorarios(finalizarCarregamento = false): void {
    if (!this.salaId) {
      if (finalizarCarregamento) {
        this.carregando = false;
      }
      this.atualizarTela();
      return;
    }

    this.carregandoHorarios = true;

    this.http.get<HorarioAula[]>(
      `${this.apiUrl}/horarios/sala/${this.salaId}`,
      { headers: this.headers() }
    ).subscribe({
      next: dados => {
        this.horariosTurma = (Array.isArray(dados) ? dados : [])
          .sort((a, b) => {
            const ordemDias = this.diasSemana.map(dia => dia.valor);
            const diferencaDia =
              ordemDias.indexOf(a.dia_semana) -
              ordemDias.indexOf(b.dia_semana);

            return diferencaDia || a.num_aula - b.num_aula;
          });

        this.carregandoHorarios = false;

        if (finalizarCarregamento) {
          this.carregando = false;
        }

        this.atualizarTela();
      },
      error: erro => {
        this.carregandoHorarios = false;

        if (finalizarCarregamento) {
          this.carregando = false;
        }

        this.erro =
          erro.error?.erro ||
          'Não foi possível carregar a grade de horários.';

        this.atualizarTela();
      }
    });
  }

  abrirSecao(secao: Secao): void {
    this.secao = secao;
    this.fecharFormulario();
    this.cancelarHorario();
    this.mensagem = '';
    this.erro = '';
    this.atualizarTela();
  }

  editarSala(): void {
    if (!this.podeGerenciar || !this.sala) {
      return;
    }

    this.abrirSecao('sala');
    this.serieForm = this.sala.serie;
    this.formularioAberto = true;
    this.modoFormulario = 'editar';
  }

  novoItem(): void {
    if (!this.podeGerenciar || this.secao === 'sala' ||
        this.secao === 'horarios') {
      return;
    }

    this.modoFormulario = 'criar';
    this.itemEditandoId = null;
    this.limparFormularios();
    this.formularioAberto = true;
    this.mensagem = '';
    this.erro = '';
    this.atualizarTela();
  }

  editarAtividade(atividade: Atividade): void {
    if (!this.podeGerenciar) return;

    this.abrirSecao('atividades');
    this.modoFormulario = 'editar';
    this.itemEditandoId = atividade.id;

    this.atividadeForm = {
      titulo: atividade.titulo,
      descricao: atividade.descricao ?? '',
      disciplina: atividade.disciplina,
      data_entrega: atividade.data_entrega?.substring(0, 10) ?? ''
    };

    this.formularioAberto = true;
    this.atualizarTela();
  }

  editarComunicado(comunicado: Comunicado): void {
    if (!this.podeGerenciar) return;

    this.abrirSecao('comunicados');
    this.modoFormulario = 'editar';
    this.itemEditandoId = comunicado.id;

    this.comunicadoForm = {
      titulo: comunicado.titulo,
      descricao: comunicado.descricao
    };

    this.formularioAberto = true;
    this.atualizarTela();
  }

  salvar(): void {
    if (this.salvando) return;

    if (this.secao === 'sala') {
      this.salvarSala();
      return;
    }

    if (!this.podeGerenciar) {
      this.erro = 'Você não tem permissão para fazer alterações.';
      this.atualizarTela();
      return;
    }

    if (this.secao === 'atividades') {
      this.salvarAtividade();
    } else if (this.secao === 'comunicados') {
      this.salvarComunicado();
    }
  }

  private salvarSala(): void {
    if (!this.salaId || !this.podeGerenciar || !this.sala) {
      this.erro = 'Você não tem permissão para editar esta sala.';
      this.atualizarTela();
      return;
    }

    const serie = Number(this.serieForm);

    if (!Number.isInteger(serie) || serie < 1) {
      this.erro = 'Informe uma série válida.';
      this.atualizarTela();
      return;
    }

    this.salvando = true;
    this.erro = '';
    this.mensagem = '';

    this.http.put<Sala>(
      `${this.apiUrl}/salas/${this.salaId}`,
      { serie },
      { headers: this.headers() }
    ).subscribe({
      next: salaAtualizada => {
        this.sala = salaAtualizada;
        this.serieForm = salaAtualizada.serie;
        this.salvando = false;
        this.fecharFormulario();
        this.mensagem = 'Dados da sala atualizados com sucesso.';
        this.atualizarTela();
      },
      error: erro => {
        this.salvando = false;
        this.erro = erro.error?.erro ||
          this.mensagemValidacao(erro.error) ||
          'Não foi possível atualizar a sala.';
        this.atualizarTela();
      }
    });
  }

  private salvarAtividade(): void {
    if (!this.salaId || !this.podeGerenciar) return;

    const dados = {
      titulo: this.atividadeForm.titulo.trim(),
      descricao: this.atividadeForm.descricao.trim() || null,
      disciplina: this.atividadeForm.disciplina.trim(),
      data_entrega: this.atividadeForm.data_entrega,
      sala_id: this.salaId
    };

    if (!dados.titulo || !dados.disciplina || !dados.data_entrega) {
      this.erro = 'Preencha o título, a disciplina e a data de entrega.';
      this.atualizarTela();
      return;
    }

    const editando = this.modoFormulario === 'editar';
    this.salvando = true;
    this.erro = '';
    this.mensagem = '';

    const requisicao = editando
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
        this.mensagem = editando
          ? 'Atividade atualizada com sucesso.'
          : 'Atividade criada com sucesso.';
        this.carregarDados();
      },
      error: erro => {
        this.salvando = false;
        this.erro = erro.error?.erro ||
          this.mensagemValidacao(erro.error) ||
          'Não foi possível salvar a atividade.';
        this.atualizarTela();
      }
    });
  }

  private salvarComunicado(): void {
    if (!this.podeGerenciar || !this.salaId) return;

    const dados = {
      titulo: this.comunicadoForm.titulo.trim(),
      descricao: this.comunicadoForm.descricao.trim(),
      sala_id: this.salaId
    };

    if (!dados.titulo || !dados.descricao) {
      this.erro = 'Preencha o título e a descrição do comunicado.';
      this.atualizarTela();
      return;
    }

    const editando = this.modoFormulario === 'editar';
    this.salvando = true;
    this.erro = '';
    this.mensagem = '';

    const requisicao = editando
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
        this.salvando = false;
        this.fecharFormulario();
        this.mensagem = editando
          ? 'Comunicado atualizado com sucesso.'
          : 'Comunicado publicado com sucesso.';
        this.carregarDados();
      },
      error: erro => {
        this.salvando = false;
        this.erro = erro.error?.erro ||
          this.mensagemValidacao(erro.error) ||
          'Não foi possível salvar o comunicado.';
        this.atualizarTela();
      }
    });
  }

  excluirAtividade(atividade: Atividade): void {
    if (!this.podeGerenciar || this.salvando) return;
    if (!confirm(`Deseja excluir a atividade "${atividade.titulo}"?`)) return;

    this.salvando = true;
    this.erro = '';
    this.mensagem = '';

    this.http.delete(
      `${this.apiUrl}/atividades/${atividade.id}`,
      { headers: this.headers() }
    ).subscribe({
      next: () => {
        this.salvando = false;
        this.mensagem = 'Atividade excluída com sucesso.';
        this.carregarDados();
      },
      error: erro => {
        this.salvando = false;
        this.erro = erro.error?.erro ||
          'Não foi possível excluir a atividade.';
        this.atualizarTela();
      }
    });
  }

  excluirComunicado(comunicado: Comunicado): void {
    if (!this.podeGerenciar || this.salvando) return;
    if (!confirm(`Deseja excluir o comunicado "${comunicado.titulo}"?`)) return;

    this.salvando = true;
    this.erro = '';
    this.mensagem = '';

    this.http.delete(
      `${this.apiUrl}/comunicados/${comunicado.id}`,
      { headers: this.headers() }
    ).subscribe({
      next: () => {
        this.salvando = false;
        this.mensagem = 'Comunicado excluído com sucesso.';
        this.carregarDados();
      },
      error: erro => {
        this.salvando = false;
        this.erro = erro.error?.erro ||
          'Não foi possível excluir o comunicado.';
        this.atualizarTela();
      }
    });
  }

  abrirFormularioHorario(): void {
    if (!this.podeGerenciar) return;

    this.abrirSecao('horarios');
    this.horarioEditando = null;
    this.horarioForm = {
      dia_semana: 'segunda',
      disciplina: '',
      num_aula: 1
    };
    this.formularioHorarioAberto = true;
    this.mensagem = '';
    this.erro = '';
    this.atualizarTela();
  }

  editarHorarioTurma(horario: HorarioAula): void {
    if (!this.podeGerenciar) return;

    this.abrirSecao('horarios');
    this.horarioEditando = horario.id;
    this.horarioForm = {
      dia_semana: horario.dia_semana,
      disciplina: horario.disciplina,
      num_aula: horario.num_aula
    };
    this.formularioHorarioAberto = true;
    this.mensagem = '';
    this.erro = '';
    this.atualizarTela();
  }

  salvarHorario(): void {
    if (!this.podeGerenciar || !this.salaId || this.salvandoHorario) {
      return;
    }

    const disciplina = this.horarioForm.disciplina.trim();
    const numAula = Number(this.horarioForm.num_aula);

    if (!disciplina) {
      this.erro = 'Informe o nome da disciplina.';
      this.atualizarTela();
      return;
    }

    if (!Number.isInteger(numAula) || numAula < 1 || numAula > 6) {
      this.erro = 'Selecione um número de aula válido, de 1 a 6.';
      this.atualizarTela();
      return;
    }

    const dados: HorarioAula = {
      id: this.horarioEditando ?? 0,
      sala_id: this.salaId,
      dia_semana: this.horarioForm.dia_semana,
      disciplina,
      num_aula: numAula
    };

    const editando = this.horarioEditando !== null;
    this.salvandoHorario = true;
    this.erro = '';
    this.mensagem = '';

    const requisicao = editando
      ? this.http.put(
          `${this.apiUrl}/horarios/${this.horarioEditando}`,
          {
            sala_id: dados.sala_id,
            dia_semana: dados.dia_semana,
            disciplina: dados.disciplina,
            num_aula: dados.num_aula
          },
          { headers: this.headers() }
        )
      : this.http.post(
          `${this.apiUrl}/horarios`,
          {
            sala_id: dados.sala_id,
            dia_semana: dados.dia_semana,
            disciplina: dados.disciplina,
            num_aula: dados.num_aula
          },
          { headers: this.headers() }
        );

    requisicao.subscribe({
      next: () => {
        this.salvandoHorario = false;
        this.formularioHorarioAberto = false;
        this.horarioEditando = null;
        this.mensagem = editando
          ? 'Aula atualizada com sucesso.'
          : 'Aula cadastrada com sucesso.';

        this.carregarHorarios();
      },
      error: erro => {
        this.salvandoHorario = false;
        this.erro = erro.error?.erro ||
          this.mensagemValidacao(erro.error) ||
          (erro.status === 403
            ? 'A API não autorizou o gerenciamento de horários.'
            : 'Não foi possível salvar a aula.');
        this.atualizarTela();
      }
    });
  }

  excluirHorarioTurma(horario: HorarioAula): void {
    if (!this.podeGerenciar || this.salvandoHorario) return;

    const dia = this.nomeDiaHorario(horario.dia_semana);
    if (!confirm(
      `Deseja excluir "${horario.disciplina}" de ${dia}, ${horario.num_aula}ª aula?`
    )) return;

    this.salvandoHorario = true;
    this.erro = '';
    this.mensagem = '';

    this.http.delete(
      `${this.apiUrl}/horarios/${horario.id}`,
      { headers: this.headers() }
    ).subscribe({
      next: () => {
        this.salvandoHorario = false;
        this.mensagem = 'Aula excluída com sucesso.';
        this.carregarHorarios();
      },
      error: erro => {
        this.salvandoHorario = false;
        this.erro = erro.error?.erro ||
          (erro.status === 403
            ? 'A API não autorizou a exclusão de horários.'
            : 'Não foi possível excluir a aula.');
        this.atualizarTela();
      }
    });
  }

  cancelarHorario(): void {
    this.formularioHorarioAberto = false;
    this.horarioEditando = null;
    this.horarioForm = {
      dia_semana: 'segunda',
      disciplina: '',
      num_aula: 1
    };
    this.atualizarTela();
  }

  nomeDiaHorario(dia: string): string {
    return this.diasSemana.find(item => item.valor === dia)?.nome ?? dia;
  }

  horaAula(numero: number): string {
    const horarios: Record<number, string> = {
      1: '07:00',
      2: '07:50',
      3: '08:40',
      4: '09:50',
      5: '10:40',
      6: '11:30'
    };

    return horarios[numero] ?? 'Horário não definido';
  }

  fecharFormulario(): void {
    this.formularioAberto = false;
    this.itemEditandoId = null;
    this.limparFormularios();
    this.atualizarTela();
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
    if (!resposta?.errors) return '';

    const primeiroCampo = Object.keys(resposta.errors)[0];
    return resposta.errors[primeiroCampo]?.[0] ?? '';
  }
}
