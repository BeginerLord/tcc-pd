"use client"

import { CourseCard } from "./course-card"
import { Loader2, BookX, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CourseInfo } from "@/models"

interface CoursesGridProps {
    courses?: CourseInfo[]
    isLoading?: boolean
    isError?: boolean
    error?: Error | null
    onRetry?: () => void
    onCourseClick?: (course: CourseInfo) => void
}

export function CoursesGrid({
    courses = [],
    isLoading = false,
    isError = false,
    error = null,
    onRetry,
    onCourseClick,
}: CoursesGridProps) {
    // Estado de carga
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">Cargando cursos...</p>
            </div>
        )
    }

    // Estado de error
    if (isError) {
        return (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="rounded-full bg-destructive/10 p-4">
                    <BookX className="h-12 w-12 text-destructive" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">Error al cargar cursos</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                        {error?.message || "Ocurrió un error al intentar cargar los cursos."}
                    </p>
                </div>
                {onRetry && (
                    <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Reintentar
                    </Button>
                )}
            </div>
        )
    }

    // Sin cursos
    if (!courses || courses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="rounded-full bg-muted/50 p-4">
                    <BookX className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="text-center space-y-2">
                    <h3 className="text-lg font-semibold">No hay cursos disponibles</h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                        Aún no tienes cursos registrados. Sincroniza tus cursos desde SIMA para comenzar.
                    </p>
                </div>
            </div>
        )
    }

    // Grid de cursos
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    Mostrando <span className="font-semibold text-foreground">{courses.length}</span>{" "}
                    {courses.length === 1 ? "curso" : "cursos"}
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courses.map((course) => (
                    <CourseCard
                        key={course.id}
                        course={course}
                        onClick={() => onCourseClick?.(course)}
                    />
                ))}
            </div>
        </div>
    )
}
