import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Artigo } from '../models/artigoJornal';

@Injectable({
  providedIn: 'root'
})
export class ArtigosService {
  private apiUrl = 'http://127.0.0.1:8000/api/artigos';

  constructor(private http: HttpClient) {}

  obterArtigos(): Observable<Artigo[]> {
    return this.http.get<Artigo[]>(this.apiUrl);
  }
}