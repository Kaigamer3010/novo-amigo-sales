import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Edicao } from '../models/edicaoJornal';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EdicoesService {
  private apiUrl = environment.baseUrl + '/api/edicoes';

  constructor(private http: HttpClient) {}

  obterEdicoes(): Observable<Edicao[]> {
    return this.http.get<Edicao[]>(this.apiUrl);
  }
}