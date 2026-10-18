
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GradeHorarios } from '../models/gradeHorario';

@Injectable({
  providedIn: 'root',
})
export class HorariosGradeService {
  private apiUrl = 'http://127.0.0.1:8000/api/horarios-grade';

  constructor(private http: HttpClient) {}

  obterHorario(): Observable<GradeHorarios[]> {
    return this.http.get<GradeHorarios[]>(this.apiUrl);
  }

  adicionarHorario(
    horario: Omit<GradeHorarios, 'id'>
  ): Observable<GradeHorarios> {
    return this.http.post<GradeHorarios>(this.apiUrl, horario);
  }
}
