import { simaApi } from "@/lib/api/config";
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
} from "@/models/auth.model";

/**
 * Servicio de autenticación
 */
class AuthService {
  /**
   * Iniciar sesión
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await simaApi.post<AuthResponse>(
      "/auth/login",
      credentials
    );

    // Guardar token en sessionStorage
    if (response.data.token && typeof window !== "undefined") {
      sessionStorage.setItem("token", response.data.token);
      sessionStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response.data;
  }

  /**
   * Registrar nuevo usuario
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await simaApi.post<AuthResponse>("/auth/register", data);

    // Guardar token en sessionStorage
    if (response.data.token && typeof window !== "undefined") {
      sessionStorage.setItem("token", response.data.token);
      sessionStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response.data;
  }

  /**
   * Validar token actual
   */
  async validate(): Promise<{ valid: boolean; user?: User }> {
    const response = await simaApi.get("/auth/validate");
    return response.data;
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
    }
  }

  /**
   * Obtener token actual
   */
  getToken(): string | null {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("token");
    }
    return null;
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    if (typeof window !== "undefined") {
      const userStr = sessionStorage.getItem("user");
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch (error) {
          console.error("Error parsing user data:", error);
          return null;
        }
      }
    }
    return null;
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return this.getToken() !== null;
  }
}

export const authService = new AuthService();
