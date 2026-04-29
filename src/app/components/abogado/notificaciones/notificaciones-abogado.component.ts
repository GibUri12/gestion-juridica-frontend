import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

import { SidebarComponent } from '../../sidebar/sidebar.component';
import { NotificacionService, NotificacionDTO } from '../../../services/notificacion.service';

@Component({
  selector: 'app-notificaciones-abogado',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './notificaciones-abogado.component.html',
  styleUrls: ['./notificaciones-abogado.component.css']
})
export class NotificacionesAbogadoComponent implements OnInit {

  today    = new Date();
  userName = localStorage.getItem('username');
  loading  = false;

  notificaciones: NotificacionDTO[] = [];

  constructor(
    private notifService: NotificacionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    this.loading = true;
    this.notifService.getAll().subscribe({
      next: data => { this.notificaciones = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  /** Al hacer clic en una notificación: marcar leída y navegar */
  onClickNotificacion(n: NotificacionDTO): void {
    if (!n.leida) {
      this.notifService.marcarLeida(n.id).subscribe(() => {
        n.leida = true;
      });
    }

    if (n.tipo === 'NUEVA_AUDIENCIA_ASIGNADA') {
      this.router.navigate(['/abogado/audiencias']);
    }
  }

  marcarTodasLeidas(): void {
    this.notifService.marcarTodasLeidas().subscribe({
      next: () => {
        this.notificaciones.forEach(n => n.leida = true);
        Swal.fire({ icon: 'success', title: 'Listo', text: 'Todas las notificaciones marcadas como leídas.', timer: 1800, showConfirmButton: false });
      }
    });
  }

  get noLeidasCount(): number {
    return this.notificaciones.filter(n => !n.leida).length;
  }

  iconoTipo(tipo: string): string {
    switch (tipo) {
      case 'NUEVA_AUDIENCIA_ASIGNADA':       return 'bi-calendar-event-fill';
      case 'RESULTADO_AUDIENCIA_REGISTRADO': return 'bi-check2-circle';
      case 'EXPEDIENTE_ACTUALIZADO':         return 'bi-folder2-open';
      case 'RECORDATORIO_EXPEDIENTE':        return 'bi-alarm-fill';
      default: return 'bi-bell-fill';
    }
  }

  colorTipo(tipo: string): string {
    switch (tipo) {
      case 'NUEVA_AUDIENCIA_ASIGNADA':       return 'icon--gold';
      case 'RESULTADO_AUDIENCIA_REGISTRADO': return 'icon--green';
      case 'EXPEDIENTE_ACTUALIZADO':         return 'icon--blue';
      case 'RECORDATORIO_EXPEDIENTE':        return 'icon--rose';
      default: return 'icon--gray';
    }
  }
}
