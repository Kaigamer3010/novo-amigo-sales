import { Component, OnInit, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Usuario } from '../../models/usuario';

@Component({
  selector: 'app-pg-users-adm',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pg-users-adm.html',
  styleUrl: './pg-users-adm.css'
})
export class PgUsersAdm implements OnInit {
  private http = inject(HttpClient);

  usuarios: Usuario[] = [];

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  carregarUsuarios(): void {
    const token = localStorage.getItem('token');

    console.log('Token encontrado?', !!token);

    if (!token) {
      console.error('Nenhum token encontrado. Faça login novamente.');
      return;
    }

    console.log('Fazendo GET /api/usuarios...');

    this.http.get<Usuario[]>(
      'http://127.0.0.1:8000/api/usuarios',
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ).subscribe({
      next: (usuarios) => {
        console.log('Resposta da API:', usuarios);
        this.usuarios = usuarios;
      },
      error: (erro) => {
        console.error('Status HTTP:', erro.status);
        console.error('Detalhes do erro:', erro.error);
      }
    });
  }

  alterarCargo(
    usuario: Usuario,
    novoCargo: Usuario['nivel_acesso']
  ): void {
    const token = localStorage.getItem('token');

    if (!token) {
      console.error('Nenhum token encontrado.');
      return;
    }

    this.http.patch(
      `http://127.0.0.1:8000/api/usuarios/${usuario.id}`,
      { nivel_acesso: novoCargo },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    ).subscribe({
      next: () => {
        usuario.nivel_acesso = novoCargo;
      },
      error: (erro) => {
        console.error('Erro ao alterar cargo:', erro);
      }
    });
  }
}