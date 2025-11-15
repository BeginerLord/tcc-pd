"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-4xl font-bold text-center">404</CardTitle>
          <CardDescription className="text-center text-lg">
            Página no encontrada
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-center text-muted-foreground">
            Lo sentimos, la página que buscas no existe.
          </p>
          <div className="flex gap-2 justify-center">
            <Link href="/dashboard">
              <Button variant="default">
                <Home className="mr-2 h-4 w-4" />
                Ir al Dashboard
              </Button>
            </Link>
            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
