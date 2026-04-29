import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ExpedienteService } from '../../services/expediente.service'; // Asegúrate de la ruta correcta
import { Expediente } from '../abogado/expedientes/expediente.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userName: string | null = '';
  userRole: string | null = '';
  today = new Date();
  
  // Variables para datos
  expedientesRecientes: Expediente[] = [];
  totalActivos: number = 0;
  totalClientes: number = 0;
  proximasAudiencias: Expediente[] = [];
  loading: boolean = true;

  isSidebarActive = false;

  constructor(
    private eRef: ElementRef,
    private expService: ExpedienteService // Inyectamos el servicio
  ) {}

  ngOnInit() {
    this.userName = localStorage.getItem('username');
    this.userRole = localStorage.getItem('role');
    this.cargarDatosDashboard();
  }

  cargarDatosDashboard() {
    this.loading = true;
    this.expService.getAll().subscribe({
      next: (data) => {
        // 1. Calcular Expedientes Activos
        this.totalActivos = data.filter(e => e.estado === 'ACTIVO').length;

        // 2. Obtener Expedientes Recientes (últimos 5 creados)
        // Asumiendo que el id o la fecha indican el orden
        this.expedientesRecientes = [...data]
          .sort((a, b) => b.id - a.id)
          .slice(0, 5);

        // 3. Obtener Clientes Únicos
        const clientesIds = new Set(data.map(e => e.cliente?.id));
        this.totalClientes = clientesIds.size;

        // 4. Próximas Audiencias (Expedientes que tienen fecha de audiencia futura)
        const ahora = new Date();
        this.proximasAudiencias = data
          .filter(e => e.proximaAudiencia && new Date(e.proximaAudiencia) >= ahora)
          .sort((a, b) => new Date(a.proximaAudiencia!).getTime() - new Date(b.proximaAudiencia!).getTime())
          .slice(0, 4);

        this.loading = false;
      },
      error: (err) => {
        console.error("Error cargando dashboard", err);
        this.loading = false;
      }
    });
  }

  toggleSidebar(event: Event) {
    event.stopPropagation();
    this.isSidebarActive = !this.isSidebarActive;
  }

  @HostListener('document:click', ['$event'])
  clickOut(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isSidebarActive = false;
    }
  }
}