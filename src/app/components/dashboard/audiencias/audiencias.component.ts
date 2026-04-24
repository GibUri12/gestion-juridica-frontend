import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { SidebarComponent } from '../../sidebar/sidebar.component';
import {
  AudienciaService, Audiencia, CatTipoAudiencia, UsuarioAbogado, Tribunal
} from './audiencia.service';


interface FormAudiencia {
  fecha:             string;
  hora:              string;
  tribunalId:        number | null;
  abogadoTitularId:  number | null;
  abogadoIds:        number[];
}

@Component({
  selector: 'app-audiencias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, DatePipe],
  templateUrl: './audiencias.component.html',
  styleUrls:  ['./audiencias.component.css']
})
export class AudienciasComponent implements OnInit, OnDestroy {

  // ── Estado general ────────────────────────────────────────────────
  userName = localStorage.getItem('username');
  today    = new Date();
  loading  = false;

  // ── Lista y filtros ───────────────────────────────────────────────
  audiencias:      Audiencia[] = [];
  filtroEstado     = '';
  filtroAbogadoId: number | null = null;
  filtroFechaDesde = '';
  filtroFechaHasta = '';

  // ── Catálogos ─────────────────────────────────────────────────────
  abogados:   UsuarioAbogado[] = [];
  tribunales: Tribunal[]        = [];

  // ── Modal principal ───────────────────────────────────────────────
  modalVisible = false;
  modoEdicion  = false;
  guardando    = false;
  audienciaId?: number;
  errors: Record<string, string> = {};

  form: FormAudiencia = this.formVacio();

  // ── Autocomplete expediente ───────────────────────────────────────
  expedienteQuery        = '';
  expedienteSugerencias: any[] = [];
  expedienteSeleccionado?: any;
  private expSubject = new Subject<string>();

  // ── Autocomplete tipo audiencia ───────────────────────────────────
  tipoQuery        = '';
  tipoSugerencias: CatTipoAudiencia[] = [];
  tipoSeleccionado?: CatTipoAudiencia;
  private tipoSubject = new Subject<string>();
  // ── Autocomplete tribunal ──────────────────────────────────────────
  tribunalQuery        = '';
  tribunalSugerencias: Tribunal[] = [];
  tribunalSeleccionado?: Tribunal;
  private tribunalSubject = new Subject<string>();

  // ── Modal estado ──────────────────────────────────────────────────
  modalEstadoVisible = false;
  audienciaEstado?: Audiencia;
  estados = [
    { value: 'PROGRAMADA',   label: 'Programada',   clase: 'dot-blue'   },
    { value: 'REALIZADA',    label: 'Realizada',    clase: 'dot-green'  },
    { value: 'CANCELADA',    label: 'Cancelada',    clase: 'dot-red'    },
    { value: 'REPROGRAMADA', label: 'Reprogramada', clase: 'dot-gold'   },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private audienciaService: AudienciaService
  ) {}

  ngOnInit(): void {
    this.cargarAudiencias();
    this.cargarCatalogos();

    this.expSubject.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(q => this.buscarExpedientes(q));

    this.tipoSubject.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(q => this.buscarTipos(q));

    this.tribunalSubject.pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(q => this.buscarTribunales(q));
  }

  ngOnDestroy(): void {
    this.expSubject.complete();
    this.tipoSubject.complete();
    this.tribunalSubject.complete();
    this.destroy$.complete();
  }

  // ── Carga ─────────────────────────────────────────────────────────

  cargarAudiencias(): void {
    this.loading = true;
    this.audienciaService.getAll(
      this.filtroEstado    || undefined,
      this.filtroAbogadoId || undefined,
      this.filtroFechaDesde || undefined,
      this.filtroFechaHasta || undefined
    ).subscribe({
      next:  data => { this.audiencias = data; this.loading = false; },
      error: ()   => {
        this.loading = false;
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudieron cargar las audiencias.', confirmButtonColor: '#b8924a' });
      }
    });
  }

  cargarCatalogos(): void {
    this.audienciaService.getAbogados().subscribe(
      data => this.abogados = data,
      error => console.error('Error cargando abogados:', error)
    );

    this.audienciaService.getTribunales().subscribe(
      data => this.tribunales = data,
      error => console.error('Error cargando tribunales:', error)
    );
  }

  // ── Filtros ───────────────────────────────────────────────────────

  aplicarFiltros(): void { this.cargarAudiencias(); }

  hayFiltros(): boolean {
    return !!(this.filtroEstado || this.filtroAbogadoId || this.filtroFechaDesde || this.filtroFechaHasta);
  }

  limpiarFiltros(): void {
    this.filtroEstado     = '';
    this.filtroAbogadoId  = null;
    this.filtroFechaDesde = '';
    this.filtroFechaHasta = '';
    this.cargarAudiencias();
  }

  // ── Autocomplete expediente ───────────────────────────────────────

  onExpedienteInput(): void {
    this.expedienteSeleccionado = undefined;
    this.expSubject.next(this.expedienteQuery);
  }

  onExpedienteBlur(): void {
    setTimeout(() => this.expedienteSugerencias = [], 200);
  }

  buscarExpedientes(q: string): void {
    if (q.length < 2) { this.expedienteSugerencias = []; return; }
    this.audienciaService.buscarExpedientes(q).subscribe(data => {
      this.expedienteSugerencias = data.slice(0, 8);
    });
  }

  seleccionarExpediente(exp: any): void {
    this.expedienteSeleccionado = exp;
    this.expedienteQuery        = exp.numeroExpediente;
    this.expedienteSugerencias  = [];
  }

  // ── Autocomplete tipo audiencia ───────────────────────────────────

  onTipoInput(): void {
    this.tipoSeleccionado = undefined;
    this.tipoSubject.next(this.tipoQuery);
  }

  onTipoBlur(): void {
    setTimeout(() => this.tipoSugerencias = [], 200);
  }

  buscarTipos(q: string): void {
    this.audienciaService.getTiposAudiencia(q).subscribe(data => {
      this.tipoSugerencias = data;
    });
  }

  seleccionarTipo(t: CatTipoAudiencia): void {
    this.tipoSeleccionado = t;
    this.tipoQuery        = `${t.abreviatura} — ${t.descripcion}`;
    this.tipoSugerencias  = [];
  }

  // Métodos del autocomplete:
  onTribunalInput(): void {
    this.tribunalSeleccionado = undefined;
    this.tribunalSubject.next(this.tribunalQuery);
  }

  onTribunalBlur(): void {
    setTimeout(() => this.tribunalSugerencias = [], 200);
  }

  buscarTribunales(q: string): void {
    if (q.length < 1) {
      this.tribunalSugerencias = [];
      return;
    }
    
    this.audienciaService.buscarTribunales(q).subscribe(
      data => {
        // Ordenar: primero coincidencias en clave, luego en nombre
        this.tribunalSugerencias = data
          .sort((a, b) => {
            const qLower = q.toLowerCase();
            const aClaveMatch = a.clave.toLowerCase().includes(qLower);
            const bClaveMatch = b.clave.toLowerCase().includes(qLower);
            
            if (aClaveMatch && !bClaveMatch) return -1;
            if (!aClaveMatch && bClaveMatch) return 1;
            return 0;
          })
          .slice(0, 10); // máximo 10 resultados
      },
      error => console.error('Error buscando tribunales:', error)
    );
  }

  seleccionarTribunal(t: Tribunal): void {
    this.tribunalSeleccionado = t;
    this.tribunalQuery        = `${t.clave} — ${t.nombreCompleto}`;
    this.tribunalSugerencias  = [];
    this.form.tribunalId      = t.id;
  }

  // ── Abogados ──────────────────────────────────────────────────────

  onTitularChange(): void {
    if (this.form.abogadoTitularId && !this.form.abogadoIds.includes(this.form.abogadoTitularId)) {
      this.form.abogadoIds = [...this.form.abogadoIds, this.form.abogadoTitularId];
    }
  }

  toggleAbogado(id: number, event: any): void {
    if (event.target.checked) {
      this.form.abogadoIds = [...this.form.abogadoIds, id];
    } else {
      this.form.abogadoIds = this.form.abogadoIds.filter(a => a !== id);
    }
  }

  // ── Modal ─────────────────────────────────────────────────────────

  abrirModalCrear(): void {
    this.modoEdicion           = false;
    this.form                  = this.formVacio();
    this.errors                = {};
    this.expedienteQuery       = '';
    this.expedienteSeleccionado= undefined;
    this.tipoQuery             = '';
    this.tipoSeleccionado      = undefined;
    this.tribunalQuery         = '';        // ← agregar
    this.tribunalSeleccionado  = undefined;
    this.modalVisible          = true;
    // Cargar tipos iniciales
    this.buscarTipos('');
  }

  abrirModalEditar(a: Audiencia): void {
    this.modoEdicion  = true;
    this.audienciaId  = a.id;
    this.errors       = {};
    this.form = {
      fecha:            a.fecha ?? '',
      hora:             a.hora  ?? '',
      tribunalId:       a.tribunalId ?? null,
      abogadoTitularId: a.abogados?.find(ab => ab.esTitular)?.usuarioId ?? null,
      abogadoIds:       a.abogados?.map(ab => ab.usuarioId) ?? [],
    };
    this.expedienteSeleccionado = a.expedienteId ? {
      id: a.expedienteId,
      numeroExpediente: a.expedienteNumero,
      cliente: { nombreCompleto: a.clienteNombre }
    } : undefined;
    this.expedienteQuery        = a.expedienteNumero ?? '';
    this.tipoSeleccionado       = a.tipoAudienciaId ? {
      id: a.tipoAudienciaId,
      abreviatura: a.tipoAudienciaAbreviatura,
      descripcion: a.tipoAudienciaDescripcion
    } as any : undefined;
    this.tribunalSeleccionado   = { 
      id: a.tribunalId ?? 0, 
      clave: a.tribunalClave ?? '', 
      nombreCompleto: a.tribunalNombre ?? '',
      activo: true
    };
    this.tribunalQuery          = a.tribunalClave && a.tribunalNombre
      ? `${a.tribunalClave} — ${a.tribunalNombre}`
      : '';
    this.tipoQuery              = a.tipoAudienciaId ? `${a.tipoAudienciaAbreviatura} — ${a.tipoAudienciaDescripcion}` : '';
    this.modalVisible           = true;
    this.buscarTipos('');
  }

  cerrarModal(): void {
    if (this.guardando) return;
    this.modalVisible = false;
  }

  // ── Guardar ───────────────────────────────────────────────────────

  guardar(): void {
    if (!this.validar()) return;
    this.guardando = true;

    const payload = {
      expedienteId:     this.expedienteSeleccionado!.id,
      tipoAudienciaId:  this.tipoSeleccionado!.id,
      tribunalId:       this.form.tribunalId,
      fecha:            this.form.fecha,
      hora:             this.form.hora || null,
      abogadoIds:       this.form.abogadoIds,
      abogadoTitularId: this.form.abogadoTitularId,
    };

    const op = this.modoEdicion
      ? this.audienciaService.editar(this.audienciaId!, payload)
      : this.audienciaService.crear(payload);

    op.subscribe({
      next: () => {
        this.guardando    = false;
        this.modalVisible = false;
        Swal.fire({ icon: 'success', title: this.modoEdicion ? 'Audiencia actualizada' : 'Audiencia creada', timer: 2000, showConfirmButton: false });
        this.cargarAudiencias();
      },
      error: err => {
        this.guardando = false;
        Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || 'Ocurrió un error.', confirmButtonColor: '#b8924a' });
      }
    });
  }

  // ── Estado ────────────────────────────────────────────────────────

  abrirModalEstado(a: Audiencia): void {
    this.audienciaEstado   = a;
    this.modalEstadoVisible = true;
  }

  guardarEstado(estado: string): void {
    this.audienciaService.cambiarEstado(this.audienciaEstado!.id!, estado).subscribe({
      next: () => { this.modalEstadoVisible = false; this.cargarAudiencias(); },
      error: () => Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cambiar el estado.', confirmButtonColor: '#b8924a' })
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────

  badgeEstado(estado?: string): string {
    switch (estado) {
      case 'PROGRAMADA':   return 'badge--programada';
      case 'REALIZADA':    return 'badge--realizada';
      case 'CANCELADA':    return 'badge--cancelada';
      case 'REPROGRAMADA': return 'badge--reprogramada';
      default:             return '';
    }
  }

  labelEstado(estado?: string): string {
    switch (estado) {
      case 'PROGRAMADA':   return 'Programada';
      case 'REALIZADA':    return 'Realizada';
      case 'CANCELADA':    return 'Cancelada';
      case 'REPROGRAMADA': return 'Reprogramada';
      default:             return '—';
    }
  }

  private validar(): boolean {
    this.errors = {};
    if (!this.expedienteSeleccionado) this.errors['expediente']   = 'Selecciona un expediente.';
    if (!this.tipoSeleccionado)       this.errors['tipoAudiencia']= 'Selecciona el tipo de audiencia.';
    if (!this.form.tribunalId)        this.errors['tribunal']     = 'Selecciona el tribunal.';
    if (!this.form.fecha)             this.errors['fecha']        = 'La fecha es obligatoria.';
    if (!this.form.abogadoTitularId)  this.errors['abogado']      = 'Selecciona el abogado titular.';
    return Object.keys(this.errors).length === 0;
  }

  private formVacio(): FormAudiencia {
    return { fecha: '', hora: '', tribunalId: null, abogadoTitularId: null, abogadoIds: [] };
  }
}