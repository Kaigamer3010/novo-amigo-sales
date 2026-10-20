import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Artigo } from '../models/artigoJornal';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ArtigosService {
  private apiUrl = environment.baseUrl + '/api/artigos';

  constructor(private http: HttpClient) {}

  obterArtigos(): Observable<Artigo[]> {
    return this.http.get<Artigo[]>(this.apiUrl);
  }
}