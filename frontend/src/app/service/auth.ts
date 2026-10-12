
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Usuario {
  id: number;
  nome_completo: string;
  nome_usuario: string;
  nivel_acesso: 'aluno' | 'administrador' | 'bibliotecario';
  sala_id?: number | null;
}

export interface LoginRequest {
  nome_usuario: string;
  senha: string;
}

export interface LoginResponse {
  usuario: Usuario;
  token: string;
}

export interface CadastroRequest {
  nome_completo: string;
  nome_usuario: string;
  senha: string;
  nivel_acesso: 'aluno' | 'administrador' | 'bibliotecario';
  codigo_acesso: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  // essa variavel guarda as informações do usuario que foi cadastrado

  private usuarioLogado: Usuario | null = null;

// esse método define que os dados do usuario serão guardados na variavel usuarioLogado

definirUsuario(usuario: Usuario): void {
  this.usuarioLogado = usuario;
}

// esse método faz a gente ter acesso àquela váriavel

obterUsuario(): Usuario | null {
  return this.usuarioLogado;
}

// essa retorna os cargos atribuidos ao usuarioLogado

obterCargo(): string | null {
  return this.usuarioLogado?.nivel_acesso ?? null;
}

// a gente usa essa aqui no html para ver se o usuário atual tem algum dos cargos que tem acesso à alguma coisa

temCargo(cargos: string[]): boolean {
  return this.usuarioLogado !== null &&
    cargos.includes(this.usuarioLogado.nivel_acesso);
}

  constructor(private http: HttpClient) {}

  login(dados: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      dados
    );
  }

  cadastrar(dados: CadastroRequest): Observable<{ usuario: Usuario; token: string }> {
    return this.http.post<{ usuario: Usuario; token: string }>(
      `${this.apiUrl}/cadastro`,
      dados
    );
  }

  logout(): Observable<{ mensagem: string }> {
    const token = localStorage.getItem('token');

    return this.http.post<{ mensagem: string }>(
      `${this.apiUrl}/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }
}
