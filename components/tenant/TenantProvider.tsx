"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Tenant } from "@/lib/supabase/types";

const TenantContext = createContext<Tenant | null>(null);

interface TenantProviderProps {
  tenant: Tenant | null;
  children: ReactNode;
}

/**
 * Inyecta la configuración del tenant en el contexto de React
 * y aplica las CSS custom properties en el elemento raíz.
 *
 * Las CSS vars ya se inyectan vía <style> en el Server Component del layout,
 * aquí solo exponemos el tenant al árbol de componentes cliente.
 */
export function TenantProvider({ tenant, children }: TenantProviderProps) {
  return (
    <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>
  );
}

/** Hook para leer la config del tenant en Client Components */
export function useTenant(): Tenant | null {
  return useContext(TenantContext);
}
