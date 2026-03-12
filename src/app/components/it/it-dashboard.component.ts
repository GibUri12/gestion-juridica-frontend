import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-it-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, DatePipe],
  templateUrl: './it-dashboard.component.html',
  styleUrls: ['../dashboard/dashboard.component.css']
})
export class ItDashboardComponent implements OnInit {
  userName: string | null = '';
  today = new Date();

  ngOnInit() {
    this.userName = localStorage.getItem('username');
  }
}