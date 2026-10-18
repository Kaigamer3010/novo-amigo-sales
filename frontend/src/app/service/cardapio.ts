
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cardapio } from '../models/cardapio';

@Injectable({
  providedIn: 'root',
})
export class CardapioService {
  private readonly apiUrl = 'http://127.0.0.1:8000/api/cardapios';

  constructor(private http: HttpClient) {}

  private obterHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    let headers = new HttpHeaders();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  obterCardapio(): Observable<Cardapio[]> {
    return this.http.get<Cardapio[]>(this.apiUrl, {
      headers: this.obterHeaders(),
    });
  }

  adicionarCardapio(
    cardapio: Omit<Cardapio, 'id'>
  ): Observable<Cardapio> {
    return this.http.post<Cardapio>(
      this.apiUrl,
      cardapio,
      { headers: this.obterHeaders() }
    );
  }

  atualizarCardapio(
    id: number,
    cardapio: Omit<Cardapio, 'id'>
  ): Observable<Cardapio> {
    return this.http.put<Cardapio>(
      `${this.apiUrl}/${id}`,
      cardapio,
      { headers: this.obterHeaders() }
    );
  }
}
