import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditarPgInicial } from './editar-pg-inicial';

describe('EditarPgInicial', () => {
  let component: EditarPgInicial;
  let fixture: ComponentFixture<EditarPgInicial>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditarPgInicial],
    }).compileComponents();

    fixture = TestBed.createComponent(EditarPgInicial);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
