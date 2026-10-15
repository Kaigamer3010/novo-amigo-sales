import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PgUsersAdm } from './pg-users-adm';

describe('PgUsersAdm', () => {
  let component: PgUsersAdm;
  let fixture: ComponentFixture<PgUsersAdm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PgUsersAdm],
    }).compileComponents();

    fixture = TestBed.createComponent(PgUsersAdm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
