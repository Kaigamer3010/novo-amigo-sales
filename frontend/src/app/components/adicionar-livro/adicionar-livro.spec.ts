import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdicionarLivro } from './adicionar-livro';

describe('AdicionarLivro', () => {
  let component: AdicionarLivro;
  let fixture: ComponentFixture<AdicionarLivro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdicionarLivro],
    }).compileComponents();

    fixture = TestBed.createComponent(AdicionarLivro);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
