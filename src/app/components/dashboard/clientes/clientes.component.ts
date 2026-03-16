import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

import { SidebarComponent } from '../../sidebar/sidebar.component';
import { ClienteService, Cliente } from './cliente.service';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, DatePipe],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css']
})
export class ClientesComponent implements OnInit {

  // ── Estado general ──────────────────────────────────────
  userName   = localStorage.getItem('username');
  today      = new Date();
  loading    = false;

  // ── Lista ───────────────────────────────────────────────
  clientes:         Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  searchTerm  = '';
  soloActivos = true;

  // ── Modal ───────────────────────────────────────────────
  modalVisible = false;
  modoEdicion  = false;
  guardando    = false;
  errors: Record<string, string> = {};

  form: Cliente = this.formVacio();

  constructor(private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  // ── Carga de datos ──────────────────────────────────────

  cargarClientes(): void {
    this.loading = true;
    this.clienteService.getAll(this.soloActivos).subscribe({
      next: (data) => {
        this.clientes          = data;
        this.clientesFiltrados = data;
        this.aplicarFiltro();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire({
          icon: 'error',
          title: 'Error de conexión',
          text: 'No se pudo cargar la lista de clientes. Verifica que el servidor esté activo.',
          confirmButtonColor: '#b8924a'
        });
      }
    });
  }

  // ── Búsqueda y filtros ──────────────────────────────────

  onSearch(): void {
    this.aplicarFiltro();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.aplicarFiltro();
  }

  toggleFiltro(): void {
    this.soloActivos = !this.soloActivos;
    this.cargarClientes();
  }

  private aplicarFiltro(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.clientesFiltrados = [...this.clientes];
      return;
    }
    this.clientesFiltrados = this.clientes.filter(c =>
      c.nombreCompleto.toLowerCase().includes(term) ||
      (c.telefono?.toLowerCase().includes(term)) ||
      (c.email?.toLowerCase().includes(term))
    );
  }

  // ── Modal ───────────────────────────────────────────────

  abrirModal(cliente?: Cliente): void {
    this.errors = {};
    if (cliente) {
      this.modoEdicion = true;
      this.form = { ...cliente }; // copia para no mutar la lista
    } else {
      this.modoEdicion = false;
      this.form = this.formVacio();
    }
    this.modalVisible = true;
  }

  cerrarModal(): void {
    if (this.guardando) return;
    this.modalVisible = false;
  }

  // ── Guardar (crear o editar) ────────────────────────────

  guardar(): void {
    if (!this.validar()) return;

    this.guardando = true;

    const operacion = this.modoEdicion
      ? this.clienteService.editar(this.form.id!, this.form)
      : this.clienteService.crear(this.form);

    operacion.subscribe({
      next: () => {
        this.guardando = false;
        this.modalVisible = false;
        Swal.fire({
          icon: 'success',
          title: this.modoEdicion ? 'Cliente actualizado' : 'Cliente creado',
          text: `${this.form.nombreCompleto} fue ${this.modoEdicion ? 'actualizado' : 'registrado'} correctamente.`,
          confirmButtonColor: '#b8924a',
          timer: 2500,
          timerProgressBar: true
        });
        this.cargarClientes();
      },
      error: (err) => {
        this.guardando = false;
        const msg = err?.error?.message || 'Ocurrió un error al guardar. Intenta de nuevo.';
        Swal.fire({ icon: 'error', title: 'Error', text: msg, confirmButtonColor: '#b8924a' });
      }
    });
  }

  // ── Desactivar (soft-delete) ────────────────────────────

  confirmarDesactivar(cliente: Cliente): void {
    Swal.fire({
      title: '¿Desactivar cliente?',
      html: `<b>${cliente.nombreCompleto}</b> quedará inactivo.<br>Podrás reactivarlo desde el filtro de inactivos.`,
      icon: 'warning',
      background: '#fff',
      color: '#1e1e1e',
      showCancelButton: true,
      confirmButtonColor: '#c0392b',
      cancelButtonColor:  '#9e9e9e',
      confirmButtonText:  'Sí, desactivar',
      cancelButtonText:   'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.clienteService.desactivar(cliente.id!).subscribe({
          next: () => {
            Swal.fire({
              icon: 'success',
              title: 'Cliente desactivado',
              timer: 2000,
              timerProgressBar: true,
              showConfirmButton: false
            });
            this.cargarClientes();
          },
          error: () => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'No se pudo desactivar el cliente.',
              confirmButtonColor: '#b8924a'
            });
          }
        });
      }
    });
  }

  // ── Validación ──────────────────────────────────────────

  private validar(): boolean {
  this.errors = {};

  // Nombre completo — mínimo 2 palabras (nombre y apellido)
  const nombre = this.form.nombreCompleto?.trim() ?? '';
  if (!nombre) {
    this.errors['nombreCompleto'] = 'El nombre completo es obligatorio.';
  } else if (nombre.length < 10) {
    this.errors['nombreCompleto'] = 'El nombre debe tener al menos 10 caracteres.';
  } else if (nombre.split(/\s+/).filter(p => p.length > 0).length < 2) {
    this.errors['nombreCompleto'] = 'Ingresa al menos nombre y un apellido.';
  } else if (!/^[A-ZÁÉÍÓÚÑÜ\s]+$/.test(nombre)) {
    this.errors['nombreCompleto'] = 'El nombre solo debe contener letras mayúsculas.';
  }

  // Teléfono — exactamente 10 dígitos si se ingresa
  if (this.form.telefono?.trim()) {
    const tel = this.form.telefono.replace(/\s|-/g, '');
    if (!/^\d{10}$/.test(tel)) {
      this.errors['telefono'] = 'El teléfono debe tener exactamente 10 dígitos.';
    }
  }

  // Email — formato válido si se ingresa
  if (this.form.email?.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.form.email)) {
      this.errors['email'] = 'El email no tiene un formato válido.';
    }
  }

  return Object.keys(this.errors).length === 0;
}

  // ── Helpers ─────────────────────────────────────────────

  private formVacio(): Cliente {
    return {
      nombreCompleto: '',
      telefono: '',
      email: '',
      notas: '',
      activo: true
    };
  }
}