"use client"

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BookOpen } from "lucide-react"
import Image from "next/image"
import type { CourseInfo } from "@/models"
import { parseCourseFullName } from "@/lib/course-utils"

interface CourseCardProps {
    course: CourseInfo
    onClick?: () => void
}

export function CourseCard({ course, onClick }: CourseCardProps) {
    const parsedCourse = parseCourseFullName(course.name)

    return (
        <Card
            className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/30 cursor-pointer group"
            onClick={onClick}
        >
            <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 space-y-1">
                        <CardTitle className="text-lg font-semibold text-balance group-hover:text-primary transition-colors line-clamp-2">
                            {parsedCourse.courseName}
                        </CardTitle>
                        <CardDescription className="text-sm font-medium flex items-center gap-1.5">
                            <BookOpen className="h-3.5 w-3.5" />
                            {parsedCourse.group} - {parsedCourse.year}-{parsedCourse.period}
                        </CardDescription>
                    </div>
                    <div className="rounded-full bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
                        <Image
                            src="/logo.svg"
                            alt="Logo"
                            width={20}
                            height={20}
                            className="group-hover:scale-110 transition-transform"
                        />
                    </div>
                </div>
            </CardHeader>
        </Card>
    )
}
