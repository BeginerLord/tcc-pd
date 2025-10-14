import { RegisterForm } from "@/components/register-form"

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-accent/10 to-secondary/10">
      <div className="w-full max-w-md">
        <RegisterForm />
      </div>
    </main>
  )
}
