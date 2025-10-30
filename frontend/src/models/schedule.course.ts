// models/courseActivities.model.ts

export interface Activity {
  activityId: string;
  name: string;
  type: string;
  section: number;
  sectionName: string;
  url: string;
  icon: string;
  dates?: {
    apertura: string;
    cierre: string;
  };
}

export interface Section {
  sectionNumber: number;
  sectionName: string;
  activities: Activity[];
}

/**
 * 🔹 Actividades de un curso individual
 */
export interface CourseActivityData {
  courseId: string;
  courseName: string;
  sections: Section[];
  totalActivities: number;
  lastSynced: string;
}

/**
 * 🔹 Respuesta de sincronización individual
 */
export interface CourseSyncResponse {
  success: boolean;
  data: CourseActivityData;
}

/**
 * 🔹 Respuesta de sincronización múltiple
 */
export interface MultiCourseSyncResponse {
  success: boolean;
  data: {
    courses: CourseActivityData[];
    totalSynced: number;
    lastGlobalSync: string;
  };
}
