import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogIn, UserPlus } from "lucide-react"

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-accent/10 to-secondary/10">
      <div className="text-center space-y-8 max-w-2xl">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-balance text-foreground">Sistema de Autenticación</h1>
          <p className="text-xl text-muted-foreground text-pretty leading-relaxed">
            Accede a tu cuenta o crea una nueva para comenzar
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/login">
            <Button
              size="lg"
              className="w-full sm:w-auto min-w-[180px] h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-md"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Iniciar Sesión
            </Button>
          </Link>

          <Link href="/register">
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto min-w-[180px] h-12 border-primary/30 hover:bg-accent font-medium bg-transparent"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Registrarse
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}