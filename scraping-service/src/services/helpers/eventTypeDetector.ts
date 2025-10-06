/**
 * Event Type Detector Helper
 * Detecta el tipo de evento basado en clases CSS y título
 */

export class EventTypeDetector {
  /**
   * Determina el tipo de evento basado en clases y título
   * @param classNames Clases CSS del elemento
   * @param title Título del evento
   * @returns Tipo de evento
   */
  static determineEventType(classNames: string, title: string): string {
    const titleLower = title.toLowerCase();

    if (classNames.includes('assignment') || titleLower.includes('tarea') || titleLower.includes('assignment')) {
      return 'assignment';
    }
    if (classNames.includes('quiz') || titleLower.includes('examen') || titleLower.includes('quiz')) {
      return 'quiz';
    }
    if (classNames.includes('forum') || titleLower.includes('foro') || titleLower.includes('forum')) {
      return 'forum';
    }
    if (classNames.includes('lesson') || titleLower.includes('lección') || titleLower.includes('clase')) {
      return 'lesson';
    }

    return 'activity';
  }
}
