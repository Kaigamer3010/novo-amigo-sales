import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Aviso } from '../models/avisos';

@Injectable({
  providedIn: 'root',
})
export class AvisosSalaService {

  private avisos: Aviso[] = [
    {
      id: 1,
      titulo: 'Reunião de sala',
      descricao: 'Teremos uma reunião na próxima sexta-feira.',
      data_expiracao: '17/10/2026'
    },
    {
      id: 2,
      titulo: 'Entrega de trabalho',
      descricao: 'A entrega do trabalho de programação foi prorrogada.',
      data_expiracao: '20/10/2026'
    },
    {
      id: 3,
      titulo: 'Alteração de horário',
      descricao: 'A próxima aula terá seu horário alterado.',
      data_expiracao: '22/10/2026'
    },
    {
      id: 4,
      titulo: 'Aviso importante',
      descricao: 'Não se esqueçam de conferir as atividades pendentes.',
      data_expiracao: '23/10/2026'
    },
    {
      id: 5,
      titulo: 'Atividade em grupo',
      descricao: 'As equipes para a próxima atividade serão definidas em sala.',
      data_expiracao: '24/10/2026'
    }
  ];

  obterAvisos(): Observable<Aviso[]> {
    return of(this.avisos);
  }
}