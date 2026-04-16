"use client";

/**
 * Hook para verificar programáticamente si un feature flag del tenant está activo.
 * Re-exporta desde FeatureGuard para un import consistente.
 *
 * @example
 * const hasSolar = useFeature("feature_solar");
 * if (!hasSolar) return null;
 */
export { useFeature } from "@/components/tenant/FeatureGuard";
