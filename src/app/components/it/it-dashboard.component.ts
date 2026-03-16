import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { ClienteService } from '../dashboard/clientes/cliente.service';

@Component({
  selector: 'app-it-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, DatePipe],
  templateUrl: './it-dashboard.component.html',
  styleUrls: ['../dashboard/dashboard.component.css', './it.css']
})
export class ItDashboardComponent implements OnInit {
  userName    = localStorage.getItem('username');
  userId      = localStorage.getItem('userId');
  today       = new Date();
  totalClientes:   number | null = null;
  clientesPropios: number | null = null;

  constructor(private clienteService: ClienteService) {}

  ngOnInit(): void {
    // Total de clientes activos en el sistema
    this.clienteService.getAll(true).subscribe({
      next: (clientes) => {
        this.totalClientes = clientes.length;
        // Clientes registrados por este usuario
        const myId = Number(this.userId);
        this.clientesPropios = clientes.filter(
          c => c.createdBy && (c.createdBy as any).id === myId
        ).length;
      },
      error: () => {
        this.totalClientes   = 0;
        this.clientesPropios = 0;
      }
    });
  }
}