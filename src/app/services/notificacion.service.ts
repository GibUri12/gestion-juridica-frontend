import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface NotificacionDTO {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
  createdAt: string;
  fechaLectura?: string;
  referenceId?: number; // expedienteId para navegar
}

@Injectable({ providedIn: 'root' })
export class NotificacionService {
  private readonly API = 'http://localhost:8080/api/notificaciones';

  constructor(private http: HttpClient) {}

  getAll(): Observable<NotificacionDTO[]> {
    return this.http.get<NotificacionDTO[]>(this.API);
  }

  getNoLeidas(): Observable<NotificacionDTO[]> {
    return this.http.get<NotificacionDTO[]>(`${this.API}/no-leidas`);
  }

  countNoLeidas(): Observable<number> {
    return this.http.get<number>(`${this.API}/count-no-leidas`);
  }

  marcarLeida(id: number): Observable<NotificacionDTO> {
    return this.http.patch<NotificacionDTO>(`${this.API}/${id}/leer`, {});
  }

  marcarTodasLeidas(): Observable<void> {
    return this.http.patch<void>(`${this.API}/leer-todas`, {});
  }
}
