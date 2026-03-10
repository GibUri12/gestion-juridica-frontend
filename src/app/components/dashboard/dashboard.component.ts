import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  userName: string | null = '';
  userRole: string | null = '';

  constructor() {}

  ngOnInit() {
    this.userName = localStorage.getItem('username');
    this.userRole = localStorage.getItem('role');
  }
}