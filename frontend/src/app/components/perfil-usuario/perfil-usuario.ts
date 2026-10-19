import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../service/auth';
import { Router } from '@angular/router';


@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  templateUrl: './perfil-usuario.html',
  styleUrl: './perfil-usuario.css'
})
export class PerfilUsuario {

  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<PerfilUsuario>);
  private router = inject(Router);

  usuario = this.authService.obterUsuario();

  sair(): void {
  this.authService.logout().subscribe({
    next: () => {
      this.authService.limparSessao();
      this.router.navigate(['/pg-inicial']);
    },
    error: () => {
      this.authService.limparSessao();
      this.router.navigate(['/pg-inicial']);
    }
  });
}
}
