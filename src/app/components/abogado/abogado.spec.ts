import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Abogado } from './abogado';

describe('Abogado', () => {
  let component: Abogado;
  let fixture: ComponentFixture<Abogado>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Abogado]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Abogado);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
