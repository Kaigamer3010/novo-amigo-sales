import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class LivrosService {

  private apiUrl = 'http://127.0.0.1:8000/api/livros';

  constructor(private http: HttpClient) {}

  obterLivros() {
    return this.http.get<any[]>(this.apiUrl);
  }

}
