
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

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

  private usuarioInicial(): Usuario | null {
    try {
      const salvo = localStorage.getItem('usuario');
      return salvo ? JSON.parse(salvo) as Usuario : null;
    } catch {
      return null;
    }
  }

  private usuarioSubject = new BehaviorSubject<Usuario | null>(
    this.usuarioInicial()
  );

  usuario$ = this.usuarioSubject.asObservable();

  constructor(private http: HttpClient) {}

  definirUsuario(usuario: Usuario): void {
    localStorage.setItem('usuario', JSON.stringify(usuario));
    this.usuarioSubject.next(usuario);
  }

  obterUsuario(): Usuario | null {
    return this.usuarioSubject.value;
  }

  obterCargo(): string | null {
    return this.usuarioSubject.value?.nivel_acesso ?? null;
  }

  temCargo(cargos: string[]): boolean {
    const usuario = this.usuarioSubject.value;
    return usuario !== null && cargos.includes(usuario.nivel_acesso);
  }

  login(dados: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, dados);
  }

  cadastrar(
    dados: CadastroRequest
  ): Observable<{ usuario: Usuario; token: string }> {
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
