
import { Routes } from '@angular/router';

import { PaginaInicial } from './pages/pagina-inicial/pagina-inicial';
import { Jornal } from './pages/jornal/jornal';
import { Biblioteca } from './pages/biblioteca/biblioteca';
import { Sala } from './pages/sala/sala';
import { EditarPgInicial } from './pages/editar-pg-inicial/editar-pg-inicial';
import { Dashboard } from './pages/dashboard/dashboard';

import { cargoGuard } from './guards/cargo-guard';
import { AdicionarLivro } from './components/adicionar-livro/adicionar-livro';

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
    path: '**',
    redirectTo: 'pg-inicial'
  }
];
