/**
 * Utilidades para parsear información de cursos desde el formato SIMA
 */

export interface ParsedCourseInfo {
  program: string;           // "INGENIERÍA DE SOFTWARE - CERETÉ"
  courseName: string;        // "ARQUITECTURA DE SOFTWARE"
  group: string;             // "C1"
  year: string;              // "2025"
  period: string;            // "2"
  fullName: string;          // Nombre completo original
}

/**
 * Parsea el nombre completo de un curso de SIMA
 * Formato esperado: "PROGRAMA - SEDE - NOMBRE_CURSO - GRUPO - AÑO - PERIODO"
 * Ejemplo: "INGENIERÍA DE SOFTWARE - CERETÉ - ARQUITECTURA DE SOFTWARE - C1 - 2025 - 2"
 */
export function parseCourseFullName(fullName: string): ParsedCourseInfo {
  // Dividir por " - " para obtener las partes
  const parts = fullName.split(' - ').map(part => part.trim());

  // Si no tiene el formato esperado, devolver valores por defecto
  if (parts.length < 6) {
    return {
      program: parts[0] || 'Desconocido',
      courseName: fullName,
      group: '',
      year: '',
      period: '',
      fullName,
    };
  }

  // Extraer las partes según el formato:
  // [0] = PROGRAMA
  // [1] = SEDE
  // [2] = NOMBRE_CURSO
  // [3] = GRUPO
  // [4] = AÑO
  // [5] = PERIODO
  const program = `${parts[0]} - ${parts[1]}`; // "INGENIERÍA DE SOFTWARE - CERETÉ"
  const courseName = parts[2];                   // "ARQUITECTURA DE SOFTWARE"
  const group = parts[3];                        // "C1"
  const year = parts[4];                         // "2025"
  const period = parts[5];                       // "2"

  return {
    program,
    courseName,
    group,
    year,
    period,
    fullName,
  };
}

/**
 * Obtiene el nombre del programa del primer curso de una lista
 * Útil para mostrar el programa en el dashboard
 */
export function getProgramFromCourses(courses: Array<{ name: string }>): string {
  if (!courses || courses.length === 0) {
    return 'Programa';
  }

  const firstCourse = parseCourseFullName(courses[0].name);
  return firstCourse.program;
}

/**
 * Formatea el nombre corto de un curso para mostrar
 * Ejemplo: "ARQUITECTURA DE SOFTWARE (C1 - 2025-2)"
 */
export function formatCourseShortName(parsedCourse: ParsedCourseInfo): string {
  const { courseName, group, year, period } = parsedCourse;

  if (!group || !year || !period) {
    return courseName;
  }

  return `${courseName} (${group} - ${year}-${period})`;
}
