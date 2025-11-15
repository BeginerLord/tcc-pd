/**
 * Credenciales para scraping
 */
export interface ScrapingCredentials {
  username: string;
  password: string;
}

/**
 * Sesión de scraping
 */
export interface ScrapingSession {
  sessionId: string;
  cookies: string;
  expiresAt?: string;
}

/**
 * Evento de calendario desde scraping
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: string;
  details?: Record<string, unknown>;
  location?: string;
  description?: string;
}

/**
 * Actividad académica
 */
export interface Activity {
  id: string;
  title: string;
  course: string;
  type: "homework" | "quiz" | "exam" | "project";
  dueDate: string;
  description?: string;
  status?: "pending" | "submitted" | "graded";
  grade?: number;
}

/**
 * Respuesta de scraping
 */
export interface ScrapingResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
