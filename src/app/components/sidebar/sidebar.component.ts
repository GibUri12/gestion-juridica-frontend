import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { NotificacionService } from '../../services/notificacion.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit, OnDestroy {
  userName: string | null = '';
  userRole: string | null = '';
  isSidebarOpen = false;
  notificacionesCount = 0;
  currentYear = new Date().getFullYear();

  private pollSub?: Subscription;

  constructor(
    private router: Router,
    private notifService: NotificacionService
  ) {}

  ngOnInit() {
    this.userName = localStorage.getItem('username');
    this.userRole = localStorage.getItem('role');
    this.iniciarPollingNotificaciones();
  }

  ngOnDestroy() {
    this.pollSub?.unsubscribe();
  }

  /** Polling cada 30 s para mantener actualizado el contador de no leídas */
  private iniciarPollingNotificaciones() {
    // Carga inmediata + repetición cada 30 s
    this.pollSub = interval(30_000).pipe(
      switchMap(() => this.notifService.countNoLeidas())
    ).subscribe({
      next: count => this.notificacionesCount = count,
      error: () => {}  // Silenciar errores de red para no interrumpir la UI
    });

    // Primera carga inmediata (no espera el primer tick del interval)
    this.notifService.countNoLeidas().subscribe({
      next: count => this.notificacionesCount = count,
      error: () => {}
    });
  }

  getRoleLabel(): string {
    switch (this.userRole) {
      case 'ROLE_ADMINISTRADOR': return 'Administrador';
      case 'ROLE_ABOGADO':       return 'Abogado';
      case 'ROLE_IT_MANAGER':    return 'IT Manager';
      default:                   return '';
    }
  }

  toggleSidebar() { this.isSidebarOpen = !this.isSidebarOpen; }
  closeSidebar()  { this.isSidebarOpen = false; }

  onLogout() {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: 'Tendrás que ingresar tus credenciales nuevamente.',
      icon: 'question',
      background: '#fff',
      color: '#2c2c2c',
      showCancelButton: true,
      confirmButtonColor: '#b8924a',
      cancelButtonColor: '#9e9e9e',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.pollSub?.unsubscribe();
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    });
  }
}