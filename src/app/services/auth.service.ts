import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { JwtResponse, LoginRequest } from '../models/auth.models';
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient) {}

  login(credentials: LoginRequest): Observable<JwtResponse> {
    return this.http.post<JwtResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('username', res.username);
        localStorage.setItem('role', res.role);
        localStorage.setItem('userId',   res.id.toString());
      })
    );
  }

  logout() {
    localStorage.clear();
  }

  getRole() {
    return localStorage.getItem('role');
  }

  getUsuarioActual() {
  return {
    id: Number(localStorage.getItem('userId')),
    username: localStorage.getItem('username'),
    rol: localStorage.getItem('role')
  };
}
}