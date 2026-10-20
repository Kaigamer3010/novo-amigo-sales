
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ComunicadoSala {
  id: number;
  titulo: string;
  descricao: string;
  sala_id: number;
  usuario_id: number;
  created_at: string;
  sala?: {
    id: number;
    serie: number;
    curso?: {
      id: number;
      nome: string;
    };
  };
  usuario?: {
    id: number;
    nome_completo: string;
  };
}

export interface NovoComunicadoSala {
  titulo: string;
  descricao: string;
}

@Injectable({
  providedIn: 'root',
})
export class ComunicadosSalaService {
  private apiUrl = environment.baseUrl + '/api/comunicados';

  constructor(private http: HttpClient) {}

  private obterHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  obterComunicados(): Observable<ComunicadoSala[]> {
    return this.http.get<ComunicadoSala[]>(this.apiUrl, {
      headers: this.obterHeaders(),
    });
  }

  publicarComunicado(
    comunicado: NovoComunicadoSala
  ): Observable<ComunicadoSala> {
    return this.http.post<ComunicadoSala>(
      this.apiUrl,
      comunicado,
      { headers: this.obterHeaders() }
    );
  }
}
