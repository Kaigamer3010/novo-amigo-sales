import { Component, inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../service/auth';

@Component({
  selector: 'app-perfil-usuario',
  standalone: true,
  templateUrl: './perfil-usuario.html',
  styleUrl: './perfil-usuario.css'
})
export class PerfilUsuario {

  private authService = inject(AuthService);
  private dialogRef = inject(MatDialogRef<PerfilUsuario>);

  usuario = this.authService.obterUsuario();

  sair(): void {
  this.authService.logout().subscribe({
    next: () => {
      this.dialogRef.close();
    },
    error: () => {
      this.dialogRef.close();
    }
  });
}
}
