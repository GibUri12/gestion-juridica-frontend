import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Cliente {
  id?:             number;
  nombreCompleto:  string;
  telefono?:       string;
  email?:          string;
  notas?:          string;
  activo?:         boolean;
  createdAt?:      string;
  createdBy?: any;
}

@Injectable({ providedIn: 'root' })
export class ClienteService {

  private readonly API = 'http://localhost:8080/api/clientes';

  constructor(private http: HttpClient) {}

  /** Lista todos los clientes. Si activo=true, solo los activos. */
  getAll(soloActivos = true): Observable<Cliente[]> {
    const params = new HttpParams().set('activo', soloActivos);
    return this.http.get<Cliente[]>(this.API, { params });
  }

  getById(id: number): Observable<Cliente> {
    return this.http.get<Cliente>(`${this.API}/${id}`);
  }

  crear(cliente: Cliente): Observable<Cliente> {
    return this.http.post<Cliente>(this.API, cliente);
  }

  editar(id: number, cliente: Cliente): Observable<Cliente> {
    return this.http.put<Cliente>(`${this.API}/${id}`, cliente);
  }

  /** Soft-delete: cambia activo = false */
  desactivar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}