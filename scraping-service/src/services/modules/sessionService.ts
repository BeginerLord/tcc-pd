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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
        }
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
