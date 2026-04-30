import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expediente } from '../components/dashboard/expedientes/expediente.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExpedienteService {

  private apiUrl    = `${environment.apiUrl}/api/expedientes`;
  private apiBase   = `${environment.apiUrl}/api`;  // ← base general

  constructor(private http: HttpClient) {}

  getAll(): Observable<Expediente[]> {
    return this.http.get<Expediente[]>(this.apiUrl);
  }

  completar(id: number, datos: Partial<Expediente>): Observable<Expediente> {
    return this.http.put<Expediente>(`${this.apiUrl}/${id}/completar`, datos);
  }

  buscarEmpresas(term: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/autocomplete-empresa?term=${term}`);
  }

  buscarClientes(term: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/autocomplete-cliente?term=${term}`);
  }

  crear(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/legal`, datos);
  }

  buscarJuntas(termino: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/catalogos/juntas?term=${termino}`);
  }

  // ✅ Corregido: apunta a /api/catalogos/tribunales?q=
  buscarTribunales(termino: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/catalogos/tribunales?q=${termino}`);
  }

  getMovimientos(expedienteId: number, page = 0, size = 20) {
    return this.http.get(
      `${this.apiUrl}/${expedienteId}/movimientos?page=${page}&size=${size}`
    );
  }

  asignarAbogado(expedienteId: number, usuarioId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${expedienteId}/abogados/${usuarioId}`, {});
  }

  removerAbogado(expedienteId: number, usuarioId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${expedienteId}/abogados/${usuarioId}`);
  }

  getAbogadosAsignados(expedienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${expedienteId}/abogados`);
  }

  // ✅ Corregido: apunta a /api/usuarios/abogados
  getAbogadosDisponibles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBase}/usuarios/abogados`);
  }

  actualizarPostAudiencia(id: number, payload: {
    anotacion: string;
    amparo: string;
    proximaAudiencia: string | null;
  }): Observable<Expediente> {
    return this.http.patch<Expediente>(`${this.apiUrl}/${id}/post-audiencia`, payload);
  }
}