import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { cargoGuard } from './cargo-guard';

describe('cargoGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => cargoGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
