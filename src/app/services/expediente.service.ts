import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expediente } from '../components/dashboard/expedientes/expediente.model'; 

@Injectable({ providedIn: 'root' })
export class ExpedienteService {
  // Usamos la misma base que tu AuthService
  private apiUrl = 'http://localhost:8080/api/expedientes';
  private cattribunal = 'http://localhost:8080/api/catalogos/tribunales';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Expediente[]> {
    return this.http.get<Expediente[]>(this.apiUrl);
  }

  // PASO 2: Completar información (Abogado/Admin)
  completar(id: number, datos: Partial<Expediente>): Observable<Expediente> {
    return this.http.put<Expediente>(`${this.apiUrl}/${id}/completar`, datos);
  }

  // Para los Autocompletes de Empresas y Clientes
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
  
  buscarTribunales(termino: string): Observable<any[]> {
  return this.http.get<any[]>(`${this.cattribunal}/catalogos/tribunales?term=${termino}`);
  }

  getMovimientos(expedienteId: number, page: number = 0, size: number = 20) {
    return this.http.get(`${this.apiUrl}/${expedienteId}/movimientos?page=${page}&size=${size}`);
  }

  // Asignar un abogado
  asignarAbogado(expedienteId: number, usuarioId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${expedienteId}/abogados/${usuarioId}`, {});
  }

  // Remover un abogado (soft delete)
  removerAbogado(expedienteId: number, usuarioId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${expedienteId}/abogados/${usuarioId}`);
  }

  // Obtener lista de abogados asignados a un expediente
  getAbogadosAsignados(expedienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${expedienteId}/abogados`);
  }

  // Cambiamos el método anterior por este
  getAbogadosDisponibles(): Observable<any[]> {
    return this.http.get<any[]>(`http://localhost:8080/api/usuarios/abogados`);
  }

  actualizarPostAudiencia(id: number, payload: {
    anotacion: string;
    amparo: string;
    proximaAudiencia: string | null;
  }): Observable<Expediente> {
    return this.http.patch<Expediente>(`${this.apiUrl}/${id}/post-audiencia`, payload);
  }

}