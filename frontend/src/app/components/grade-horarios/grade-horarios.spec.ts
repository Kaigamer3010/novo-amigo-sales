import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GradeHorarios } from './grade-horarios';

describe('GradeHorarios', () => {
  let component: GradeHorarios;
  let fixture: ComponentFixture<GradeHorarios>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GradeHorarios],
    }).compileComponents();

    fixture = TestBed.createComponent(GradeHorarios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
