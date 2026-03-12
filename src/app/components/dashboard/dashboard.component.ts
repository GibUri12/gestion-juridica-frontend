import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  userName: string | null = '';
  userRole: string | null = '';
  today = new Date();
  
  // Estado para el sidebar en móvil
  isSidebarActive = false;

  constructor(private eRef: ElementRef) {}

  ngOnInit() {
    this.userName = localStorage.getItem('username');
    this.userRole = localStorage.getItem('role');
  }

  // Método para el botón sandwich
  toggleSidebar(event: Event) {
    event.stopPropagation(); // Evita que el clic llegue al document
    this.isSidebarActive = !this.isSidebarActive;
  }

  // Cerrar al hacer clic fuera
  @HostListener('document:click', ['$event'])
  clickOut(event: Event) {
    // Si el clic NO está dentro de este componente, cerramos el sidebar
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isSidebarActive = false;
    }
  }
}