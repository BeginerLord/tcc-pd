/**
 * Time Parser Helper
 * Utilidades para parsear y convertir tiempos
 */

export class TimeParser {
  /**
   * Convierte texto de hora a timestamp UNIX
   * @param timeText Texto con formato de hora (ej: "14:30")
   * @returns Timestamp UNIX en segundos
   */
  static parseTimeToTimestamp(timeText: string): number {
    try {
      if (!timeText) return 0;

      const timeMatch = timeText.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const today = new Date();
        today.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
        return Math.floor(today.getTime() / 1000);
      }

      return 0;
    } catch (error) {
      return 0;
    }
  }
}
