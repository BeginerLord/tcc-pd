"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services";
import type { User, LoginCredentials, RegisterData } from "@/models/auth.model";

/**
 * Hook para obtener el estado de autenticación actual
 */
export function useAuthState() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un usuario en sessionStorage al montar
    const storedToken = authService.getToken();
    const storedUser = authService.getCurrentUser();

    if (storedToken && storedUser) {
      setUser(storedUser);
      setToken(storedToken);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const updateAuth = (userData: User | null, authToken: string | null) => {
    setUser(userData);
    setToken(authToken);
    setIsAuthenticated(!!userData && !!authToken);
  };

  const clearAuth = () => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    updateAuth,
    clearAuth,
  };
}

/**
 * Hook para manejar el login.
 * Ejemplo de uso:
 * const { loginFn, isPending } = useLogin();
 * loginFn({ username: "user", password: "pass" });
 */
export function useLogin(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const mutation = useMutation({
    mutationKey: ["auth", "login"],
    mutationFn: (credentials: LoginCredentials) =>
      authService.login(credentials),
    onSuccess: (data) => {
      console.log("✅ Login exitoso:", data.user.username);
      options?.onSuccess?.(data);
    },
    onError: (error: any) => {
      const message =
        error instanceof Error
          ? error.message
          : "Ocurrió un error al iniciar sesión";
      console.error("❌ Error en login:", message);
      options?.onError?.(error instanceof Error ? error : new Error(message));
    },
  });

  return {
    loginFn: (credentials: LoginCredentials) => mutation.mutate(credentials),
    loginAsync: (credentials: LoginCredentials) =>
      mutation.mutateAsync(credentials),
    ...mutation,
  };
}

export type UseLoginReturn = ReturnType<typeof useLogin>;

/**
 * Hook para manejar el registro.
 * Ejemplo de uso:
 * const { registerFn, isPending } = useRegister();
 * registerFn({ username, password, simaUsername, simaPassword });
 */
export function useRegister(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const mutation = useMutation({
    mutationKey: ["auth", "register"],
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: (data) => {
      console.log("✅ Registro exitoso:", data.user.username);
      options?.onSuccess?.(data);
    },
    onError: (error: any) => {
      const message =
        error instanceof Error
          ? error.message
          : "Ocurrió un error al registrar el usuario";
      console.error("❌ Error en registro:", message);
      options?.onError?.(error instanceof Error ? error : new Error(message));
    },
  });

  return {
    registerFn: (data: RegisterData) => mutation.mutate(data),
    registerAsync: (data: RegisterData) => mutation.mutateAsync(data),
    ...mutation,
  };
}

export type UseRegisterReturn = ReturnType<typeof useRegister>;

/**
 * Hook para manejar la validación del token.
 */
export function useValidateToken(options?: {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}) {
  const mutation = useMutation({
    mutationKey: ["auth", "validate"],
    mutationFn: () => authService.validate(),
    onSuccess: (data) => {
      console.log("✅ Token válido");
      options?.onSuccess?.(data);
    },
    onError: (error: any) => {
      const message =
        error instanceof Error ? error.message : "Token inválido o expirado";
      console.error("❌ Error al validar token:", message);
      options?.onError?.(error instanceof Error ? error : new Error(message));
    },
  });

  return {
    validateFn: () => mutation.mutate(),
    validateAsync: () => mutation.mutateAsync(),
    ...mutation,
  };
}

export type UseValidateTokenReturn = ReturnType<typeof useValidateToken>;

/**
 * Hook completo de autenticación que combina estado y operaciones.
 * Ejemplo de uso:
 * const { user, isAuthenticated, login, register, logout } = useAuth();
 */
export function useAuth() {
  const authState = useAuthState();
  const { loginAsync } = useLogin();
  const { registerAsync } = useRegister();

  const login = async (username: string, password: string) => {
    try {
      const response = await loginAsync({ username, password });
      authState.updateAuth(response.user, response.token);
      return response;
    } catch (error) {
      authState.clearAuth();
      throw error;
    }
  };

  const register = async (
    username: string,
    password: string,
    simaUsername: string,
    simaPassword: string
  ) => {
    try {
      const response = await registerAsync({
        username,
        password,
        simaUsername,
        simaPassword,
      });
      authState.updateAuth(response.user, response.token);
      return response;
    } catch (error) {
      authState.clearAuth();
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    authState.clearAuth();
  };

  return {
    user: authState.user,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading,
    login,
    register,
    logout,
  };
}
