import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ExpedienteService } from '../../../services/expediente.service';
import { Expediente } from './expediente.model';
import Swal from 'sweetalert2';
import { SidebarComponent } from '../../sidebar/sidebar.component';

@Component({
  selector: 'app-expedientes-lista',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, SidebarComponent],
  templateUrl: './expedientes-lista.component.html',
  styleUrls: ['./expedientes-lista.component.css']
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

  // Datos y Sugerencias
  expedientes: Expediente[] = [];
  expedientesFiltrados: Expediente[] = [];
  expedienteSeleccionado?: Expediente;
  juntasSugeridas: any[] = [];
  mostrarSugerenciasJunta: boolean = false;
  
  clientesSugeridas: any[] = [];
  tribunalesSugeridos: any[] = [];
  mostrarSugerenciasCliente: boolean = false;

  // Formulario
  completarForm: FormGroup;
  minDate: string;

  constructor(
    private expService: ExpedienteService,
    private fb: FormBuilder
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
    
  }

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
    this.completarForm.patchValue({
      nombreJunta: exp.junta?.nombre || '',
      numeroExpediente: exp.numeroExpediente,
      sufijoExpediente: exp.sufijoExpediente || '',
      clienteId: exp.cliente?.id,
      nombreCliente: exp.cliente?.nombreCompleto,
      nombreEmpresa: exp.empresa?.nombreCompleto || '', // Muestra el nombre de la empresa vinculada
      litis: exp.litis,
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
}