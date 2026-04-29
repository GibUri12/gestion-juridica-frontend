import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ExpedienteService } from '../../../services/expediente.service';
import { Expediente } from './expediente.model';
import Swal from 'sweetalert2';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { AuthService } from '../../../services/auth.service';
import { AudienciaService, Audiencia } from '../../dashboard/audiencias/audiencia.service';


@Component({
  selector: 'app-expedientes-lista',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, SidebarComponent],
  templateUrl: './expedientes-lista.component.html',
  styleUrls: ['./expedientes-lista.component.css', './expedientes-audiencias-modal.css']
})

export class ExpedientesListaComponent implements OnInit {
  // Variables de Interfaz
  today: Date = new Date();
  userName: string | null = localStorage.getItem('username');
  searchTerm: string = '';
  loading: boolean = false;
  guardando: boolean = false;
  modalVisible: boolean = false;
  modoEdicion: boolean = false;
  modalDetallesVisible: boolean = false;
  modalHistorialVisible: boolean = false;
  historialMovimientos: any[] = [];
  loadingHistorial: boolean = false;
  movimientoSeleccionadoDetalle: any = null;
  public usuariosResultados: any[] = [];
  abogadosParaSeleccionar: any[] = [];

  // ── Modal Audiencias del expediente ───────────────────────────────
  modalAudienciasVisible = false;
  audienciasExpediente: Audiencia[] = [];
  loadingAudiencias = false;
  // Sub-modal de registro de resultado
  modalResultadoVisible = false;
  audienciaParaResultado?: Audiencia;
  formResultado = { resultado: '', notasTipo: '' };
  guardandoResultado = false;

  // Datos y Sugerencias
  expedientes: Expediente[] = [];
  expedientesFiltrados: Expediente[] = [];
  expedienteSeleccionado?: Expediente;
  juntasSugeridas: any[] = [];
  mostrarSugerenciasJunta: boolean = false;
  
  clientesSugeridas: any[] = [];
  tribunalesSugeridos: any[] = [];
  mostrarSugerenciasCliente: boolean = false;
  abogadosAsignados: any[] = [];
  usuariosDisponibles: any[] = [];

  // Formulario
  completarForm: FormGroup;
  minDate: string;

  constructor(
    private expService: ExpedienteService,
    public authService: AuthService,
    private fb: FormBuilder,
    private audienciaService: AudienciaService,
    private route: ActivatedRoute
  ) {
    // Definir fecha mínima (Hoy + 45 días)
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 45);
    this.minDate = hoy.toISOString().split('T')[0];

    this.completarForm = this.fb.group({
      nombreJunta: ['', Validators.required], // Opcional
      numeroExpediente: ['', Validators.required],
      sufijoExpediente: [''], // Opcional
      clienteId: [null, Validators.required],
      nombreCliente: ['', Validators.required],
      nombreEmpresa: ['', Validators.required], // Texto libre obligatorio
      litis: ['', Validators.required],
      estado: ['ACTIVO', Validators.required],
      amparo: [''], 
      anotacion: [''], 
      proximaAudiencia: [''],
      amparoTribunalTipo: [null],
      fechaRecordatorio: ['', Validators.required],
      tieneAmparo: [false],
      amparoNumero: [''],
      amparoFechaAudiencia: [null],
      amparoTribunalId: [null],
      nombreTribunal: ['']
    });
  }

  ngOnInit() {
    this.cargarExpedientes();
    this.cargarCatalogoAbogados();

    // Si el Admin llega desde una notificación con queryParam expedienteId
    this.route.queryParams.subscribe(params => {
      const expId = params['expedienteId'];
      const abrir = params['abrirAudiencias'];
      if (expId && abrir === '1') {
        // Esperamos a que carguen los expedientes y luego abrimos el modal
        const intv = setInterval(() => {
          const found = this.expedientes.find(e => e.id === +expId);
          if (found) {
            clearInterval(intv);
            this.verAudiencias(found);
          }
        }, 400);
        // Timeout de seguridad
        setTimeout(() => clearInterval(intv), 5000);
      }
    });
  }

  cargarCatalogoAbogados() {
  this.expService.getAbogadosDisponibles().subscribe({
    next: (data) => this.abogadosParaSeleccionar = data,
    error: (err) => console.error("Error cargando abogados:", err)
  });
}

  cargarExpedientes() {
    this.loading = true;
    this.expService.getAll().subscribe({
      next: (data) => {
        // Mapeamos los expedientes para asegurarnos de que cada uno tenga su espacio de abogados
        this.expedientes = data.map(e => ({ ...e, abogados: [] }));
        this.expedientesFiltrados = this.expedientes;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire('Error', 'No se pudieron cargar los expedientes', 'error');
      }
    });
  }
    onTribunalInput(event: any) {
    const term = event.target.value;
    this.completarForm.patchValue({ amparoTribunalId: null });
    if (term.length > 1) {
      // Reutilizaremos el servicio para buscar tribunales de tipo TCC
      this.expService.buscarTribunales(term).subscribe(data => {
        this.tribunalesSugeridos = data;
      });
    }
  }

  seleccionarTribunal(t: any) {
    this.completarForm.patchValue({
      nombreTribunal: t.nombreCompleto,
      amparoTribunalId: t.id,
      amparoTribunalTipo: t.tipo // Si ya existe, tomamos su tipo
    });
    this.tribunalesSugeridos = [];
  }

  // --- LÓGICA DE BÚSQUEDA EN TABLA ---
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

  // --- AUTOCOMPLETE SOLO PARA CLIENTE ---
  onClienteInput(event: any) {
    const term = event.target.value;
    if (term.length > 2) {
      this.expService.buscarClientes(term).subscribe(data => {
        this.clientesSugeridas = data;
        this.mostrarSugerenciasCliente = true;
      });
    } else {
      this.mostrarSugerenciasCliente = false;
    }
  }

  seleccionarCliente(cliente: any) {
    this.completarForm.patchValue({
      clienteId: cliente.id,
      nombreCliente: cliente.nombreCompleto
    });
    this.mostrarSugerenciasCliente = false;
  }

  // --- MODALES ---
  abrirModalNuevo() {
    this.modoEdicion = false;
    this.expedienteSeleccionado = undefined;
    this.completarForm.reset();
    this.modalVisible = true;
  }

  abrirModalEditar(exp: Expediente) {
    this.modoEdicion = true;
    this.expedienteSeleccionado = exp;
    this.abogadosAsignados = [];
    this.cargarAbogados(exp.id);
    this.completarForm.patchValue({
      nombreJunta: exp.junta?.nombre || '',
      numeroExpediente: exp.numeroExpediente,
      sufijoExpediente: exp.sufijoExpediente || '',
      clienteId: exp.cliente?.id,
      nombreCliente: exp.cliente?.nombreCompleto,
      nombreEmpresa: exp.empresa?.nombreCompleto || '', // Muestra el nombre de la empresa vinculada
      litis: exp.litis,
      estado: exp.estado,
      amparo: exp.amparo || '',
      anotacion: exp.anotacion || '',
      proximaAudiencia: exp.proximaAudiencia,
      fechaRecordatorio: exp.fechaRecordatorio,
      tieneAmparo: !!exp.amparoNumero, // Se activa si ya tiene un número grabado
      amparoNumero: exp.amparoNumero,
      amparoFechaAudiencia: exp.amparoFechaAudiencia,
      amparoTribunalId: exp.amparoTribunal?.id,
      nombreTribunal: exp.amparoTribunal?.nombreCompleto || ''
    });
    this.modalVisible = true;
  }

  cerrarModal() {
    this.modalVisible = false;
    this.expedienteSeleccionado = undefined;
    this.completarForm.reset();
    this.mostrarSugerenciasCliente = false;
  }

  // --- GUARDAR ---
  guardar() {
    if (this.completarForm.invalid) {
      Swal.fire('Atención', 'Por favor, rellena los campos obligatorios (*).', 'warning');
      return;
    }

    this.guardando = true;

    // 1. Obtenemos los valores crudos del formulario
    const rawValues = this.completarForm.value;

    // 2. Limpieza del Payload: 
    // Extraemos 'junta' (el objeto) para descartarlo y nos quedamos con el resto (...payload)
    // Esto asegura que solo enviemos 'nombreJunta' como un String simple.
    const { junta, ...payload } = rawValues;

    console.log('Enviando al servidor:', payload);

    const peticion = this.modoEdicion && this.expedienteSeleccionado
      ? this.expService.completar(this.expedienteSeleccionado.id, payload)
      : this.expService.crear(payload);

    peticion.subscribe({
      next: (respuesta) => {
        this.guardando = false;
        console.log('Respuesta exitosa:', respuesta); // Aquí deberías ver el ID de la junta ya asignado
        this.cerrarModal();
        Swal.fire({
          title: '¡Éxito!',
          text: this.modoEdicion ? 'Expediente actualizado' : 'Expediente creado correctamente',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.cargarExpedientes();
      },
      error: (err) => {
        this.guardando = false;
        console.error('Error detallado:', err);
        // Intentamos extraer el mensaje de error del backend
        const msg = err.error?.message || err.error || 'Error al procesar la solicitud';
        Swal.fire('Error', msg, 'error');
      }
    });
  }

    // 3. Métodos para el Autocomplete de Juntas
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
    this.completarForm.patchValue({
      nombreJunta: junta.nombre
    });
    this.mostrarSugerenciasJunta = false;
  }

    // 2. VER DETALLES
  verDetalles(exp: Expediente) {
    this.expedienteSeleccionado = exp;
    this.cargarAbogados(exp.id);
    this.modalDetallesVisible = true;
  }

  // 4. VER HISTORIAL
  verHistorial(exp: Expediente) {
    this.expedienteSeleccionado = exp;
    this.modalHistorialVisible = true;
    this.loadingHistorial = true;
    
    // Llamada al endpoint que nos mostraste del Back
    this.expService.getMovimientos(exp.id).subscribe({
      next: (res: any) => {
        // Como tu controller devuelve un Page, tomamos content
        this.historialMovimientos = res.content;
        this.loadingHistorial = false;
      },
      error: () => {
        this.loadingHistorial = false;
        Swal.fire('Error', 'No se pudo cargar el historial', 'error');
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

  cargarAbogados(idExpediente: number) {
    this.expService.getAbogadosAsignados(idExpediente).subscribe({
      next: (data) => {
        this.abogadosAsignados = data;
      },
      error: (err) => {
        console.error("Error al cargar abogados del expediente:", err);
        this.abogadosAsignados = [];
      }
    });
  }

  asignarNuevoAbogado(usuarioId: number) {
    if (!this.expedienteSeleccionado?.id) return;

    this.expService.asignarAbogado(this.expedienteSeleccionado.id, usuarioId).subscribe({
      next: () => {
        // Esto refresca la lista del modal actual
        this.cargarAbogados(this.expedienteSeleccionado!.id); 
        this.usuariosResultados = []; // Limpiar buscador
      },
      error: (err) => Swal.fire('Error', 'No se pudo asignar el abogado', 'error')
    });
  }

  puedeEditar(): boolean {
    const user = this.authService.getUsuarioActual(); 
    
    // Si no hay expediente cargado, nadie puede editar nada
    if (!this.expedienteSeleccionado) return false;

    // Roles administrativos (acceso total)
    if (user.rol === 'ROLE_ADMINISTRADOR' || user.rol === 'ROLE_IT_MANAGER') return true;

    if (user.rol === 'ROLE_ABOGADO') {
      // Verificamos si es el creador usando ? para evitar errores si createdBy es null
      const esCreador = this.expedienteSeleccionado.createdBy?.id === user.id;
      
      // Verificamos si está en la lista de asignados
      const esAsignado = this.abogadosAsignados.some(a => a.id === user.id);
      
      return esAsignado || esCreador;
    }

    return false;
  }

  // El método de buscar ahora filtra la lista que ya tenemos
  buscarUsuarios(term: string) {
    if (!term.trim()) {
      this.usuariosResultados = [];
      return;
    }

    const query = term.toLowerCase();
    this.usuariosResultados = this.abogadosParaSeleccionar.filter(abogado => 
      abogado.nombreCompleto.toLowerCase().includes(query) || 
      abogado.username.toLowerCase().includes(query)
    );
  }

  removerAbogado(expedienteId: number, usuarioId: number) {
    Swal.fire({
      title: '¿Remover abogado?',
      text: "El abogado ya no tendrá acceso para editar este expediente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33', // Color rojo para acciones de eliminar
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, remover',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        this.expService.removerAbogado(expedienteId, usuarioId).subscribe({
          next: () => {
            // Refrescar la lista local filtrando el que quitamos
            this.abogadosAsignados = this.abogadosAsignados.filter(a => a.id !== usuarioId);
            
            Swal.fire({
              title: 'Removido',
              text: 'El abogado ha sido desvinculado del caso.',
              icon: 'success',
              timer: 1500,
              showConfirmButton: false
            });
          },
          error: (err) => {
            console.error(err);
            Swal.fire('Error', 'No se pudo completar la acción', 'error');
          }
        });
      }
    });
  }

  guardarCambiosAbogado() {
    if (!this.expedienteSeleccionado) return;

    const datos = {
      anotacion: this.expedienteSeleccionado.anotacion
    };

    this.expService.completar(this.expedienteSeleccionado.id, datos).subscribe({
      next: () => {
        alert('Anotaciones guardadas correctamente');
        // Opcional: recargar datos
      },
      error: (err) => alert('Error al guardar: ' + err.message)
    });
  }

  // ── Audiencias del expediente ──────────────────────────────

  verAudiencias(exp: Expediente): void {
    this.expedienteSeleccionado = exp;
    this.modalAudienciasVisible = true;
    this.loadingAudiencias = true;
    this.audienciasExpediente = [];

    this.audienciaService.getAudienciasPorExpediente(exp.id).subscribe({
      next: data => {
        this.audienciasExpediente = data;
        this.loadingAudiencias = false;
      },
      error: () => {
        this.loadingAudiencias = false;
        Swal.fire('Error', 'No se pudieron cargar las audiencias del expediente.', 'error');
      }
    });
  }

  cerrarModalAudiencias(): void {
    this.modalAudienciasVisible = false;
    this.audienciasExpediente = [];
    this.modalResultadoVisible = false;
    this.audienciaParaResultado = undefined;
    this.formResultado = { resultado: '', notasTipo: '' };
  }

  abrirRegistroResultadoAudiencia(aud: Audiencia): void {
    this.audienciaParaResultado = aud;
    this.formResultado = {
      resultado: aud.resultado ?? '',
      notasTipo: aud.notasTipo ?? ''
    };
    this.modalResultadoVisible = true;
  }

  cerrarModalResultado(): void {
    if (this.guardandoResultado) return;
    this.modalResultadoVisible = false;
    this.audienciaParaResultado = undefined;
    this.formResultado = { resultado: '', notasTipo: '' };
  }

  guardarResultadoDesdeModal(): void {
    if (!this.audienciaParaResultado?.id) return;
    if (!this.formResultado.resultado.trim()) {
      Swal.fire({ icon: 'warning', title: 'Atención', text: 'El veredicto formal es obligatorio.' });
      return;
    }

    this.guardandoResultado = true;
    this.audienciaService.registrarResultado(
      this.audienciaParaResultado.id,
      this.formResultado.resultado,
      this.formResultado.notasTipo
    ).subscribe({
      next: (updated) => {
        this.guardandoResultado = false;
        // Actualizar en la lista local del modal
        const idx = this.audienciasExpediente.findIndex(a => a.id === updated.id);
        if (idx !== -1) this.audienciasExpediente[idx] = { ...this.audienciasExpediente[idx], ...updated };
        this.cerrarModalResultado();
        Swal.fire({
          icon: 'success',
          title: '¡Resultado registrado!',
          text: 'La audiencia fue marcada como REALIZADA y el administrador fue notificado.',
          timer: 3000,
          showConfirmButton: false
        });
      },
      error: err => {
        this.guardandoResultado = false;
        Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || 'No se pudo guardar el resultado.' });
      }
    });
  }

  badgeEstadoAudiencia(estado?: string): string {
    switch (estado) {
      case 'PROGRAMADA':   return 'badge--programada';
      case 'REALIZADA':    return 'badge--realizada';
      case 'CANCELADA':    return 'badge--cancelada';
      case 'REPROGRAMADA': return 'badge--reprogramada';
      default: return '';
    }
  }

  labelEstadoAudiencia(estado?: string): string {
    switch (estado) {
      case 'PROGRAMADA':   return 'Programada';
      case 'REALIZADA':    return 'Realizada';
      case 'CANCELADA':    return 'Cancelada';
      case 'REPROGRAMADA': return 'Reprogramada';
      default: return '—';
    }
  }

  puedeRegistrarResultado(aud: Audiencia): boolean {
    // El abogado puede registrar si está PROGRAMADA
    return aud.estado === 'PROGRAMADA';
  }
}
