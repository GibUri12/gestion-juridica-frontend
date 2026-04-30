import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ExpedienteService } from '../../services/expediente.service';
import { Expediente } from '../dashboard/expedientes/expediente.model';

@Component({
  selector: 'app-abogado-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, DatePipe],
  templateUrl: './abogado-dashboard.component.html',
  styleUrls: ['../dashboard/dashboard.component.css']
})
export class AbogadoDashboardComponent implements OnInit {

  userName: string | null = '';
  today = new Date();
  loading = false;

  // ── Datos ──────────────────────────────────────────
  expedientes: Expediente[] = [];
  expedientesActivos: Expediente[] = [];
  proximasAudiencias: Expediente[] = [];

  // ── KPIs ───────────────────────────────────────────
  totalExpedientes  = 0;
  totalProximas     = 0;
  totalRealizadas   = 0;

  constructor(private expService: ExpedienteService) {}

  ngOnInit() {
    this.userName = localStorage.getItem('username');
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading = true;
    this.expService.getAll().subscribe({
      next: (data) => {
        this.expedientes = data;

        // KPI 1 — Total expedientes asignados
        this.totalExpedientes = data.length;

        // KPI 2 — Expedientes activos (para la tabla)
        this.expedientesActivos = data
          .filter(e => e.estado === 'ACTIVO')
          .slice(0, 5);

        // KPI 3 — Próximas audiencias (fecha futura)
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        this.proximasAudiencias = data
          .filter(e => e.proximaAudiencia && new Date(e.proximaAudiencia) >= hoy)
          .sort((a, b) =>
            new Date(a.proximaAudiencia!).getTime() -
            new Date(b.proximaAudiencia!).getTime()
          )
          .slice(0, 4);

        this.totalProximas = this.proximasAudiencias.length;

        // KPI 4 — Audiencias realizadas este mes
        // (expedientes cuya próxima audiencia ya pasó este mes)
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        this.totalRealizadas = data.filter(e =>
          e.proximaAudiencia &&
          new Date(e.proximaAudiencia) >= inicioMes &&
          new Date(e.proximaAudiencia) < hoy
        ).length;

        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  estadoClass(estado: string): string {
    const map: Record<string, string> = {
      ACTIVO:     'badge-owner--mine',
      EN_PROCESO: 'badge-status--process',
      FINALIZADO: 'badge-status--finalized'
    };
    return map[estado] ?? '';
  }

  estadoLabel(estado: string): string {
    const map: Record<string, string> = {
      ACTIVO:     'Activo',
      EN_PROCESO: 'En Proceso',
      FINALIZADO: 'Finalizado'
    };
    return map[estado] ?? estado;
  }
}