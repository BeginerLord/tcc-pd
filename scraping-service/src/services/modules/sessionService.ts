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
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const sesskey = $('input[name="sesskey"]').attr('value') ||
                      $('[data-sesskey]').attr('data-sesskey') ||
                      response.data.match(/sesskey["\']?\s*[:=]\s*["\']?([^"',\s]+)/i)?.[1];

      if (!sesskey) {
        throw new Error('Session key not found');
      }

      return sesskey;
    } catch (error) {
      throw new Error(`Failed to get session key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
