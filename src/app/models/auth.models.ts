export interface LoginRequest {
  username: string;
  password: string;
}

export interface JwtResponse {
  id: any;
  token: string;
  username: string;
  role: string;
}