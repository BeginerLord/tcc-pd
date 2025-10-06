/**
 * Cookie Parser Helper
 * Utilidades para parsear y manejar cookies de SIMA
 */

export class CookieParser {
  /**
   * Convierte un array de cookies en un header string
   * @param cookies Array de cookies
   * @returns String formateado para header Cookie
   */
  static parseCookies(cookies: string[]): string {
    const cookieMap = new Map<string, string>();

    for (const cookie of cookies) {
      const cookiePart = cookie.split(';')[0];
      const [name, value] = cookiePart.split('=');
      if (name && value) {
        cookieMap.set(name.trim(), value.trim());
      }
    }

    return Array.from(cookieMap.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }
}
