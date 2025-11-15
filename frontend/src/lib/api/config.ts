import axios, { InternalAxiosRequestConfig, AxiosError } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

console.log("🔧 API Base URL:", API_URL);

export const simaApi = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor de request para agregar el token de autenticación
simaApi.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Obtener el token directamente del sessionStorage (solo en cliente)
    if (typeof window !== "undefined") {
      const jwt = localStorage.getItem("token");

      if (jwt) {
        // Configurar el header de autorización si el token es válido
        config.headers.Authorization = `Bearer ${jwt}`;
      }
    }

    console.log("📤 Axios Request:", {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL}${config.url}`,
      headers: config.headers,
      data: config.data,
    });

    return config;
  },
  (error: AxiosError) => {
    console.error("❌ Axios Request Error:", error);
    return Promise.reject(error);
  }
);

// Interceptor de respuesta para debugging y manejo de errores
simaApi.interceptors.response.use(
  (response) => {
    console.log("✅ Axios Response:", {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      url: response.config.url,
    });
    return response;
  },
  (error) => {
    /*console.error("❌ Axios Response Error:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      fullError: error,
    });*/

    // Manejo especial para errores 401 (no autorizado)
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Limpiar token y redirigir al login
      localStorage.removeItem("token");
      // Opcional: redirigir a login
      // window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);
