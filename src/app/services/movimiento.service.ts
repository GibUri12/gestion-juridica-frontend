import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Movimiento, PageResponse } from '../components/abogado/expedientes/movimiento.model';
import { environment } from '../../environments/environment';


@Injectable({ providedIn: 'root' })
export class MovimientoService {

  private api = `${environment.apiUrl}/api/expedientes`;

  constructor(private http: HttpClient) {}

  // Trae todos los movimientos de un expediente (página 0, tamaño grande)
  getByExpediente(expedienteId: number, page = 0, size = 50): Observable<Movimiento[]> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http
      .get<PageResponse<Movimiento>>(`${this.api}/${expedienteId}/movimientos`, { params })
      .pipe(map(response => response.content));
  }

  // Útil si después quieres paginación real en la UI
  getByExpedientePaginado(expedienteId: number, page = 0, size = 20): Observable<PageResponse<Movimiento>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size);

    return this.http.get<PageResponse<Movimiento>>(
      `${this.api}/${expedienteId}/movimientos`, { params }
    );
  }

  // Registrar un nuevo movimiento
  crear(expedienteId: number, descripcion: string): Observable<Movimiento> {
    return this.http.post<Movimiento>(
      `${this.api}/${expedienteId}/movimientos`,
      { descripcion }
    );
  }
}