import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisExpedientesComponent } from './mis-expedientes.component';

describe('MisExpedientes', () => {
  let component: MisExpedientesComponent;
  let fixture: ComponentFixture<MisExpedientesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisExpedientesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MisExpedientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
