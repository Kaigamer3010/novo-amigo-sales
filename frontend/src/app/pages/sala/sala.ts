import {
  Component,
  OnInit,
  ChangeDetectorRef
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import {
  MatPaginatorModule,
  PageEvent
} from '@angular/material/paginator';

import { AuthService } from '../../service/auth';
import { AvisosSalaComponent } from '../../components/avisos-sala-component/avisos-sala-component';
import { GradeHorariosComponent } from '../../components/grade-horarios/grade-horarios';
import { CalendarioComponent } from '../../components/calendario/calendario';

import {
  ComunicadosSalaService,
  ComunicadoSala
} from '../../service/comunicados-sala';
import { environment } from '../../../environments/environment';

interface SalaAluno {
  id: number;
  serie: number;
  curso_id: number;
  curso?: {
    id: number;
    nome?: string;
  } | null;
}

@Component({
  selector: 'app-sala',
  imports: [
    RouterLink,
    AvisosSalaComponent,
    MatPaginatorModule,
    CalendarioComponent
  ],
  templateUrl: './sala.html',
  styleUrl: './sala.css'
})
export class Sala implements OnInit {

  private readonly apiUrl = environment.baseUrl + '/api';

  constructor(
    private dialog: MatDialog,
    private comunicadosService: ComunicadosSalaService,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    public auth: AuthService
  ) {}

  // Informações do curso e da sala do aluno
  sala: SalaAluno | null = null;
  nomeCurso = '';
  serieAluno: number | null = null;
  carregandoCurso = true;
  erroCurso = '';

  // Grade de horários
  abrirGradeHorarios(): void {
    this.dialog.open(GradeHorariosComponent, {
      width: '800px',
      maxWidth: '95vw',
      height: '100%',
      maxHeight: '310px',
      panelClass: 'cardapio-dialog'
    });
  }

  // Comunicados da turma
  noticias: ComunicadoSala[] = [];
  noticiasVisiveis: ComunicadoSala[] = [];
  carregandoAvisos = true;

  ngOnInit(): void {
    this.carregarCurso();
    this.carregarAvisos();
  }

  private carregarCurso(): void {
    const usuario = this.auth.obterUsuario();

    if (!usuario) {
      this.erroCurso = 'Faça login para consultar seu curso.';
      this.carregandoCurso = false;
      this.cdr.detectChanges();
      return;
    }

    const salaId = usuario.sala_id;

    if (!salaId) {
      this.erroCurso = 'Sua conta ainda não está vinculada a uma turma.';
      this.carregandoCurso = false;
      this.cdr.detectChanges();
      return;
    }

    const token = localStorage.getItem('token');

    const headers = new HttpHeaders({
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    });

    this.http.get<SalaAluno>(
      `${this.apiUrl}/salas/${salaId}`,
      { headers }
    ).subscribe({
      next: (sala) => {
        this.sala = sala;
        this.nomeCurso = sala.curso?.nome ?? '';
        this.serieAluno = sala.serie;
        this.carregandoCurso = false;

        if (!this.nomeCurso) {
          this.erroCurso = 'O nome do curso não foi encontrado.';
        }

        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error('Erro ao carregar o curso do aluno:', erro);

        this.carregandoCurso = false;
        this.erroCurso = 'Não foi possível carregar os dados do curso.';

        this.cdr.detectChanges();
      }
    });
  }

  carregarAvisos(): void {
    this.carregandoAvisos = true;

    this.comunicadosService.obterComunicados().subscribe({
      next: (comunicados) => {
        this.noticias = [...comunicados];
        this.noticiasVisiveis = this.noticias.slice(0, 2);
        this.carregandoAvisos = false;

        this.cdr.detectChanges();
      },
      error: (erro) => {
        console.error(
          'Erro ao carregar comunicados da turma:',
          erro
        );

        this.noticias = [];
        this.noticiasVisiveis = [];
        this.carregandoAvisos = false;

        this.cdr.detectChanges();
      }
    });
  }

  mudarPagina(event: PageEvent): void {
    const inicio = event.pageIndex * event.pageSize;
    const fim = inicio + event.pageSize;

    this.noticiasVisiveis = this.noticias.slice(inicio, fim);
    this.cdr.detectChanges();
  }
}
