// Auth hooks con TanStack Query
export {
  useAuth,
  useAuthState,
  useLogin,
  useRegister,
  useValidateToken,
  type UseLoginReturn,
  type UseRegisterReturn,
  type UseValidateTokenReturn,
} from "./useAuth";

// Courses hooks con TanStack Query
export {
  useCourses,
  useCourse,
  useSyncCourses,
  useSearchCourses,
  coursesKeys,
  type UseSyncCoursesReturn,
} from "./useCourses";

// Schedule hooks con TanStack Query
export {
  useScheduleHistory,
  useScheduleEvents,
  useClearScheduleCache,
  scheduleKeys,
  type UseClearScheduleCacheReturn,
} from "./useSchedule";

// Scraping hooks con TanStack Query
export {
  useSimaLogin,
  useScrapeCourses,
  useScrapeCalendar,
  useScrapeActivities,
  useScrapeAll,
  type UseSimaLoginReturn,
  type UseScrapeCoursesReturn,
  type UseScrapeCalendarReturn,
  type UseScrapeActivitiesReturn,
  type UseScrapeAllReturn,
} from "./useScraping";
