
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Aviso } from '../models/avisos';

@Injectable({
  providedIn: 'root',
})
export class AvisosService {
  private apiUrl = 'http://127.0.0.1:8000/api/avisos';

  constructor(private http: HttpClient) {}

  private obterHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Authorization: `Bearer ${token ?? ''}`,
      Accept: 'application/json',
    });
  }

  obterAvisos() {
    return this.http.get<Aviso[]>(this.apiUrl, {
      headers: this.obterHeaders(),
    });
  }

  adicionarAviso(aviso: Aviso) {
    return this.http.post<Aviso>(this.apiUrl, aviso, {
      headers: this.obterHeaders(),
    });
  }
}
