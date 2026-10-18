import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GerenciarCalendario } from './gerenciar-calendario';

describe('GerenciarCalendario', () => {
  let component: GerenciarCalendario;
  let fixture: ComponentFixture<GerenciarCalendario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GerenciarCalendario],
    }).compileComponents();

    fixture = TestBed.createComponent(GerenciarCalendario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
