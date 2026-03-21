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
  
  clientesSugeridas: any[] = [];
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
      numeroExpediente: ['', Validators.required],
      sufijoExpediente: [''], // Opcional
      clienteId: [null, Validators.required],
      nombreCliente: ['', Validators.required],
      nombreEmpresa: ['', Validators.required], // Texto libre obligatorio
      litis: ['', Validators.required],
      amparo: [''], // Opcional
      anotacion: [''], // Opcional
      proximaAudiencia: [''], // Opcional
      fechaRecordatorio: ['', Validators.required]
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
      numeroExpediente: exp.numeroExpediente,
      sufijoExpediente: exp.sufijoExpediente || '',
      clienteId: exp.cliente?.id,
      nombreCliente: exp.cliente?.nombreCompleto,
      nombreEmpresa: exp.empresa?.nombreCompleto || '', // Muestra el nombre de la empresa vinculada
      litis: exp.litis,
      amparo: exp.amparo || '',
      anotacion: exp.anotacion || '',
      proximaAudiencia: exp.proximaAudiencia,
      fechaRecordatorio: exp.fechaRecordatorio
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

    const peticion = this.modoEdicion && this.expedienteSeleccionado
      ? this.expService.completar(this.expedienteSeleccionado.id, this.completarForm.value)
      : this.expService.crear(this.completarForm.value);

    peticion.subscribe({
      next: () => {
        this.guardando = false;
        this.cerrarModal();
        Swal.fire('Éxito', this.modoEdicion ? 'Actualizado correctamente' : 'Expediente creado con éxito', 'success');
        this.cargarExpedientes();
      },
      error: (err) => {
        this.guardando = false;
        Swal.fire('Error', err.error || 'Ocurrió un error al procesar la solicitud', 'error');
      }
    });
  }
}