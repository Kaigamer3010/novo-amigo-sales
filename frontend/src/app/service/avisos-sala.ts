
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Aviso } from '../models/avisos';

@Injectable({
  providedIn: 'root',
})
export class AvisosSalaService {
  private apiUrl = 'http://127.0.0.1:8000/api/avisos';

  constructor(private http: HttpClient) {}

  private obterHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }

  obterAvisos(): Observable<Aviso[]> {
    return this.http.get<Aviso[]>(this.apiUrl, {
      headers: this.obterHeaders(),
    });
  }
}
