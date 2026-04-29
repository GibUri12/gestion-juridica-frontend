// usuario.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario, UsuarioRequest } from '../components/abogado/usuarios/usuario.model';

@Injectable({ providedIn: 'root' })
export class UsuarioService {

  private api = 'http://localhost:8080/api/usuarios';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.api);
  }

  getById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.api}/${id}`);
  }

  crear(dto: UsuarioRequest): Observable<Usuario> {
    return this.http.post<Usuario>(this.api, dto);
  }

  editar(id: number, dto: UsuarioRequest): Observable<Usuario> {
    return this.http.put<Usuario>(`${this.api}/${id}`, dto);
  }

  toggleActivo(id: number): Observable<Usuario> {
    return this.http.patch<Usuario>(`${this.api}/${id}/toggle-activo`, {});
  }

  cambiarPassword(id: number, nuevaPassword: string): Observable<void> {
    return this.http.patch<void>(`${this.api}/${id}/password`, { nuevaPassword });
  }
}