"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

/**
 * Provider de TanStack Query para toda la aplicación
 */
export function QueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Configuración por defecto para todas las queries
                        staleTime: 60 * 1000, // 1 minuto
                        gcTime: 5 * 60 * 1000, // 5 minutos (antes cacheTime)
                        retry: 1,
                        refetchOnWindowFocus: false,
                    },
                    mutations: {
                        // Configuración por defecto para todas las mutations
                        retry: 0,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
