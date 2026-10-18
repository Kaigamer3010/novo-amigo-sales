
import { Routes } from '@angular/router';

import { PaginaInicial } from './pages/pagina-inicial/pagina-inicial';
import { Jornal } from './pages/jornal/jornal';
import { Biblioteca } from './pages/biblioteca/biblioteca';
import { Sala } from './pages/sala/sala';
import { EditarPgInicial } from './pages/editar-pg-inicial/editar-pg-inicial';
import { Dashboard } from './pages/dashboard/dashboard';
import { GerenciarTurma } from './pages/gerenciar-turma/gerenciar-turma';
import { PgUsersAdm } from './pages/pg-users-adm/pg-users-adm';

import { cargoGuard } from './guards/cargo-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'pg-inicial',
    pathMatch: 'full'
  },
  {
    path: 'pg-inicial',
    component: PaginaInicial
  },
  {
    path: 'pg-jornal',
    component: Jornal
  },
  {
    path: 'pg-biblioteca',
    component: Biblioteca
  },
  {
    path: 'pg-sala',
    component: Sala
  },
  {
    path: 'pg-dashboard',
    component: Dashboard,
    canActivate: [cargoGuard],
    data: {
      cargos: ['bibliotecario', 'administrador']
    }
  },
  {
    path: 'editar-pg-inicial',
    component: EditarPgInicial,
    canActivate: [cargoGuard],
    data: {
      cargos: ['administrador']
    }
  },
  {
    path: 'pg-users-adm',
    component: PgUsersAdm,
    canActivate: [cargoGuard],
    data: { cargos: ['administrador'] }
  },
  {
    path: 'gerenciar-turma',
    component: GerenciarTurma
  },
  {
    path: '**',
    redirectTo: 'pg-inicial'
  }
];
