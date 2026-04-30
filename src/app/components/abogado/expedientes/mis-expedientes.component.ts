import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { ExpedienteService } from '../../../services/expediente.service';
import { MovimientoService } from '../../../services/movimiento.service';
import { Expediente } from '../../dashboard/expedientes/expediente.model';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-mis-expedientes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, SidebarComponent],
  templateUrl: './mis-expedientes.component.html',
  styleUrls: ['./mis-expedientes.component.css']
})
export class MisExpedientesComponent implements OnInit {

  // ── Interfaz ───────────────────────────────────────
  today: Date = new Date();
  userName: string | null = localStorage.getItem('username');
  searchTerm = '';
  loading = false;
  guardando = false;

  // ── Modales ────────────────────────────────────────
  modalEditarVisible = false;
  modalDetallesVisible = false;
  modalHistorialVisible = false;

  // ── Historial ──────────────────────────────────────
  historialMovimientos: any[] = [];
  loadingHistorial = false;
  movimientoSeleccionadoDetalle: any = null;

  // ── Datos ──────────────────────────────────────────
  expedientes: Expediente[] = [];
  expedientesFiltrados: Expediente[] = [];
  expedienteSeleccionado?: Expediente;

  // ── Autocompletes ──────────────────────────────────
  juntasSugeridas: any[] = [];
  mostrarSugerenciasJunta = false;
  tribunalesSugeridos: any[] = [];

  // ── Formulario edición ─────────────────────────────
  editarForm: FormGroup;
  minDate: string;

  constructor(
    private expService: ExpedienteService,
    private movService: MovimientoService,
    private fb: FormBuilder
  ) {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 45);
    this.minDate = hoy.toISOString().split('T')[0];

    // Solo los campos que el abogado puede editar
    this.editarForm = this.fb.group({
      // Campos de junta y expediente (editables)
      nombreJunta:          [''],
      sufijoExpediente:     [''],
      estado:               ['ACTIVO'],
      litis:                [''],
      amparo:               [''],
      anotacion:            [''],
      proximaAudiencia:     [''],
      fechaRecordatorio:    [''],
      // Amparo
      tieneAmparo:          [false],
      amparoNumero:         [''],
      amparoFechaAudiencia: [null],
      amparoTribunalId:     [null],
      nombreTribunal:       [''],
      amparoTribunalTipo:   [null],
    });
  }

  ngOnInit() {
    this.cargarExpedientes();
  }

  // ── Carga ──────────────────────────────────────────
  cargarExpedientes() {
    this.loading = true;
    this.expService.getAll().subscribe({
      next: (data) => {
        this.expedientes = data;
        this.expedientesFiltrados = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire({
          title: 'Error',
          text: 'No se pudieron cargar los expedientes.',
          icon: 'error'
        });
      }
    });
  }

  // ── Búsqueda ───────────────────────────────────────
  onSearch() {
    const term = this.searchTerm.toLowerCase().trim();
    this.expedientesFiltrados = this.expedientes.filter(e =>
      e.numeroExpediente.toLowerCase().includes(term) ||
      e.cliente?.nombreCompleto?.toLowerCase().includes(term)
    );
  }

  clearSearch() {
    this.searchTerm = '';
    this.onSearch();
  }

  // ── Modal Ver Detalles ─────────────────────────────
  verDetalles(exp: Expediente) {
    this.expedienteSeleccionado = exp;
    this.modalDetallesVisible = true;
  }

  // ── Modal Editar ───────────────────────────────────
  abrirModalEditar(exp: Expediente) {
    this.expedienteSeleccionado = exp;
    this.editarForm.patchValue({
      nombreJunta:          exp.junta?.nombre || '',
      sufijoExpediente:     exp.sufijoExpediente || '',
      estado:               exp.estado,
      litis:                exp.litis || '',
      amparo:               exp.amparo || '',
      anotacion:            exp.anotacion || '',
      proximaAudiencia:     exp.proximaAudiencia || '',
      fechaRecordatorio:    exp.fechaRecordatorio || '',
      tieneAmparo:          !!exp.amparoNumero,
      amparoNumero:         exp.amparoNumero || '',
      amparoFechaAudiencia: exp.amparoFechaAudiencia || null,
      amparoTribunalId:     exp.amparoTribunal?.id || null,
      nombreTribunal:       exp.amparoTribunal?.nombreCompleto || '',
      amparoTribunalTipo:   null,
    });
    this.modalEditarVisible = true;
  }

  cerrarModal() {
    this.modalEditarVisible = false;
    this.expedienteSeleccionado = undefined;
    this.editarForm.reset();
    this.mostrarSugerenciasJunta = false;
    this.tribunalesSugeridos = [];
  }

  // ── Guardar ────────────────────────────────────────
  guardar() {
    if (!this.expedienteSeleccionado) return;
    this.guardando = true;

    const raw = this.editarForm.value;
    const { ...payload } = raw;

    this.expService.completar(this.expedienteSeleccionado.id, payload).subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModal();
        Swal.fire({
          title: '¡Actualizado!',
          text: 'El expediente fue actualizado correctamente.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.cargarExpedientes();
      },
      error: (err) => {
        this.guardando = false;
        const msg = err.error?.message || 'Error al guardar los cambios.';
        Swal.fire({
          title: 'Error',
          text: msg,
          icon: 'error'
        });
      }
    });
  }

  // ── Autocomplete Junta ─────────────────────────────
  onJuntaInput(event: any) {
    const term = event.target.value;
    if (term.length > 1) {
      this.expService.buscarJuntas(term).subscribe(data => {
        this.juntasSugeridas = data;
        this.mostrarSugerenciasJunta = true;
      });
    } else {
      this.mostrarSugerenciasJunta = false;
    }
  }

  seleccionarJunta(junta: any) {
    this.editarForm.patchValue({ nombreJunta: junta.nombre });
    this.mostrarSugerenciasJunta = false;
  }

  // ── Autocomplete Tribunal ──────────────────────────
  onTribunalInput(event: any) {
    const term = event.target.value;
    this.editarForm.patchValue({ amparoTribunalId: null });
    if (term.length > 1) {
      this.expService.buscarTribunales(term).subscribe(data => {
        this.tribunalesSugeridos = data;
      });
    }
  }

  seleccionarTribunal(t: any) {
    this.editarForm.patchValue({
      nombreTribunal:     t.nombreCompleto,
      amparoTribunalId:   t.id,
      amparoTribunalTipo: t.tipo
    });
    this.tribunalesSugeridos = [];
  }

  // ── Historial ──────────────────────────────────────
  verHistorial(exp: Expediente) {
    this.expedienteSeleccionado = exp;
    this.modalHistorialVisible = true;
    this.loadingHistorial = true;

    this.expService.getMovimientos(exp.id).subscribe({
      next: (res: any) => {
        this.historialMovimientos = res.content;
        this.loadingHistorial = false;
      },
      error: () => {
        this.loadingHistorial = false;
        Swal.fire({
          title: 'Error',
          text: 'No se pudo cargar el historial.',
          icon: 'error'
        });
      }
    });
  }

  cerrarModalesAdicionales() {
    this.modalDetallesVisible = false;
    this.modalHistorialVisible = false;
    this.historialMovimientos = [];
  }

  verDetalleMovimiento(mov: any) {
    this.movimientoSeleccionadoDetalle = mov;
  }
}