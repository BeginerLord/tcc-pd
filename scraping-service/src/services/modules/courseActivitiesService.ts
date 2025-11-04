/**
 * Course Activities Service
 * Maneja la obtención de actividades de un curso específico desde SIMA
 */

import axios from "axios";
import * as cheerio from "cheerio";
import https from "https";
import { CookieParser } from "../helpers";

export interface CourseActivity {
  id: string;
  name: string;
  type: string;
  section: number;
  sectionName?: string;
  url?: string;
  dates?: {
    apertura?: string;
    cierre?: string;
  };
  icon?: string;
  description?: string;
}

export interface CourseSection {
  sectionNumber: number;
  sectionName: string;
  activities: CourseActivity[];
}

export interface CourseSchedule {
  courseId: string;
  courseName?: string;
  sections: CourseSection[];
  totalActivities: number;
  lastUpdated: string;
}

export class CourseActivitiesService {
  private baseUrl: string;
  private axiosInstance;

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl ||
      process.env.SIMA_BASE_URL ||
      "https://sima.unicartagena.edu.co";
    
    // Configurar axios para ignorar certificados SSL en desarrollo
    this.axiosInstance = axios.create({
      httpsAgent: new https.Agent({
        rejectUnauthorized: false
      })
    });
  }

  /**
   * Obtiene todas las actividades de un curso específico haciendo peticiones separadas por sección
   */
  async getCourseActivities(
    cookies: string[],
    courseId: string
  ): Promise<CourseSchedule> {
    try {
      const cookieHeader = CookieParser.parseCookies(cookies);

      console.log(`📚 Fetching course activities for course ID: ${courseId}`);

      // Obtener nombre del curso
      const mainUrl = `${this.baseUrl}/course/view.php?id=${courseId}`;
      const mainResponse = await this.axiosInstance.get(mainUrl, {
        headers: {
          Cookie: cookieHeader,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        maxRedirects: 5,
        timeout: 30000,
      });

      const $main = cheerio.load(mainResponse.data);
      const courseName =
        $main("h1").first().text().trim() || "Curso sin nombre";

      const sections: CourseSection[] = [];
      let totalActivities = 0;

      // Hacer peticiones separadas para secciones 1-5
      for (let sectionNum = 1; sectionNum <= 5; sectionNum++) {
        console.log(`🔍 Fetching section ${sectionNum}...`);

        const sectionUrl = `${this.baseUrl}/course/view.php?id=${courseId}&section=${sectionNum}`;

        try {
          const sectionResponse = await this.axiosInstance.get(sectionUrl, {
            headers: {
              Cookie: cookieHeader,
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
            maxRedirects: 5,
            timeout: 30000,
          });

          const $ = cheerio.load(sectionResponse.data);

          const sectionName =
            $(".sectionname span").first().text().trim() ||
            $("h3.sectionname").first().text().trim() ||
            `UNIDAD ${sectionNum}`;

          const activities: CourseActivity[] = [];

          $("li.activity[data-id]").each((index, element) => {
            const $activity = $(element);
            const activityId = $activity.attr("data-id") || "";
            const classList = $activity.attr("class") || "";
            const typeMatch = classList.match(/modtype_(\w+)/);
            const activityType = typeMatch ? typeMatch[1] : "unknown";

            // Ignorar actividades tipo 'label' (son títulos decorativos)
            if (activityType === "label") return;

            const activityName =
              $activity
                .find(".instancename")
                .first()
                .clone()
                .children(".accesshide")
                .remove()
                .end()
                .text()
                .trim() ||
              $activity.find(".activityname a").text().trim() ||
              "";

            if (!activityName) return;

            const activityUrl =
              $activity.find(".activityname a, a.aalink").attr("href") || "";
            const activityIcon =
              $activity
                .find(".activityicon, .activityiconcontainer img")
                .attr("src") || "";

            // Extraer fechas de apertura y cierre
            const dates: { apertura?: string; cierre?: string } = {};
            const $datesRegion = $activity.find(
              '[data-region="activity-dates"]'
            );

            if ($datesRegion.length > 0) {
              $datesRegion.find("div").each((i, dateDiv) => {
                const $dateDiv = $(dateDiv);
                const text = $dateDiv.text().trim();
                const strongText = $dateDiv.find("strong").text().trim();

                if (strongText === "Apertura:" || strongText === "Abrió:") {
                  dates.apertura = text
                    .replace("Apertura:", "")
                    .replace("Abrió:", "")
                    .trim();
                } else if (
                  strongText === "Cierre:" ||
                  strongText === "Cerró:"
                ) {
                  dates.cierre = text
                    .replace("Cierre:", "")
                    .replace("Cerró:", "")
                    .trim();
                }
              });
            }

            activities.push({
              id: activityId,
              name: activityName,
              type: activityType,
              section: sectionNum,
              sectionName,
              url: activityUrl,
              icon: activityIcon,
              dates: dates.apertura || dates.cierre ? dates : undefined,
            });

            totalActivities++;
          });

          if (activities.length > 0) {
            sections.push({
              sectionNumber: sectionNum,
              sectionName,
              activities,
            });
            console.log(
              `  ✅ Section ${sectionNum}: ${activities.length} activities`
            );
          }
        } catch (error) {
          console.error(`❌ Error fetching section ${sectionNum}:`, error);
        }
      }

      console.log(
        `✅ Total: ${totalActivities} activities across ${sections.length} sections`
      );

      return {
        courseId,
        courseName,
        sections,
        totalActivities,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(
        `Failed to get course activities: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getMultipleCoursesActivities(
    cookies: string[],
    courseIds: string[]
  ): Promise<CourseSchedule[]> {
    const results: CourseSchedule[] = [];
    for (const courseId of courseIds) {
      try {
        const courseSchedule = await this.getCourseActivities(
          cookies,
          courseId
        );
        results.push(courseSchedule);
      } catch (error) {
        console.error(
          `Failed to get activities for course ${courseId}:`,
          error
        );
      }
    }
    return results;
  }

  async getCourseActivitiesWithDates(
    cookies: string[],
    courseId: string
  ): Promise<CourseActivity[]> {
    const courseSchedule = await this.getCourseActivities(cookies, courseId);
    const activitiesWithDates: CourseActivity[] = [];

    for (const section of courseSchedule.sections) {
      for (const activity of section.activities) {
        if (
          activity.dates &&
          (activity.dates.apertura || activity.dates.cierre)
        ) {
          activitiesWithDates.push(activity);
        }
      }
    }

    return activitiesWithDates;
  }
}
