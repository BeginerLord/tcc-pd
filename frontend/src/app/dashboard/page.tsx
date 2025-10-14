"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CoursesGrid } from "@/components/courses-grid"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCourses, useSyncCourses } from "@/hooks"
import { RefreshCw, LogOut, Download, BookOpen } from "lucide-react"
import { toast } from "sonner"
import type { CourseInfo } from "@/models"

export default function DashboardPage() {
    const router = useRouter()
    const [selectedCourse, setSelectedCourse] = useState<CourseInfo | null>(null)

    // Hook para obtener cursos
    const { data: coursesResponse, isLoading, isError, error, refetch } = useCourses()

    // Hook para sincronizar cursos desde SIMA
    const { syncCoursesFn, isPending: isSyncing } = useSyncCourses({
        onSuccess: (data) => {
            toast.success("¡Sincronización exitosa!", {
                description: `Se sincronizaron ${data.coursesCount || 0} cursos desde SIMA`,
            })
        },
        onError: (error) => {
            toast.error("Error al sincronizar", {
                description: error.message || "No se pudieron sincronizar los cursos desde SIMA",
            })
        },
    })

    const handleSyncCourses = () => {
        // Obtener credenciales de SIMA del usuario (podrías guardarlas en el perfil)
        // Por ahora, pedimos al usuario que las ingrese
        const username = prompt("Ingresa tu usuario de SIMA:")
        const password = prompt("Ingresa tu contraseña de SIMA:")

        if (username && password) {
            syncCoursesFn({ username, password })
        } else {
            toast.error("Credenciales requeridas", {
                description: "Debes ingresar tus credenciales de SIMA para sincronizar",
            })
        }
    }

    const handleLogout = () => {
        // Limpiar token del sessionStorage
        sessionStorage.removeItem("token")
        toast.info("Sesión cerrada", {
            description: "Has cerrado sesión correctamente",
        })
        router.push("/login")
    }

    const handleCourseClick = (course: CourseInfo) => {
        setSelectedCourse(course)
        toast.info(`Curso seleccionado: ${course.name}`)
        // Aquí podrías navegar a la página de detalles del curso
        // router.push(`/dashboard/courses/${course.id}`)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-secondary/5">
            {/* Header */}
            <header className="border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary/10 p-2">
                                <BookOpen className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                                <p className="text-sm text-muted-foreground">Gestión de Cursos</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                onClick={() => refetch()}
                                variant="outline"
                                size="sm"
                                disabled={isLoading}
                                className="gap-2"
                            >
                                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                                Actualizar
                            </Button>
                            <Button
                                onClick={handleSyncCourses}
                                variant="default"
                                size="sm"
                                disabled={isSyncing}
                                className="gap-2"
                            >
                                <Download className={`h-4 w-4 ${isSyncing ? "animate-bounce" : ""}`} />
                                {isSyncing ? "Sincronizando..." : "Sincronizar SIMA"}
                            </Button>
                            <Button
                                onClick={handleLogout}
                                variant="ghost"
                                size="sm"
                                className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                                <LogOut className="h-4 w-4" />
                                Cerrar Sesión
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="space-y-6">
                    {/* Stats Card */}
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl">Resumen</CardTitle>
                            <CardDescription>
                                Vista general de tus cursos registrados
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Total de Cursos</p>
                                    <p className="text-3xl font-bold text-primary">
                                        {coursesResponse?.count || 0}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Estado</p>
                                    <p className="text-lg font-semibold text-foreground">
                                        {isLoading ? "Cargando..." : isError ? "Error" : "Activo"}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Última actualización</p>
                                    <p className="text-lg font-semibold text-foreground">
                                        {new Date().toLocaleDateString("es-ES")}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Courses Grid */}
                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-xl">Mis Cursos</CardTitle>
                            <CardDescription>
                                Listado de todos tus cursos sincronizados desde SIMA
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CoursesGrid
                                courses={coursesResponse?.data || []}
                                isLoading={isLoading}
                                isError={isError}
                                error={error}
                                onRetry={() => refetch()}
                                onCourseClick={handleCourseClick}
                            />
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    )
}
