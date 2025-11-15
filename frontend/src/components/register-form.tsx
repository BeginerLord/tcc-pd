"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Lock, User } from "lucide-react"
import { RegisterData } from "@/models"
import { useRegister } from "@/hooks"
import { toast } from "sonner"

export function RegisterForm() {
    const router = useRouter()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [showSimaPassword, setShowSimaPassword] = useState(false)
    const [formData, setFormData] = useState<RegisterData & { confirmPassword: string }>({
        username: "",
        password: "",
        confirmPassword: "",
        simaUsername: "",
        simaPassword: "",
    })
    const [passwordError, setPasswordError] = useState("")

    const { registerFn, isPending } = useRegister({
        onSuccess: () => {
            toast.success("¡Registro exitoso!", {
                description: "Tu cuenta ha sido creada correctamente",
            })
            // Redirigir al login o dashboard
            router.push("/login")
        },
        onError: (error) => {
            toast.error("Error al registrar", {
                description: error.message || "No se pudo crear la cuenta",
            })
        },
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setPasswordError("")

        // Validar que las contraseñas coincidan
        if (formData.password !== formData.confirmPassword) {
            setPasswordError("Las contraseñas no coinciden")
            toast.error("Error de validación", {
                description: "Las contraseñas no coinciden",
            })
            return
        }

        // Validar longitud mínima de contraseña
        if (formData.password.length < 6) {
            setPasswordError("La contraseña debe tener al menos 6 caracteres")
            toast.error("Error de validación", {
                description: "La contraseña debe tener al menos 6 caracteres",
            })
            return
        }

        // Enviar solo los datos necesarios (sin confirmPassword)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { confirmPassword, ...registerData } = formData
        registerFn(registerData)
    }

    return (
        <Card className="w-full max-w-md border-border/50 shadow-lg">
            <CardHeader className="space-y-2 text-center">
                <CardTitle className="text-3xl font-semibold text-balance">Crear cuenta</CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                    Completa el formulario para registrarte
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
                                placeholder="Elige un nombre de usuario"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                className="pl-10 h-11 bg-background border-border/60 focus:border-primary"
                                required
                                minLength={3}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="simaUsername" className="text-sm font-medium">
                            Usuario SIMA
                        </Label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                id="simaUsername"
                                type="text"
                                placeholder="Tu usuario de SIMA"
                                value={formData.simaUsername}
                                onChange={(e) => setFormData({ ...formData, simaUsername: e.target.value })}
                                className="pl-10 h-11 bg-background border-border/60 focus:border-primary"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="simaPassword" className="text-sm font-medium">
                            Contraseña SIMA
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                id="simaPassword"
                                type={showSimaPassword ? "text" : "password"}
                                placeholder="Tu contraseña de SIMA"
                                value={formData.simaPassword}
                                onChange={(e) => setFormData({ ...formData, simaPassword: e.target.value })}
                                className="pl-10 pr-10 h-11 bg-background border-border/60 focus:border-primary"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowSimaPassword(!showSimaPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showSimaPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium">
                            Contraseña de la aplicación
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Mínimo 6 caracteres"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="pl-10 pr-10 h-11 bg-background border-border/60 focus:border-primary"
                                required
                                minLength={6}
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

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium">
                            Confirmar contraseña
                        </Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Repite tu contraseña"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className="pl-10 pr-10 h-11 bg-background border-border/60 focus:border-primary"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        {passwordError && (
                            <p className="text-sm text-destructive">{passwordError}</p>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm"
                        disabled={isPending}
                    >
                        {isPending ? "Creando cuenta..." : "Crear cuenta"}
                    </Button>

                    <div className="text-center text-sm text-muted-foreground">
                        {"¿Ya tienes una cuenta? "}
                        <a href="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                            Inicia sesión aquí
                        </a>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
