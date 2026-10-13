import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Edicao } from '../models/edicaoJornal';

@Injectable({
  providedIn: 'root'
})
export class EdicoesService {
  private apiUrl = 'http://127.0.0.1:8000/api/edicoes';

  constructor(private http: HttpClient) {}

  obterEdicoes(): Observable<Edicao[]> {
    return this.http.get<Edicao[]>(this.apiUrl);
  }
}