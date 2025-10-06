/**
 * Session Service
 * Maneja la obtención de session keys de SIMA
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { CookieParser } from '../helpers';

export class SessionService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.SIMA_BASE_URL || 'https://sima.unicartagena.edu.co';
  }

  /**
   * Valida si las cookies de sesión son válidas
   * @param cookies Array de cookies del usuario
   * @returns true si las cookies son válidas, false si no
   */
  async validateSession(cookies: string[]): Promise<boolean> {
    try {
      const cookieHeader = CookieParser.parseCookies(cookies);

      const response = await axios.get(`${this.baseUrl}/my/`, {
        headers: {
          'Cookie': cookieHeader,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 15000,
        maxRedirects: 0,
        validateStatus: (status) => status >= 200 && status < 400
      });

      // Si la respuesta contiene el formulario de login, la sesión no es válida
      if (response.data.includes('loginform') || response.data.includes('login/index.php')) {
        return false;
      }

      // Si llegamos aquí sin redirects al login, la sesión es válida
      return true;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Si hay redirect (302, 303), probablemente redirige al login
        if (error.response?.status === 302 || error.response?.status === 303) {
          return false;
        }
      }
      return false;
    }
  }

  /**
   * Obtiene el session key (sesskey) de SIMA
   * @param cookies Array de cookies del usuario autenticado
   * @returns Session key string
   */
  async getSessionKey(cookies: string[]): Promise<string> {
    try {
      const cookieHeader = CookieParser.parseCookies(cookies);

      const response = await axios.get(`${this.baseUrl}/calendar/view.php`, {
        headers: {
          'Cookie': cookieHeader,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'es-419,es;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1'
        },
        timeout: 30000,
        maxRedirects: 5
      });

      // Verificar si fue redirigido al login
      if (response.request?.path?.includes('/login') || response.data.includes('loginform')) {
        throw new Error('Session expired or invalid cookies');
      }

      const $ = cheerio.load(response.data);
      const sesskey = $('input[name="sesskey"]').attr('value') ||
                      $('[data-sesskey]').attr('data-sesskey') ||
                      response.data.match(/sesskey["\']?\s*[:=]\s*["\']?([^"',\s]+)/i)?.[1];

      if (!sesskey) {
        throw new Error('Session key not found');
      }

      return sesskey;
    } catch (error) {
      if (axios.isAxiosError(error) && error.message.includes('redirect')) {
        throw new Error('Session expired or invalid cookies. Too many redirects.');
      }
      throw new Error(`Failed to get session key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
