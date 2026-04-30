export interface Movimiento {
  id: number;
  descripcion: string;
  createdAt: string;
  usuario: {
    id: number;
    username: string;
    nombreCompleto?: string;
  };
}

// Estructura de Page que devuelve Spring
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;      // página actual
  size: number;
}