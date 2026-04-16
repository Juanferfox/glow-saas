"use client";

import type { ReactNode } from "react";
import type { FeatureFlag } from "@/lib/supabase/types";
import { useTenant } from "./TenantProvider";

interface FeatureGuardProps {
  /** Feature flag a verificar */
  feature: FeatureFlag;
  /** Contenido a mostrar si el feature está activo */
  children: ReactNode;
  /** Contenido alternativo si el feature no está activo (opcional) */
  fallback?: ReactNode;
}

/**
 * HOC que renderiza children solo si el feature flag del tenant está activado.
 *
 * @example
 * <FeatureGuard feature="feature_solar">
 *   <SolarBookingModule />
 * </FeatureGuard>
 */
export function FeatureGuard({
  feature,
  children,
  fallback = null,
}: FeatureGuardProps) {
  const tenant = useTenant();

  // Sin tenant (error de carga), no mostrar nada
  if (!tenant) return null;

  // Verificar el feature flag
  if (!tenant[feature]) return <>{fallback}</>;

  return <>{children}</>;
}

/**
 * Hook para verificar programáticamente si un feature está activo.
 */
export function useFeature(feature: FeatureFlag): boolean {
  const tenant = useTenant();
  if (!tenant) return false;
  return tenant[feature];
}
