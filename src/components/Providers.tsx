"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClientProvider } from "@/components/providers/query-client";
import { ThemeProvider } from "@/components/providers/theme";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { PreLoader } from "@/components/ui/Preloader";

/**
 * App-wide providers (Supabase auth context, React Query, theme, tooltips, toasts).
 * No Hercules / Convex.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <QueryClientProvider>
        <ThemeProvider>
          <TooltipProvider delayDuration={0}>
            <PreLoader />
            {children}
            <Toaster position="top-right" richColors closeButton />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export function DefaultProviders({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}
