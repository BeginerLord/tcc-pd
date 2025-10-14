/**
 * Modelo de Usuario
 */
export interface User {
  id: string;
  username: string;
  email?: string;
  simaUsername?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Credenciales de login
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Datos de registro
 */
export interface RegisterData {
  username: string;
  password: string;
  simaUsername: string;
  simaPassword: string;
}

/**
 * Respuesta de autenticación
 */
export interface AuthResponse {
  token: string;
  user: User;
}

/**
 * Estado de autenticación
 */
export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
