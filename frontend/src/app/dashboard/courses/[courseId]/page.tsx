"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useCourses, useCourseActivitiesList } from "@/hooks";
import { useSyncCourseActivities } from "@/hooks/useCourses";
import { useScheduleUpcoming } from "@/hooks/useSchedule";
import type { Section, Activity as CourseActivity } from "@/models/schedule.course";
import type { Activity as ScheduleActivity, ScheduleData } from "@/models/schedule.model";


export default function CourseDetailsPage() {
  const router = useRouter();
  // next/navigation useParams no acepta genéricos en algunas versiones; usarlo de forma segura:
  const params = useParams();
  const courseId = (params?.courseId as string | undefined) || "";

  // Estado para controlar las secciones expandidas/colapsadas
  const [expandedSections, setExpandedSections] = useState<Record<number, boolean>>({});

  // Obtener datos del curso desde la lista (cache de useCourses)
  const { data: coursesResponse } = useCourses();
  const course = coursesResponse?.data?.find((c) => c.id === courseId);

  // Hook para obtener actividades próximas a vencer
  const { data: upcomingActivities } = useScheduleUpcoming(courseId);

  // Hook de sincronización (devuelve syncCoursesFn según tu hook corregido)
  const { syncCoursesFn, isPending: isSyncing } = useSyncCourseActivities({
    onSuccess: (data) => {
      toast.success("¡Sincronización exitosa!", {
        description: `${data?.data?.totalActivities || 0} actividades sincronizadas.`,
      });
    },
    onError: (error) => {
      toast.error("Error al sincronizar", {
        description: error?.message || "Error desconocido",
      });
    },
  });

  // Hook para leer actividades desde localStorage (o tu implementación)
  const { data: activitiesData, isLoading, isError, error, refetch } = useCourseActivitiesList(courseId);

  // Función para alternar expansión de secciones
  const toggleSection = (sectionNumber: number) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionNumber]: !prev[sectionNumber],
    }));
  };

  // Si no hay courseId, mostrar mensaje de carga
  if (!courseId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando identificador de curso...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Curso no encontrado</p>
            <Link href="/dashboard">
              <Button className="mt-4">Volver al Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/5">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">{course.name}</h1>
                <p className="text-sm text-muted-foreground">Actividades del curso</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => refetch()} disabled={isLoading} variant="outline" size="sm" className="gap-2">
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
              <Button onClick={() => syncCoursesFn(courseId)} disabled={isSyncing} size="sm" className="gap-2">
                <Download className={`h-4 w-4 ${isSyncing ? "animate-bounce" : ""}`} />
                {isSyncing ? "Sincronizando..." : "Sincronizar"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Estado inicial */}
          {!activitiesData?.data && !isLoading && !isError && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <p className="font-semibold">No hay actividades sincronizadas aún.</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Pulsa “Sincronizar” para obtener las actividades desde SIMA.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Cargando */}
          {isLoading && (
            <Card>
              <CardContent className="py-12 flex flex-col items-center gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Cargando actividades...</p>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {isError && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <p className="font-semibold text-destructive">Error al cargar</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {error instanceof Error ? error.message : "Error desconocido"}
                </p>
                <Button onClick={() => refetch()} variant="outline" size="sm" className="mt-3">
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Actividades */}
          {activitiesData?.data && (
            <div className="space-y-4">
              <Card className="border-border/50 bg-muted/30">
                <CardContent className="pt-6">
                  <p className="text-sm">
                    <span className="font-semibold">{activitiesData.data.totalActivities}</span>{" "}
                    actividades en{" "}
                    <span className="font-semibold">{activitiesData.data.sections.length}</span>{" "}
                    sección{activitiesData.data.sections.length !== 1 ? "es" : ""}
                  </p>
                </CardContent>
              </Card>

              {activitiesData.data.sections.map((section: Section) => {
                const isExpanded = expandedSections[section.sectionNumber];
                return (
                  <Card key={section.sectionNumber} className="border-border/50">
                    <CardHeader
                      className="cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => toggleSection(section.sectionNumber)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{section.sectionName}</CardTitle>
                          <CardDescription>
                            {section.activities.length} actividad{section.activities.length !== 1 ? "es" : ""}
                          </CardDescription>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </CardHeader>
                    {isExpanded && (
                      <CardContent className="space-y-3">
                        {section.activities.map((activity: CourseActivity) => (
                          <ActivityCard key={activity.activityId} activity={activity} />
                        ))}
                      </CardContent>
                    )}
                  </Card>
                );
              })}

              {/* Sección de actividades próximas a vencer */}
              {upcomingActivities?.data && upcomingActivities.data.length > 0 && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span>📅</span>
                      Actividades próximas a vencer
                    </CardTitle>
                    <CardDescription>
                      Actividades con fechas de cierre cercanas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {upcomingActivities.data.flatMap((scheduleData: ScheduleData) =>
                      scheduleData.activities.map((activity: ScheduleActivity) => (
                        <UpcomingActivityCard key={activity.id} activity={activity} />
                      ))
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// 🔹 Componente individual de Actividad
function ActivityCard({ activity }: { activity: CourseActivity }) {
  const icons: Record<string, string> = {
    assign: "📝",
    quiz: "❓",
    forum: "💬",
    exam: "📋",
    activity: "🎯",
  };

  return (
    <div className="border border-border/50 rounded-lg p-4 space-y-2 hover:bg-muted/30 transition-colors">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icons[activity.type] || "📌"}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{activity.name}</h4>
          <p className="text-xs text-muted-foreground capitalize">{activity.type}</p>
        </div>
      </div>

      {activity.dates && (
        <div className="flex flex-col gap-1 text-xs pt-2 border-t border-border/50">
          {activity.dates.apertura && (
            <p>
              <span className="text-muted-foreground">Apertura: </span>
              <span className="font-medium">{activity.dates.apertura}</span>
            </p>
          )}
          {activity.dates.cierre && (
            <p>
              <span className="text-muted-foreground">Cierre: </span>
              <span className="font-medium text-red-600">{activity.dates.cierre}</span>
            </p>
          )}
        </div>
      )}

      {activity.url && (
        <Button
          size="sm"
          variant="outline"
          className="w-full h-8 text-xs"
          onClick={() => window.open(activity.url, "_blank")}
        >
          Ir a la actividad →
        </Button>
      )}
    </div>
  );
}

// 🔹 Componente de actividad próxima a vencer
function UpcomingActivityCard({ activity }: { activity: ScheduleActivity }) {
  const icons: Record<string, string> = {
    assign: "📝",
    quiz: "❓",
    forum: "💬",
    exam: "📋",
    activity: "🎯",
  };

  return (
    <div className="border border-blue-200 rounded-lg p-4 space-y-2 hover:bg-blue-100/30 transition-colors bg-white">
      <div className="flex items-start gap-3">
        <span className="text-2xl">{icons[activity.type] || "📌"}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-sm">{activity.title}</h4>
          <p className="text-xs text-muted-foreground capitalize">{activity.type}</p>
          {activity.course && (
            <p className="text-xs text-blue-600 mt-1">
              {activity.course.shortname}
            </p>
          )}
        </div>
      </div>

      {activity.activityDates && (
        <div className="flex flex-col gap-1 text-xs pt-2 border-t border-border/50">
          {activity.activityDates.apertura && (
            <p>
              <span className="text-muted-foreground">Apertura: </span>
              <span className="font-medium">{activity.activityDates.apertura}</span>
            </p>
          )}
          {activity.activityDates.cierre && (
            <p>
              <span className="text-muted-foreground">Cierre: </span>
              <span className="font-medium text-red-600">{activity.activityDates.cierre}</span>
            </p>
          )}
        </div>
      )}

      {activity.url && (
        <Button
          size="sm"
          variant="outline"
          className="w-full h-8 text-xs"
          onClick={() => window.open(activity.url, "_blank")}
        >
          Ir a la actividad →
        </Button>
      )}
    </div>
  );
}
