import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  userName: string | null = '';
  userRole: string | null = '';
  isSidebarOpen = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.userName = localStorage.getItem('username');
    this.userRole = localStorage.getItem('role');
  }

  onLogout() {
    Swal.fire({
      title: '¿Cerrar sesión?',
      text: "Tendrás que ingresar tus credenciales nuevamente.",
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#1a2a40',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    })
  }
  
  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}