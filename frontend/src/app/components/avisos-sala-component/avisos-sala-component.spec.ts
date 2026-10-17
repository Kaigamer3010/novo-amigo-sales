import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvisosSalaComponent } from './avisos-sala-component';

describe('AvisosSalaComponent', () => {
  let component: AvisosSalaComponent;
  let fixture: ComponentFixture<AvisosSalaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvisosSalaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AvisosSalaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
