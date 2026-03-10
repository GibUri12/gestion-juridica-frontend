import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common'; 
import Swal from 'sweetalert2'; // <--- Importar SweetAlert

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  imports: [FormsModule, CommonModule],
  standalone: true
})
export class LoginComponent {
  loginData = { username: '', password: '' };
  showPassword = false; // <--- Variable para ver contraseña

  constructor(private authService: AuthService, private router: Router) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onLogin() {
    this.authService.login(this.loginData).subscribe({
      next: (res) => {
        Swal.fire({
          icon: 'success',
          title: '¡Bienvenido!',
          text: `Sesión iniciada como ${res.username}`,
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          if (res.role === 'ROLE_IT_MANAGER') {
            this.router.navigate(['/registro-it']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        });
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error de acceso',
          text: 'Credenciales inválidas. Por favor, verifica tu usuario y contraseña.',
          confirmButtonColor: '#1a2a40'
        });
      }
    });
  }
}