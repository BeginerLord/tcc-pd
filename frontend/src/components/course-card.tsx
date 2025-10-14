"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, GraduationCap } from "lucide-react"
import type { CourseInfo } from "@/models"

interface CourseCardProps {
    course: CourseInfo
    onClick?: () => void
}

export function CourseCard({ course, onClick }: CourseCardProps) {
    return (
        <Card
            className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/30 cursor-pointer group"
            onClick={onClick}
        >
            <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                        <CardTitle className="text-lg font-semibold text-balance group-hover:text-primary transition-colors line-clamp-2">
                            {course.name}
                        </CardTitle>
                        <CardDescription className="text-sm font-medium flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5" />
                            {course.shortname}
                        </CardDescription>
                    </div>
                    <div className="rounded-full bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                        <GraduationCap className="h-5 w-5 text-primary" />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono bg-muted/50 px-2 py-1 rounded">ID: {course.id}</span>
                </div>
            </CardContent>
        </Card>
    )
}
