import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

import { SidebarComponent } from '../../sidebar/sidebar.component';
import { NotificacionService, NotificacionDTO } from '../../../services/notificacion.service';

@Component({
  selector: 'app-notificaciones-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent],
  templateUrl: './notificaciones-admin.component.html',
  styleUrls: [
    '../../abogado/notificaciones/notificaciones-abogado.component.css',
    './notificaciones-admin.component.css'
  ]
})
export class NotificacionesAdminComponent implements OnInit, OnDestroy {

  today    = new Date();
  userName = localStorage.getItem('username');
  loading  = false;

  notificaciones: NotificacionDTO[] = [];
  private subs = new Subscription();

  constructor(
    private notifService: NotificacionService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.cargarNotificaciones();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  cargarNotificaciones(): void {
    this.loading = true;
    this.subs.add(
      this.notifService.getAll().subscribe({
        next: data => { this.notificaciones = data; this.loading = false; },
        error: () => { this.loading = false; }
      })
    );
  }

  /**
   * Al hacer clic en una notificación:
   *  - La marca como leída
   *  - Si es RESULTADO_AUDIENCIA_REGISTRADO → navega a /admin/expedientes?expedienteId=X
   */
  onClickNotificacion(n: NotificacionDTO): void {
    if (!n.leida) {
      this.notifService.marcarLeida(n.id).subscribe(() => { n.leida = true; });
    }

    if (n.tipo === 'RESULTADO_AUDIENCIA_REGISTRADO' && n.referenceId) {
      this.router.navigate(['/admin/expedientes'], {
        queryParams: { expedienteId: n.referenceId, abrirAudiencias: '1' }
      });
    } else if (n.tipo === 'NUEVA_AUDIENCIA_ASIGNADA' && n.referenceId) {
      this.router.navigate(['/admin/audiencias']);
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
      case 'RESULTADO_AUDIENCIA_REGISTRADO': return 'icon--indigo';
      case 'EXPEDIENTE_ACTUALIZADO':         return 'icon--blue';
      case 'RECORDATORIO_EXPEDIENTE':        return 'icon--rose';
      default: return 'icon--gray';
    }
  }
}
