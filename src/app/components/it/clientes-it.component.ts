import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

import { SidebarComponent } from '../sidebar/sidebar.component';
import { ClienteService, Cliente } from '../dashboard/clientes/cliente.service';

@Component({
  selector: 'app-clientes-it',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent, DatePipe],
  templateUrl: './clientes-it.component.html',
  styleUrls: ['../dashboard/clientes/clientes.component.css']
})
export class ClientesItComponent implements OnInit {

  userName = localStorage.getItem('username');
  userId   = Number(localStorage.getItem('userId'));
  today    = new Date();
  loading  = false;

  clientes:          Cliente[] = [];
  clientesFiltrados: Cliente[] = [];
  searchTerm = '';

  modalVisible = false;
  modoEdicion  = false;
  guardando    = false;
  errors: Record<string, string> = {};
  form: Cliente = this.formVacio();

  constructor(private clienteService: ClienteService) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    this.loading = true;
    // IT ve todos los clientes activos
    this.clienteService.getAll(true).subscribe({
      next: (data) => {
        this.clientes          = data;
        this.clientesFiltrados = data;
        this.aplicarFiltro();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la lista de clientes.', confirmButtonColor: '#b8924a' });
      }
    });
  }

  /** Verifica si el cliente fue registrado por el usuario actual */
  esMio(cliente: Cliente): boolean {
    return (cliente.createdBy as any)?.id === this.userId;
  }

  onSearch(): void { this.aplicarFiltro(); }
  clearSearch(): void { this.searchTerm = ''; this.aplicarFiltro(); }

  private aplicarFiltro(): void {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) { this.clientesFiltrados = [...this.clientes]; return; }
    this.clientesFiltrados = this.clientes.filter(c =>
      c.nombreCompleto.toLowerCase().includes(term) ||
      (c.telefono?.toLowerCase().includes(term)) ||
      (c.email?.toLowerCase().includes(term))
    );
  }

  abrirModal(cliente?: Cliente): void {
    this.errors = {};
    if (cliente) {
      this.modoEdicion = true;
      this.form = { ...cliente };
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

  guardar(): void {
    if (!this.validar()) return;
    this.guardando = true;

    const op = this.modoEdicion
      ? this.clienteService.editar(this.form.id!, this.form)
      : this.clienteService.crear(this.form);

    op.subscribe({
      next: () => {
        this.guardando    = false;
        this.modalVisible = false;
        Swal.fire({
          icon: 'success',
          title: this.modoEdicion ? 'Cliente actualizado' : 'Cliente creado',
          timer: 2000, timerProgressBar: true,
          confirmButtonColor: '#b8924a'
        });
        this.cargarClientes();
      },
      error: (err) => {
        this.guardando = false;
        Swal.fire({ icon: 'error', title: 'Error', text: err?.error?.message || 'Ocurrió un error.', confirmButtonColor: '#b8924a' });
      }
    });
  }

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

  private formVacio(): Cliente {
    return { nombreCompleto: '', telefono: '', email: '', notas: '', activo: true };
  }
}