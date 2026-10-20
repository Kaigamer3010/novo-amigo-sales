
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { Usuario } from '../../models/usuario';
import { environment } from '../../../environments/environment';

type SecaoAdmin =
  | 'inicio'
  | 'usuarios'
  | 'cursos'
  | 'turmas'
  | 'representantes';

interface Curso {
  id: number;
  nome: string;
}

interface Turma {
  id: number;
  serie: number;
  curso_id: number;
  codigo_acesso?: string;
  curso?: Curso;
  representante_id?: number | null;
  representante?: Usuario | null;
}

@Component({
  selector: 'app-pg-users-adm',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pg-users-adm.html',
  styleUrl: './pg-users-adm.css'
})
export class PgUsersAdm implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);

  private readonly api = environment.baseUrl + '/api';

  secaoAtual: SecaoAdmin = 'inicio';

  usuarios: Usuario[] = [];
  turmas: Turma[] = [];
  cursos: Curso[] = [];

  busca = '';
  buscaTurma = '';
  buscaCurso = '';

  carregando = false;
  erro = '';
  mensagem = '';

  usuarioAtualizando: number | null = null;
  salvandoTurma = false;
  salvandoCurso = false;

  editandoTurmaId: number | null = null;
  editandoCursoId: number | null = null;

  private requisicoesPendentes = 0;

  turmaForm = {
    serie: 1,
    curso_id: 0
  };

  cursoForm = {
    nome: ''
  };

  readonly secoes: {
    id: SecaoAdmin;
    titulo: string;
    descricao: string;
    icone: string;
  }[] = [
    {
      id: 'inicio',
      titulo: 'Visão geral',
      descricao: 'Resumo da administração',
      icone: '⌂'
    },
    {
      id: 'usuarios',
      titulo: 'Usuários',
      descricao: 'Contas e permissões',
      icone: '♙'
    },
    {
      id: 'cursos',
      titulo: 'Cursos',
      descricao: 'Cadastrar e organizar cursos',
      icone: '▤'
    },
    {
      id: 'turmas',
      titulo: 'Turmas',
      descricao: 'Organização das salas',
      icone: '▦'
    },
    {
      id: 'representantes',
      titulo: 'Representantes',
      descricao: 'Responsáveis por turma',
      icone: '♧'
    }
  ];

  ngOnInit(): void {
    this.carregarInicio();
  }

  private iniciarCarregamento(): void {
    this.requisicoesPendentes++;
    this.carregando = true;
  }

  private finalizarCarregamento(): void {
    this.requisicoesPendentes = Math.max(
      0,
      this.requisicoesPendentes - 1
    );

    this.carregando = this.requisicoesPendentes > 0;
    this.cdr.markForCheck();
  }

  private getHeaders(): HttpHeaders | null {
    const token = localStorage.getItem('token');

    if (!token) {
      this.erro =
        'Sua sessão não foi encontrada. Entre novamente no sistema.';
      this.cdr.markForCheck();
      return null;
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  private tratarErro(erro: any, operacao: string): void {
    console.error(`Erro ao ${operacao}:`, erro);

    if (erro.status === 401) {
      this.erro = 'Sua sessão expirou. Entre novamente no sistema.';
    } else if (erro.status === 403) {
      this.erro = 'Você não tem permissão para realizar esta ação.';
    } else if (erro.status === 404) {
      this.erro =
        'A rota solicitada não foi encontrada. Confira as rotas da API.';
    } else if (erro.status === 422) {
      const mensagens = erro.error?.errors;

      this.erro = mensagens
        ? Object.values(mensagens).flat().join(' ')
        : erro.error?.erro || 'Confira os dados preenchidos.';
    } else {
      this.erro =
        erro.error?.erro ||
        `Não foi possível ${operacao}. Confira se o Laravel está funcionando.`;
    }

    this.cdr.markForCheck();
  }

  // VISÃO GERAL

  carregarInicio(): void {
    const headers = this.getHeaders();

    if (!headers) return;

    this.iniciarCarregamento();
    this.erro = '';

    forkJoin({
      usuarios: this.http.get<Usuario[]>(
        `${this.api}/usuarios`,
        { headers }
      ),
      turmas: this.http.get<Turma[]>(
        `${this.api}/salas`,
        { headers }
      ),
      cursos: this.http.get<Curso[]>(
        `${this.api}/cursos`,
        { headers }
      )
    }).subscribe({
      next: resultado => {
        this.usuarios = resultado.usuarios;
        this.turmas = resultado.turmas;
        this.cursos = resultado.cursos;
        this.finalizarCarregamento();
      },
      error: erro => {
        this.finalizarCarregamento();
        this.tratarErro(erro, 'carregar a visão geral');
      }
    });
  }

  get totalAdministradores(): number {
    return this.usuarios.filter(
      usuario => usuario.nivel_acesso === 'administrador'
    ).length;
  }

  get totalBibliotecarios(): number {
    return this.usuarios.filter(
      usuario => usuario.nivel_acesso === 'bibliotecario'
    ).length;
  }

  get totalAlunos(): number {
    return this.usuarios.filter(
      usuario => usuario.nivel_acesso === 'aluno'
    ).length;
  }

  // USUÁRIOS

  get usuariosFiltrados(): Usuario[] {
    const termo = this.busca.trim().toLowerCase();

    if (!termo) return this.usuarios;

    return this.usuarios.filter(usuario =>
      [
        usuario.nome_usuario,
        usuario.nome_completo,
        usuario.nivel_acesso,
        String(usuario.sala_id ?? '')
      ].some(valor =>
        String(valor ?? '').toLowerCase().includes(termo)
      )
    );
  }

  carregarUsuarios(): void {
    const headers = this.getHeaders();

    if (!headers) return;

    this.iniciarCarregamento();
    this.erro = '';

    this.http.get<Usuario[]>(
      `${this.api}/usuarios`,
      { headers }
    ).subscribe({
      next: usuarios => {
        this.usuarios = usuarios;
        this.finalizarCarregamento();
      },
      error: erro => {
        this.finalizarCarregamento();
        this.tratarErro(erro, 'carregar os usuários');
      }
    });
  }

  alterarCargo(
    usuario: Usuario,
    novoCargo: Usuario['nivel_acesso']
  ): void {
    if (usuario.nivel_acesso === novoCargo) return;

    const headers = this.getHeaders();

    if (!headers) return;

    const cargoAnterior = usuario.nivel_acesso;

    this.usuarioAtualizando = usuario.id;
    this.erro = '';
    this.mensagem = '';

    this.http.put(
      `${this.api}/usuarios/${usuario.id}`,
      { nivel_acesso: novoCargo },
      { headers }
    ).subscribe({
      next: () => {
        usuario.nivel_acesso = novoCargo;
        this.usuarioAtualizando = null;
        this.mensagem =
          `Cargo de ${usuario.nome_usuario} atualizado com sucesso.`;
        this.cdr.markForCheck();
      },
      error: erro => {
        usuario.nivel_acesso = cargoAnterior;
        this.usuarioAtualizando = null;
        this.tratarErro(erro, 'alterar o cargo');
      }
    });
  }

  nomeCargo(cargo: string): string {
    const nomes: Record<string, string> = {
      aluno: 'Aluno',
      administrador: 'Administrador',
      bibliotecario: 'Bibliotecário'
    };

    return nomes[cargo] ?? cargo;
  }

  // NAVEGAÇÃO

  abrirSecao(secao: SecaoAdmin): void {
    this.secaoAtual = secao;
    this.erro = '';
    this.mensagem = '';

    switch (secao) {
      case 'inicio':
        this.carregarInicio();
        break;

      case 'usuarios':
        this.carregarUsuarios();
        break;

      case 'cursos':
        this.carregarCursos();
        break;

      case 'turmas':
        this.carregarTurmas();
        break;

      case 'representantes':
        this.carregarRepresentantes();
        break;
    }
  }

  atualizarSecao(): void {
    this.abrirSecao(this.secaoAtual);
  }

  // CURSOS

  get cursosFiltrados(): Curso[] {
    const termo = this.buscaCurso.trim().toLowerCase();

    if (!termo) return this.cursos;

    return this.cursos.filter(curso =>
      curso.nome.toLowerCase().includes(termo)
    );
  }

  carregarCursos(): void {
    const headers = this.getHeaders();

    if (!headers) return;

    this.iniciarCarregamento();
    this.erro = '';

    this.http.get<Curso[]>(
      `${this.api}/cursos`,
      { headers }
    ).subscribe({
      next: cursos => {
        this.cursos = cursos;
        this.finalizarCarregamento();
      },
      error: erro => {
        this.finalizarCarregamento();
        this.tratarErro(erro, 'carregar os cursos');
      }
    });
  }

  salvarCurso(): void {
    const headers = this.getHeaders();

    if (!headers) return;

    const nome = this.cursoForm.nome.trim();

    if (!nome) {
      this.erro = 'Digite o nome do curso.';
      return;
    }

    if (nome.length > 255) {
      this.erro = 'O nome do curso deve ter no máximo 255 caracteres.';
      return;
    }

    this.salvandoCurso = true;
    this.erro = '';
    this.mensagem = '';

    const id = this.editandoCursoId;

    const requisicao = id !== null
      ? this.http.put(
          `${this.api}/cursos/${id}`,
          { nome },
          { headers }
        )
      : this.http.post(
          `${this.api}/cursos`,
          { nome },
          { headers }
        );

    requisicao.subscribe({
      next: () => {
        this.salvandoCurso = false;
        this.mensagem = id !== null
          ? 'Curso atualizado com sucesso.'
          : 'Curso cadastrado com sucesso.';

        this.limparFormularioCurso();
        this.carregarCursos();
        this.cdr.markForCheck();
      },
      error: erro => {
        this.salvandoCurso = false;
        this.tratarErro(erro, 'salvar o curso');
      }
    });
  }

  editarCurso(curso: Curso): void {
    this.editandoCursoId = curso.id;
    this.cursoForm = {
      nome: curso.nome
    };

    this.erro = '';
    this.mensagem = '';
  }

  excluirCurso(curso: Curso): void {
    const usadoEmTurma = this.turmas.some(
      turma => Number(turma.curso_id) === Number(curso.id)
    );

    const aviso = usadoEmTurma
      ? `O curso "${curso.nome}" está associado a uma ou mais turmas. O servidor pode impedir a exclusão. Deseja continuar?`
      : `Deseja realmente excluir o curso "${curso.nome}"?`;

    if (!confirm(aviso)) return;

    const headers = this.getHeaders();

    if (!headers) return;

    this.erro = '';
    this.mensagem = '';

    this.http.delete(
      `${this.api}/cursos/${curso.id}`,
      { headers }
    ).subscribe({
      next: () => {
        this.mensagem = 'Curso excluído com sucesso.';

        if (this.editandoCursoId === curso.id) {
          this.limparFormularioCurso();
        }

        if (this.turmaForm.curso_id === curso.id) {
          this.turmaForm.curso_id = 0;
        }

        this.carregarCursos();
        this.cdr.markForCheck();
      },
      error: erro => this.tratarErro(erro, 'excluir o curso')
    });
  }

  limparFormularioCurso(): void {
    this.editandoCursoId = null;
    this.cursoForm = {
      nome: ''
    };
  }

  // TURMAS

  get turmasFiltradas(): Turma[] {
    const termo = this.buscaTurma.trim().toLowerCase();

    if (!termo) return this.turmas;

    return this.turmas.filter(turma =>
      [
        String(turma.serie),
        turma.curso?.nome,
        turma.codigo_acesso,
        String(turma.id)
      ].some(valor =>
        String(valor ?? '').toLowerCase().includes(termo)
      )
    );
  }

  carregarTurmas(): void {
    const headers = this.getHeaders();

    if (!headers) return;

    this.iniciarCarregamento();
    this.erro = '';

    forkJoin({
      turmas: this.http.get<Turma[]>(
        `${this.api}/salas`,
        { headers }
      ),
      cursos: this.http.get<Curso[]>(
        `${this.api}/cursos`,
        { headers }
      )
    }).subscribe({
      next: resultado => {
        this.turmas = resultado.turmas;
        this.cursos = resultado.cursos;
        this.finalizarCarregamento();
      },
      error: erro => {
        this.finalizarCarregamento();
        this.tratarErro(erro, 'carregar as turmas e os cursos');
      }
    });
  }

  salvarTurma(): void {
    const headers = this.getHeaders();

    if (!headers) return;

    if (
      !this.turmaForm.curso_id ||
      !Number.isInteger(Number(this.turmaForm.serie)) ||
      Number(this.turmaForm.serie) < 1
    ) {
      this.erro = 'Selecione um curso e informe uma série válida.';
      return;
    }

    this.salvandoTurma = true;
    this.erro = '';
    this.mensagem = '';

    const editandoId = this.editandoTurmaId;

    const requisicao = editandoId !== null
      ? this.http.put(
          `${this.api}/salas/${editandoId}`,
          this.turmaForm,
          { headers }
        )
      : this.http.post(
          `${this.api}/salas`,
          this.turmaForm,
          { headers }
        );

    requisicao.subscribe({
      next: () => {
        this.salvandoTurma = false;
        this.mensagem = editandoId !== null
          ? 'Turma atualizada com sucesso.'
          : 'Turma cadastrada com sucesso.';

        this.limparFormularioTurma();
        this.carregarTurmas();
        this.cdr.markForCheck();
      },
      error: erro => {
        this.salvandoTurma = false;
        this.tratarErro(erro, 'salvar a turma');
      }
    });
  }

  editarTurma(turma: Turma): void {
    this.editandoTurmaId = turma.id;

    this.turmaForm = {
      serie: turma.serie,
      curso_id: turma.curso_id
    };

    this.erro = '';
    this.mensagem = '';
  }

  excluirTurma(turma: Turma): void {
    const nomeTurma =
      `${turma.serie}º ${turma.curso?.nome ?? ''}`.trim();

    if (!confirm(`Deseja realmente excluir a turma ${nomeTurma}?`)) {
      return;
    }

    const headers = this.getHeaders();

    if (!headers) return;

    this.erro = '';
    this.mensagem = '';

    this.http.delete(
      `${this.api}/salas/${turma.id}`,
      { headers }
    ).subscribe({
      next: () => {
        this.mensagem = 'Turma excluída com sucesso.';

        if (this.editandoTurmaId === turma.id) {
          this.limparFormularioTurma();
        }

        this.carregarTurmas();
        this.cdr.markForCheck();
      },
      error: erro => this.tratarErro(erro, 'excluir a turma')
    });
  }

  limparFormularioTurma(): void {
    this.editandoTurmaId = null;
    this.turmaForm = {
      serie: 1,
      curso_id: 0
    };
  }

  // REPRESENTANTES

  carregarRepresentantes(): void {
    const headers = this.getHeaders();

    if (!headers) return;

    this.iniciarCarregamento();
    this.erro = '';

    forkJoin({
      turmas: this.http.get<Turma[]>(
        `${this.api}/salas`,
        { headers }
      ),
      usuarios: this.http.get<Usuario[]>(
        `${this.api}/usuarios`,
        { headers }
      )
    }).subscribe({
      next: resultado => {
        this.turmas = resultado.turmas;
        this.usuarios = resultado.usuarios;
        this.finalizarCarregamento();
      },
      error: erro => {
        this.finalizarCarregamento();
        this.tratarErro(erro, 'carregar os representantes');
      }
    });
  }

  alunosDaTurma(turma: Turma): Usuario[] {
    return this.usuarios.filter(usuario =>
      usuario.nivel_acesso === 'aluno' &&
      Number(usuario.sala_id) === Number(turma.id)
    );
  }

  definirRepresentante(
    turma: Turma,
    representanteId: number
  ): void {
    if (!representanteId) {
      this.erro = 'Selecione um aluno para ser representante.';
      return;
    }

    const headers = this.getHeaders();

    if (!headers) return;

    this.erro = '';
    this.mensagem = '';

    this.http.put(
      `${this.api}/salas/${turma.id}/representante`,
      { representante_id: representanteId },
      { headers }
    ).subscribe({
      next: () => {
        this.mensagem = 'Representante definido com sucesso.';
        this.carregarRepresentantes();
        this.cdr.markForCheck();
      },
      error: erro => this.tratarErro(erro, 'definir o representante')
    });
  }
}
