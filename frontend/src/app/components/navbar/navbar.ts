
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router, RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { Offcanvas } from 'bootstrap';

import { PerfilUsuario } from '../perfil-usuario/perfil-usuario';
import { LoginComponent } from '../login/login';
import { AuthService, Usuario } from '../../service/auth';
import { environment } from '../../../environments/environment';

interface Sala {
  id: number;
  representante_id: number | null;
}

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, AsyncPipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit, OnDestroy {
  private readonly apiUrl = environment.baseUrl + '/api';

  @ViewChild('sidenav') sidenav!: MatSidenav;


  podeGerenciarTurma = false;
  private usuarioSubscription?: Subscription;

  constructor(
    private dialog: MatDialog,
    public auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    console.log('NAVBAR INICIADA');

    this.usuarioSubscription = this.auth.usuario$.subscribe({
      next: (usuario) => {
        console.log('USUÁRIO RECEBIDO NA NAVBAR:', usuario);
        this.verificarRepresentante(usuario);
      },
      error: (erro) => {
        console.error('Erro ao observar o usuário:', erro);
      }
    });
  }

  ngOnDestroy(): void {
    this.usuarioSubscription?.unsubscribe();
  }

  private verificarRepresentante(usuario: Usuario | null): void {
    this.podeGerenciarTurma = false;

    console.log('VERIFICANDO REPRESENTANTE:', usuario);

    if (!usuario) {
      console.log('Nenhum usuário conectado.');
      return;
    }

    if (usuario.nivel_acesso !== 'aluno') {
      console.log('O usuário não tem nível de acesso aluno.');
      return;
    }

    if (!usuario.sala_id) {
      console.log('O usuário não possui sala_id:', usuario);
      return;
    }

    const token = localStorage.getItem('token');

    if (!token) {
      console.log('Token não encontrado no localStorage.');
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    });

    this.http
      .get<Sala>(`${this.apiUrl}/salas/${usuario.sala_id}`, { headers })
      .subscribe({
        next: (sala) => {
          console.log('SALA RETORNADA PELA API:', sala);

          const usuarioAtual = this.auth.obterUsuario();

          this.podeGerenciarTurma =
            !!usuarioAtual &&
            Number(usuarioAtual.id) === Number(usuario.id) &&
            usuarioAtual.nivel_acesso === 'aluno' &&
            Number(usuarioAtual.sala_id) === Number(sala.id) &&
            Number(sala.representante_id) === Number(usuario.id);

          console.log(
            'PODE GERENCIAR TURMA?',
            this.podeGerenciarTurma
          );
        },
        error: (erro) => {
          console.error('ERRO AO BUSCAR A SALA:', erro);
          this.podeGerenciarTurma = false;
        }
      });
  }

  abrirLogin(): void {
    this.dialog.open(LoginComponent, {
      width: '400px',
      maxWidth: '95vw',
      autoFocus: false,
      panelClass: 'login-dialog'
    });
  }

  sair(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.auth.limparSessao();
        this.router.navigate(['/pg-inicial']);
      },
      error: () => {
        this.auth.limparSessao();
        this.router.navigate(['/pg-inicial']);
      }
    });
  }

  abrirPerfil(): void {
    this.dialog.open(PerfilUsuario, {
      width: '380px',
      maxWidth: '95vw',
      autoFocus: false
    });
  }

  fecharMenu(): void {
  const elemento = document.getElementById('offcanvasExample');

  if (elemento) {
    const menu = Offcanvas.getInstance(elemento);

    if (menu) {
      menu.hide();
    }
  }

  // Remove possíveis resíduos do Offcanvas
  setTimeout(() => {
    document.querySelectorAll('.offcanvas-backdrop').forEach((backdrop) => {
      backdrop.remove();
    });

    document.body.classList.remove('modal-open');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  }, 300);
}
}
