import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { PerfilUsuario } from '../perfil-usuario/perfil-usuario';


import { LoginComponent } from '../login/login';
import { AuthService } from '../../service/auth';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, AsyncPipe],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {

  constructor(
    private dialog: MatDialog,
    public auth: AuthService,
    private router: Router
  ) {}

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
        // Mesmo se a API falhar, encerra a sessão local.
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
}
