import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Audiencia {
  id?:                       number;
  estado?:                   'PROGRAMADA' | 'REALIZADA' | 'CANCELADA' | 'REPROGRAMADA';
  fecha?:                    string;
  hora?:                     string;
  resultado?:                string;
  notasTipo?:                string;  // Anotaciones de seguimiento del abogado
  
  expedienteId?:             number;
  expedienteNumero?:         string;
  clienteNombre?:            string;
  empresaNombre?:            string;

  tipoAudienciaId?:          number;
  tipoAudienciaAbreviatura?: string;
  tipoAudienciaDescripcion?: string;

  tribunalId?:               number;
  tribunalClave?:            string;
  tribunalNombre?:           string;

  audienciaPadreId?:         number;
  audienciaPadreFecha?:      string;
  
  abogados?:                 AbogadoAudienciaDTO[];
}

export interface AbogadoAudienciaDTO {
  usuarioId:      number;
  nombreCompleto: string;
  claveAbogado?:  string;
  esTitular:      boolean;
}

export interface CatTipoAudiencia {
  id:          number;
  abreviatura: string;
  descripcion: string;
}

export interface UsuarioAbogado {
  id:             number;
  nombreCompleto: string;
  claveAbogado?:  string;
  username:       string;
}

export interface Tribunal {
  id:              number;
  clave:           string;
  nombreCompleto:  string;
  activo:          boolean;
}

@Injectable({ providedIn: 'root' })
export class AudienciaService {

  private readonly API       = 'http://localhost:8080/api/audiencias';
  private readonly API_TIPOS = 'http://localhost:8080/api/tipos-audiencia';
  private readonly API_USERS = 'http://localhost:8080/api/usuarios';
  private readonly API_EXP   = 'http://localhost:8080/api/expedientes';
  private readonly API_TRIBUNALES   = 'http://localhost:8080/api/catalogos/tribunales';

  constructor(private http: HttpClient) {}

  // ── Audiencias ───────────────────────────────────────────────────
  getAll(estado?: string, abogadoId?: number, fechaDesde?: string, fechaHasta?: string): Observable<Audiencia[]> {
    let params = new HttpParams();
    if (estado)     params = params.set('estado',     estado);
    if (abogadoId)  params = params.set('abogadoId',  abogadoId);
    if (fechaDesde) params = params.set('fechaDesde', fechaDesde);
    if (fechaHasta) params = params.set('fechaHasta', fechaHasta);
    return this.http.get<Audiencia[]>(this.API, { params });
  }

  crear(data: any): Observable<Audiencia> {
    return this.http.post<Audiencia>(this.API, data);
  }

  editar(id: number, data: any): Observable<Audiencia> {
    return this.http.put<Audiencia>(`${this.API}/${id}`, data);
  }

  cambiarEstado(id: number, estado: string): Observable<Audiencia> {
    return this.http.patch<Audiencia>(`${this.API}/${id}/estado`, null,
      { params: new HttpParams().set('estado', estado) });
  }

  registrarResultado(id: number, resultado: string, notasTipo?: string): Observable<Audiencia> {
    return this.http.patch<Audiencia>(`${this.API}/${id}/resultado`, { resultado, notasTipo });
  }

  getMisAudiencias(): Observable<Audiencia[]> {
    return this.http.get<Audiencia[]>(`${this.API}/mis-audiencias`);
  }

  getAudienciasPorExpediente(expedienteId: number): Observable<Audiencia[]> {
    return this.http.get<Audiencia[]>(`${this.API}/por-expediente/${expedienteId}`);
  }

  // ── Catálogos ────────────────────────────────────────────────────
  getTiposAudiencia(q = ''): Observable<CatTipoAudiencia[]> {
    return this.http.get<CatTipoAudiencia[]>(this.API_TIPOS, {
      params: new HttpParams().set('q', q)
    });
  }
  getTribunales(): Observable<Tribunal[]> {
    return this.http.get<Tribunal[]>(this.API_TRIBUNALES);
  }

  buscarTribunales(q: string): Observable<Tribunal[]> {
    return this.http.get<Tribunal[]>(this.API_TRIBUNALES, {
      params: new HttpParams().set('q', q)
    });
  }

  getAbogados(): Observable<UsuarioAbogado[]> {
    return this.http.get<UsuarioAbogado[]>(`${this.API_USERS}/abogados`);
  }

  buscarExpedientes(q: string): Observable<any[]> {
    return this.http.get<any[]>(this.API_EXP, {
      params: new HttpParams().set('numero', q)
    });
  }
}