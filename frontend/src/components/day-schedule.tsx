"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarIcon, Clock, MapPin, BookOpen, Loader2, AlertCircle, ChevronLeft, ChevronRight, RefreshCw, ExternalLink } from "lucide-react"
import { useScheduleDay } from "@/hooks/useSchedule"
import type { Activity } from "@/models/schedule.model"
import { format, addDays, subDays, isToday, parse } from "date-fns"
import { es } from "date-fns/locale"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"
import { parseCourseFullName } from "@/lib/course-utils"

interface DayScheduleProps {
    initialDate?: string // YYYY-MM-DD
    courseId?: string
}

export function DaySchedule({ initialDate, courseId }: DayScheduleProps) {
    const [selectedDate, setSelectedDate] = useState<string>(
        initialDate || format(new Date(), "yyyy-MM-dd")
    )
    const [isCalendarOpen, setIsCalendarOpen] = useState(false)

    const { data, isLoading, isError, error, refetch } = useScheduleDay(selectedDate, courseId)
    
    // Cargar los próximos 3 días
    const nextDay1 = format(addDays(new Date(selectedDate), 1), "yyyy-MM-dd")
    const nextDay2 = format(addDays(new Date(selectedDate), 2), "yyyy-MM-dd")
    const nextDay3 = format(addDays(new Date(selectedDate), 3), "yyyy-MM-dd")
    
    const { data: dataDay1 } = useScheduleDay(nextDay1, courseId)
    const { data: dataDay2 } = useScheduleDay(nextDay2, courseId)
    const { data: dataDay3 } = useScheduleDay(nextDay3, courseId)

    const handlePreviousDay = () => {
        const date = new Date(selectedDate)
        const newDate = format(subDays(date, 1), "yyyy-MM-dd")
        console.log('📅 Día anterior:', newDate)
        setSelectedDate(newDate)
    }

    const handleNextDay = () => {
        const date = new Date(selectedDate)
        const newDate = format(addDays(date, 1), "yyyy-MM-dd")
        console.log('📅 Día siguiente:', newDate)
        setSelectedDate(newDate)
    }

    const handleToday = () => {
        const newDate = format(new Date(), "yyyy-MM-dd")
        console.log('📅 Hoy:', newDate)
        setSelectedDate(newDate)
    }

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setSelectedDate(format(date, "yyyy-MM-dd"))
            setIsCalendarOpen(false)
        }
    }

    const getActivityIcon = (type: string) => {
        const icons: Record<string, string> = {
            assign: "📝",
            quiz: "❓",
            forum: "💬",
            exam: "📋",
            activity: "🎯",
            default: "📌",
        }
        return icons[type] || icons.default
    }

    const getActivityColor = (type: string) => {
        const colors: Record<string, string> = {
            assign: "border-l-blue-500",
            quiz: "border-l-purple-500",
            forum: "border-l-green-500",
            exam: "border-l-red-500",
            activity: "border-l-orange-500",
        }
        return colors[type] || "border-l-gray-500"
    }

    const formatDateDisplay = (dateStr: string) => {
        const date = new Date(dateStr)
        if (isToday(date)) {
            return `Hoy, ${format(date, "d 'de' MMMM", { locale: es })}`
        }
        return format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
    }

    // Parsear fecha en español a formato legible
    // Formato: "jueves, 25 de septiembre de 2025, 12:51"
    const parseSpanishDate = (dateStr: string): string => {
        try {
            // Mapa de meses en español
            const months: Record<string, string> = {
                'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
                'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
                'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
            }

            // Extraer partes: "jueves, 25 de septiembre de 2025, 12:51"
            const parts = dateStr.split(',').map(p => p.trim())
            if (parts.length < 2) return dateStr

            // Segunda parte: "25 de septiembre de 2025"
            const datePart = parts[1].split(' de ')
            if (datePart.length < 3) return dateStr

            const day = datePart[0].trim().padStart(2, '0')
            const monthName = datePart[1].trim().toLowerCase()
            const year = datePart[2].trim()

            const month = months[monthName]
            if (!month) return dateStr

            // Construir fecha
            const time = parts[2] ? parts[2].trim() : ''
            const dateObj = new Date(`${year}-${month}-${day}T${time || '00:00'}:00`)

            return format(dateObj, "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })
        } catch {
            return dateStr
        }
    }

    const activities = data?.data?.[0]?.activities || []
    
    // Obtener actividades de los próximos 3 días
    const upcomingDays = [
        {
            date: nextDay1,
            dateDisplay: formatDateDisplay(nextDay1),
            activities: dataDay1?.data?.[0]?.activities || []
        },
        {
            date: nextDay2,
            dateDisplay: formatDateDisplay(nextDay2),
            activities: dataDay2?.data?.[0]?.activities || []
        },
        {
            date: nextDay3,
            dateDisplay: formatDateDisplay(nextDay3),
            activities: dataDay3?.data?.[0]?.activities || []
        }
    ].filter(day => day.activities.length > 0) // Solo mostrar días con actividades

    return (
        <Card className="border-border/50 shadow-sm">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5 text-primary" />
                            Horario del Día
                        </CardTitle>
                        <CardDescription className="capitalize">
                            {formatDateDisplay(selectedDate)}
                        </CardDescription>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => refetch()}
                        disabled={isLoading}
                        className="gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                        Actualizar
                    </Button>
                </div>

                {/* Date Navigation */}
                <div className="flex items-center gap-2 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePreviousDay}
                        disabled={isLoading}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 gap-2"
                                disabled={isLoading}
                            >
                                <CalendarIcon className="h-4 w-4" />
                                Seleccionar fecha
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="center">
                            <DayPicker
                                mode="single"
                                selected={new Date(selectedDate)}
                                onSelect={handleDateSelect}
                                locale={es}
                                defaultMonth={new Date(selectedDate)}
                                className="p-3"
                                classNames={{
                                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                    month: "space-y-4",
                                    caption: "flex justify-center pt-1 relative items-center",
                                    caption_label: "text-sm font-medium",
                                    nav: "space-x-1 flex items-center",
                                    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
                                    nav_button_previous: "absolute left-1",
                                    nav_button_next: "absolute right-1",
                                    table: "w-full border-collapse space-y-1",
                                    head_row: "flex",
                                    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                                    row: "flex w-full mt-2",
                                    cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md",
                                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                    day_today: "bg-accent text-accent-foreground",
                                    day_outside: "text-muted-foreground opacity-50",
                                    day_disabled: "text-muted-foreground opacity-50",
                                    day_hidden: "invisible",
                                }}
                            />
                        </PopoverContent>
                    </Popover>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleToday}
                        disabled={isLoading}
                    >
                        Hoy
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextDay}
                        disabled={isLoading}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Cargando horario...</p>
                    </div>
                )}

                {/* Error State */}
                {isError && !isLoading && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="rounded-full bg-destructive/10 p-3">
                            <AlertCircle className="h-6 w-6 text-destructive" />
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-sm font-medium">Error al cargar el horario</p>
                            <p className="text-xs text-muted-foreground">
                                {error?.message || "No se pudo obtener el horario del día"}
                            </p>
                        </div>
                        <Button onClick={() => refetch()} variant="outline" size="sm">
                            Reintentar
                        </Button>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !isError && activities.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 text-center">
                        <div className="rounded-full bg-muted/50 p-4">
                            <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium">No hay actividades</p>
                            <p className="text-xs text-muted-foreground max-w-sm">
                                No tienes actividades programadas para este día.
                            </p>
                        </div>
                    </div>
                )}

                {/* Activities List */}
                {!isLoading && !isError && activities.length > 0 && (
                    <div className="space-y-3">
                        <p className="text-sm text-muted-foreground mb-4">
                            {activities.length} {activities.length === 1 ? "actividad" : "actividades"} programadas
                        </p>

                        <div className="space-y-3">
                            {activities.map((activity: Activity) => (
                                <div
                                    key={activity.id}
                                    className={`border-l-4 ${getActivityColor(activity.type)} bg-card rounded-r-lg p-4 hover:shadow-md transition-shadow`}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1 space-y-2">
                                            {/* Activity Header */}
                                            <div className="flex items-start gap-2">
                                                <span className="text-lg mt-0.5">{getActivityIcon(activity.type)}</span>
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-sm leading-tight">
                                                        {activity.title}
                                                    </h4>
                                                    {activity.course && (
                                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                            <BookOpen className="h-3 w-3" />
                                                            {parseCourseFullName(activity.course.fullname).courseName}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Activity Details */}
                                            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                                {activity.startTime && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        <span>
                                                            {activity.startTime}
                                                            {activity.endTime && ` - ${activity.endTime}`}
                                                        </span>
                                                    </div>
                                                )}
                                                {activity.location && (
                                                    <div className="flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" />
                                                        <span>{activity.location}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Activity Description */}
                                            {activity.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {activity.description}
                                                </p>
                                            )}

                                            {/* Activity Dates */}
                                            {activity.activityDates && (
                                                <div className="flex flex-col gap-2 text-xs">
                                                    {activity.activityDates.apertura && (
                                                        <div>
                                                            <span className="text-muted-foreground">Apertura: </span>
                                                            <span className="font-medium">
                                                                {parseSpanishDate(activity.activityDates.apertura)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {activity.activityDates.cierre && (
                                                        <div>
                                                            <span className="text-muted-foreground">Cierre: </span>
                                                            <span className="font-medium text-destructive">
                                                                {parseSpanishDate(activity.activityDates.cierre)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Activity URL Button */}
                                            {activity.url && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2 mt-2"
                                                    onClick={() => window.open(activity.url, '_blank')}
                                                >
                                                    <ExternalLink className="h-3.5 w-3.5" />
                                                    Ir a la actividad
                                                </Button>
                                            )}
                                        </div>

                                        {/* Activity Type Badge */}
                                        <div className="px-2 py-1 rounded bg-muted text-xs font-medium capitalize">
                                            {activity.type}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upcoming Days Activities */}
                {!isLoading && !isError && upcomingDays.length > 0 && (
                    <div className="mt-8 space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="h-px bg-border flex-1" />
                            <h3 className="text-sm font-medium text-muted-foreground">
                                Próximos días
                            </h3>
                            <div className="h-px bg-border flex-1" />
                        </div>

                        {upcomingDays.map((day) => (
                            <div key={day.date} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-semibold capitalize">
                                        {day.dateDisplay}
                                    </h4>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedDate(day.date)}
                                        className="text-xs"
                                    >
                                        Ver este día
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {day.activities.map((activity: Activity) => (
                                        <div
                                            key={activity.id}
                                            className={`border-l-4 ${getActivityColor(activity.type)} bg-card/50 rounded-r-lg p-3 hover:shadow-md transition-shadow cursor-pointer`}
                                            onClick={() => setSelectedDate(day.date)}
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-base mt-0.5">{getActivityIcon(activity.type)}</span>
                                                        <div className="flex-1">
                                                            <h5 className="font-medium text-xs leading-tight">
                                                                {activity.title}
                                                            </h5>
                                                            {activity.course && (
                                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                                    <BookOpen className="h-3 w-3" />
                                                                    {parseCourseFullName(activity.course.fullname).courseName}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {activity.startTime && (
                                                        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-6">
                                                            <Clock className="h-3 w-3" />
                                                            <span>
                                                                {activity.startTime}
                                                                {activity.endTime && ` - ${activity.endTime}`}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {activity.activityDates?.cierre && (
                                                        <div className="flex items-center gap-1 text-xs ml-6">
                                                            <span className="text-muted-foreground">Cierre: </span>
                                                            <span className="font-medium text-destructive">
                                                                {parseSpanishDate(activity.activityDates.cierre)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="px-2 py-0.5 rounded bg-muted text-xs font-medium capitalize">
                                                    {activity.type}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
