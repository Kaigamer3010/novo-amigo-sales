import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LivrosService {

  private apiUrl = environment.baseUrl + '/api/livros';

  constructor(private http: HttpClient) {}

  obterLivros() {
    return this.http.get<any[]>(this.apiUrl);
  }

}
