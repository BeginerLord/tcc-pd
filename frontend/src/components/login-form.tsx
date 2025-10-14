"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Lock, User } from "lucide-react"
import { LoginCredentials } from "@/models"
import { useLogin } from "@/hooks"
import { toast } from "sonner"

export function LoginForm() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [credentials, setCredentials] = useState<LoginCredentials>({
        username: "",
        password: "",
    })

    const { loginFn, isPending, isError, error } = useLogin({
        onSuccess: (data) => {
            toast.success("¡Inicio de sesión exitoso!", {
                description: `Bienvenido ${credentials.username}`,
            })
            // Redirigir al dashboard o página principal
            router.push("/dashboard")
        },
        onError: (error) => {
            toast.error("Error al iniciar sesión", {
                description: error.message || "Credenciales inválidas",
            })
        },
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        loginFn(credentials)
    }

    return (
        <Card className="w-full max-w-md border-border/50 shadow-lg">
            <CardHeader className="space-y-2 text-center">
                <CardTitle className="text-3xl font-semibold text-balance">Bienvenido</CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                    Ingresa tus credenciales para continuar
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-sm font-medium">
                            Usuario
                        </Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                id="username"
                                type="text"
                                placeholder="Ingresa tu usuario"
                                value={credentials.username}
                                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                className="pl-10 h-11 bg-background border-border/60 focus:border-primary"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium">
                            Contraseña
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Ingresa tu contraseña"
                                value={credentials.password}
                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                className="pl-10 pr-10 h-11 bg-background border-border/60 focus:border-primary"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                        <a href="#" className="text-primary hover:text-primary/80 font-medium transition-colors">
                            ¿Olvidaste tu contraseña?
                        </a>
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
                        disabled={isPending}
                    >
                        {isPending ? "Iniciando sesión..." : "Iniciar Sesión"}
                    </Button>

                    <div className="text-center text-sm text-muted-foreground">
                        {"¿No tienes una cuenta? "}
                        <a href="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                            Regístrate aquí
                        </a>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
