import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expediente } from '../components/abogado/expedientes/expediente.model'; 

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
  // En src/app/services/expediente.service.ts
  crear(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/legal`, datos); // <-- Agrega /legal aquí
  }

  buscarJuntas(termino: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/catalogos/juntas?term=${termino}`);
  }
  
  buscarTribunales(termino: string): Observable<any[]> {
  // Asegúrate de que esta ruta coincida con tu @GetMapping en el Controller del Back
  return this.http.get<any[]>(`${this.cattribunal}/catalogos/tribunales?term=${termino}`);
}

}