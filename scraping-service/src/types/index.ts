export interface CourseInfo {
  id: string;
  name: string;
  shortname: string;
}

export interface CalendarEvent {
  id: string;
  name: string;
  description?: string;
  timestart: number;
  timeduration: number;
  course?: {
    id: string;
    fullname: string;
    shortname: string;
  };
  location?: string;
  eventtype: string;
  url?: string;
  activityDates?: {
    apertura?: string;
    cierre?: string;
  };
  metadata?: {
    date?: string;
    time?: string;
    actionType?: string;
    actionButton?: string;
    actionButtonUrl?: string;
    activityIcon?: string;
    component?: string;
    eventtype?: string;
  };
}

export interface Activity {
  id: string;
  title: string;
  startTime: string;
  endTime?: string;
  description?: string;
  location?: string;
  type: string;
  activityDates?: {
    apertura?: string;
    cierre?: string;
  };
  course?: {
    id: string;
    fullname: string;
    shortname: string;
  };
  url?: string;
  metadata?: {
    date?: string;
    time?: string;
    actionType?: string;
    actionButton?: string;
    actionButtonUrl?: string;
    activityIcon?: string;
  };
}

export interface ScheduleData {
  date: string;
  activities: Activity[];
}

export interface ScrapingRequest {
  cookies: string[];
  period?: 'day' | 'week' | 'month' | 'upcoming';
  courseId?: string;
  date?: string;
}
