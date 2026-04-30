// usuario.model.ts
export type RolUsuario = 'ADMINISTRADOR' | 'ABOGADO' | 'IT_MANAGER';

export interface Usuario {
  id: number;
  nombreCompleto: string;
  claveAbogado?: string;
  username: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
  createdAt?: string;
}

export interface UsuarioRequest {
  nombreCompleto: string;
  claveAbogado?: string;
  username: string;
  password?: string;
  email: string;
  rol: RolUsuario;
  activo: boolean;
}