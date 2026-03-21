import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpedientesListaComponent } from './expedientes-lista.component';

describe('Abogado', () => {
  let component: ExpedientesListaComponent;
  let fixture: ComponentFixture<ExpedientesListaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExpedientesListaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpedientesListaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
