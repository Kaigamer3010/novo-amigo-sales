import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { LoginComponent } from '../login/login';
import { AuthService } from '../../service/auth';


@Component({
  selector: 'app-navbar',
  imports: [RouterLink],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {

  constructor(private dialog: MatDialog, public auth: AuthService) {}

  abrirLogin() {
    this.dialog.open(LoginComponent, {
      width: '400px',
      maxWidth: '95vw',
      autoFocus: false,
      panelClass: 'login-dialog'
});
  }
}