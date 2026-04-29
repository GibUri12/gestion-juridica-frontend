import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AudienciaService, Audiencia } from '../../dashboard/audiencias/audiencia.service';

@Component({
  selector: 'app-mis-audiencias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
  templateUrl: './mis-audiencias.component.html',
  styleUrls: ['./mis-audiencias.component.css']
})
export class MisAudienciasComponent implements OnInit {

  today    = new Date();
  userName = localStorage.getItem('username');
  loading  = false;

  audiencias: Audiencia[] = [];

  // ── Modal registro de resultado ───────────────────────────────────
  modalResultadoVisible = false;
  audienciaSeleccionada?: Audiencia;
  formResultado = { resultado: '', notasTipo: '' };
  guardando = false;

  constructor(private audienciaService: AudienciaService) {}

  ngOnInit(): void {
    this.cargarAudiencias();
  }

  cargarAudiencias(): void {
    this.loading = true;
    this.audienciaService.getMisAudiencias().subscribe({
      next: data => { this.audiencias = data; this.loading = false; },
      error: () => {
        this.loading = false;
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las audiencias.' });
      }
    });
  }

  // ── Modal resultado ───────────────────────────────────────────────

  abrirRegistroResultado(aud: Audiencia): void {
    this.audienciaSeleccionada = aud;
    this.formResultado = {
      resultado: aud.resultado ?? '',
      notasTipo: aud.notasTipo ?? ''
    };
    this.modalResultadoVisible = true;
  }

  cerrarModalResultado(): void {
    if (this.guardando) return;
    this.modalResultadoVisible = false;
    this.audienciaSeleccionada = undefined;
    this.formResultado = { resultado: '', notasTipo: '' };
  }

  guardarResultado(): void {
    if (!this.audienciaSeleccionada?.id) return;
    if (!this.formResultado.resultado.trim()) {
      Swal.fire({ icon: 'warning', title: 'Atención', text: 'El veredicto formal es obligatorio.' });
      return;
    }

    this.guardando = true;
    this.audienciaService.registrarResultado(
      this.audienciaSeleccionada.id,
      this.formResultado.resultado,
      this.formResultado.notasTipo
    ).subscribe({
      next: (updated) => {
        this.guardando = false;
        // Actualizar la audiencia en la lista local
        const idx = this.audiencias.findIndex(a => a.id === updated.id);
        if (idx !== -1) this.audiencias[idx] = { ...this.audiencias[idx], ...updated };
        this.cerrarModalResultado();
        Swal.fire({
          icon: 'success',
          title: '¡Resultado registrado!',
          text: 'La audiencia ha sido marcada como REALIZADA y el administrador ha sido notificado.',
          timer: 3000,
          showConfirmButton: false
        });
      },
      error: err => {
        this.guardando = false;
        Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || 'No se pudo guardar el resultado.' });
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────

  badgeEstado(estado?: string): string {
    switch (estado) {
      case 'PROGRAMADA':   return 'badge--programada';
      case 'REALIZADA':    return 'badge--realizada';
      case 'CANCELADA':    return 'badge--cancelada';
      case 'REPROGRAMADA': return 'badge--reprogramada';
      default: return '';
    }
  }

  labelEstado(estado?: string): string {
    switch (estado) {
      case 'PROGRAMADA':   return 'Programada';
      case 'REALIZADA':    return 'Realizada';
      case 'CANCELADA':    return 'Cancelada';
      case 'REPROGRAMADA': return 'Reprogramada';
      default: return '—';
    }
  }

  esProgramada(aud: Audiencia): boolean {
    return aud.estado === 'PROGRAMADA';
  }

  // ── Counters para la summary bar ──────────────────────────────
  get totalAudiencias()      { return this.audiencias.length; }
  get totalProgramadas()     { return this.audiencias.filter(a => a.estado === 'PROGRAMADA').length; }
  get totalRealizadas()      { return this.audiencias.filter(a => a.estado === 'REALIZADA').length; }
}
