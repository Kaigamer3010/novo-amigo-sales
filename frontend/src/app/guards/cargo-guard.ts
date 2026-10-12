import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../service/auth';

export const cargoGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const cargosPermitidos =
    route.data['cargos'] as string[];

  if (auth.temCargo(cargosPermitidos)) {
    return true;
  }

  return router.createUrlTree(['/pg-inicial']);
};  