// usuarios.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../../sidebar/sidebar.component';
import { UsuarioService } from '../../../services/usuario.service';
import { Usuario, UsuarioRequest, RolUsuario } from './usuario.model';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, SidebarComponent],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {

  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  loading = false;
  filtroRol: string = '';
  filtroEstado: string = '';
  filtroTexto: string = '';

  // ── Modales ──────────────────────────────────────
  modalFormVisible = false;
  modalPasswordVisible = false;
  modoEdicion = false;
  usuarioSeleccionado: Usuario | null = null;

  // ── Formulario ───────────────────────────────────
  form: UsuarioRequest = this.formVacio();
  nuevaPassword = '';
  confirmPassword = '';
  errorPassword = '';
  errorForm = '';
  successMsg = '';

  roles: RolUsuario[] = ['ADMINISTRADOR', 'ABOGADO', 'IT_MANAGER'];

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit() {
    this.cargarUsuarios();
  }

  // ── Carga ─────────────────────────────────────────
  cargarUsuarios() {
    this.loading = true;
    this.usuarioService.getAll().subscribe({
      next: (data) => {
        this.usuarios = data;
        this.aplicarFiltros();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  // ── Filtros ───────────────────────────────────────
  aplicarFiltros() {
    this.usuariosFiltrados = this.usuarios.filter(u => {
      const textoOk = !this.filtroTexto ||
        u.nombreCompleto.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        u.username.toLowerCase().includes(this.filtroTexto.toLowerCase()) ||
        u.email.toLowerCase().includes(this.filtroTexto.toLowerCase());

      const rolOk = !this.filtroRol || u.rol === this.filtroRol;

      const estadoOk = !this.filtroEstado ||
        (this.filtroEstado === 'activo' && u.activo) ||
        (this.filtroEstado === 'inactivo' && !u.activo);

      return textoOk && rolOk && estadoOk;
    });
  }

  limpiarFiltros() {
    this.filtroTexto = '';
    this.filtroRol = '';
    this.filtroEstado = '';
    this.aplicarFiltros();
  }

  // ── Modal Crear ───────────────────────────────────
  abrirModalCrear() {
    this.modoEdicion = false;
    this.usuarioSeleccionado = null;
    this.form = this.formVacio();
    this.errorForm = '';
    this.modalFormVisible = true;
  }

  // ── Modal Editar ──────────────────────────────────
  abrirModalEditar(u: Usuario) {
    this.modoEdicion = true;
    this.usuarioSeleccionado = u;
    this.form = {
      nombreCompleto: u.nombreCompleto,
      claveAbogado: u.claveAbogado ?? '',
      username: u.username,
      email: u.email,
      rol: u.rol,
      activo: u.activo,
      password: ''
    };
    this.errorForm = '';
    this.modalFormVisible = true;
  }

  cerrarModalForm() {
    this.modalFormVisible = false;
    this.errorForm = '';
  }

  // ── Guardar (crear o editar) ──────────────────────
  guardar() {
    this.errorForm = '';

    if (!this.form.nombreCompleto || !this.form.username || !this.form.email || !this.form.rol) {
      this.errorForm = 'Por favor completa todos los campos obligatorios.';
      return;
    }

    if (!this.modoEdicion && !this.form.password) {
      this.errorForm = 'La contraseña es obligatoria para nuevos usuarios.';
      return;
    }

    const obs = this.modoEdicion
      ? this.usuarioService.editar(this.usuarioSeleccionado!.id, this.form)
      : this.usuarioService.crear(this.form);

    obs.subscribe({
      next: () => {
        this.cerrarModalForm();
        this.cargarUsuarios();
        this.mostrarExito(this.modoEdicion ? 'Usuario actualizado.' : 'Usuario creado.');
      },
      error: () => { this.errorForm = 'Error al guardar. Verifica los datos.'; }
    });
  }

  // ── Toggle Activo ─────────────────────────────────
  toggleActivo(u: Usuario) {
    this.usuarioService.toggleActivo(u.id).subscribe({
      next: (actualizado) => {
        u.activo = actualizado.activo;
        this.aplicarFiltros();
      }
    });
  }

  // ── Modal Cambiar Password ────────────────────────
  abrirModalPassword(u: Usuario) {
    this.usuarioSeleccionado = u;
    this.nuevaPassword = '';
    this.confirmPassword = '';
    this.errorPassword = '';
    this.modalPasswordVisible = true;
  }

  cerrarModalPassword() {
    this.modalPasswordVisible = false;
    this.errorPassword = '';
  }

  cambiarPassword() {
    this.errorPassword = '';

    if (!this.nuevaPassword || this.nuevaPassword.length < 6) {
      this.errorPassword = 'La contraseña debe tener al menos 6 caracteres.';
      return;
    }

    if (this.nuevaPassword !== this.confirmPassword) {
      this.errorPassword = 'Las contraseñas no coinciden.';
      return;
    }

    this.usuarioService.cambiarPassword(this.usuarioSeleccionado!.id, this.nuevaPassword).subscribe({
      next: () => {
        this.cerrarModalPassword();
        this.mostrarExito('Contraseña actualizada.');
      },
      error: () => { this.errorPassword = 'Error al cambiar la contraseña.'; }
    });
  }

  // ── Helpers ───────────────────────────────────────
  formVacio(): UsuarioRequest {
    return { nombreCompleto: '', claveAbogado: '', username: '', password: '', email: '', rol: 'ABOGADO', activo: true };
  }

  mostrarExito(msg: string) {
    this.successMsg = msg;
    setTimeout(() => this.successMsg = '', 3500);
  }

  rolLabel(rol: RolUsuario): string {
    const map: Record<RolUsuario, string> = {
      ADMINISTRADOR: 'Administrador',
      ABOGADO: 'Abogado',
      IT_MANAGER: 'IT Manager'
    };
    return map[rol];
  }
}