
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { GradeHorarios } from '../models/gradeHorario';

interface HorarioLaravel {
  id: number;
  sala_id: number;
  dia_semana: string;
  disciplina: string;
  num_aula: number;
}

@Injectable({
  providedIn: 'root',
})
export class HorariosGradeService {
  private http = inject(HttpClient);
  private apiUrl = 'http://127.0.0.1:8000/api/horarios';

  private headers(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders(
      token ? { Authorization: `Bearer ${token}` } : {}
    );
  }

  private converter(horario: HorarioLaravel): GradeHorarios {
    const horariosAula: Record<number, string> = {
      1: '07:00',
      2: '07:50',
      3: '08:40',
      4: '09:50',
      5: '10:40',
      6: '11:30',
    };

    return {
      id: horario.id,
      sala_id: horario.sala_id,
      dia_semana: horario.dia_semana,
      materia: horario.disciplina,
      hora_inicio: horariosAula[horario.num_aula] ?? '--:--',
    };
  }

  obterHorario(salaId?: number): Observable<GradeHorarios[]> {
    const url = salaId
      ? `${this.apiUrl}/sala/${salaId}`
      : this.apiUrl;

    return this.http
      .get<HorarioLaravel[]>(url, { headers: this.headers() })
      .pipe(map(horarios => horarios.map(horario => this.converter(horario))));
  }
}
