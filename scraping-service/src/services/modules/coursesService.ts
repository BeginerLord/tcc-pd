/**
 * Courses Service
 * Maneja la obtención de cursos del usuario desde SIMA
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { CourseInfo } from '../../types';
import { CookieParser } from '../helpers';

export class CoursesService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.SIMA_BASE_URL || 'https://sima.unicartagena.edu.co';
  }

  /**
   * Obtiene los cursos del usuario autenticado
   * @param cookies Array de cookies del usuario
   * @returns Array de CourseInfo
   */
  async getUserCourses(cookies: string[]): Promise<CourseInfo[]> {
    try {
      const cookieHeader = CookieParser.parseCookies(cookies);
      console.log('🍪 Attempting to fetch courses with cookies');

      const testUrls = [
        `${this.baseUrl}/course/index.php`,
        `${this.baseUrl}/my/courses.php`,
        `${this.baseUrl}/`,
        `${this.baseUrl}/my/`
      ];

      let response;
      let workingUrl = null;

      for (const testUrl of testUrls) {
        try {
          console.log(`🧪 Testing URL: ${testUrl}`);
          response = await axios.get(testUrl, {
            headers: {
              'Cookie': cookieHeader,
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            maxRedirects: 15,
            validateStatus: (status) => status < 400
          });

          const finalUrl = response.request?.res?.responseUrl || response.config.url;
          const isRedirectedToLogin = finalUrl?.includes('/login/');
          const hasUsernameField = response.data?.includes('name="username"') || response.data?.includes('id="username"');
          const hasPasswordField = response.data?.includes('name="password"') || response.data?.includes('id="password"');
          const hasLoginForm = hasUsernameField && hasPasswordField;

          if (!isRedirectedToLogin && !hasLoginForm) {
            console.log(`✅ Found working URL: ${testUrl}`);
            workingUrl = testUrl;
            break;
          }
        } catch (error) {
          console.log(`❌ ${testUrl} failed:`, error instanceof Error ? error.message : 'Unknown error');
        }
      }

      if (!workingUrl || !response) {
        throw new Error('No working URL found - all URLs redirect to login');
      }

      const $ = cheerio.load(response.data);
      const courses: CourseInfo[] = [];

      // Primera estrategia: buscar contenedores de cursos
      $('.course-info-container, .coursebox, [data-course-id]').each((index, element) => {
        const $course = $(element);
        const courseId = $course.attr('data-course-id') ||
                        $course.find('[data-course-id]').attr('data-course-id') ||
                        $course.find('a[href*="/course/"]').attr('href')?.match(/course\/view\.php\?id=(\d+)/)?.[1];

        const courseName = $course.find('.coursename, .course-title, h3').first().text().trim() ||
                          $course.find('a[href*="/course/"]').text().trim();

        const shortName = $course.find('.course-shortname, .shortname').text().trim() ||
                         courseName.split(' ')[0];

        if (courseId && courseName) {
          courses.push({
            id: courseId,
            name: courseName,
            shortname: shortName
          });
        }
      });

      // Segunda estrategia: buscar enlaces directos a cursos
      if (courses.length === 0) {
        $('a[href*="/course/view.php"]').each((index, element) => {
          const $link = $(element);
          const href = $link.attr('href') || '';
          const courseId = href.match(/id=(\d+)/)?.[1];
          const courseName = $link.text().trim();

          if (courseId && courseName && courseName.length > 3) {
            courses.push({
              id: courseId,
              name: courseName,
              shortname: courseName.split(' ')[0]
            });
          }
        });
      }

      return courses;
    } catch (error) {
      throw new Error(`Failed to get user courses: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
