"use client";

/**
 * Hook para leer la configuración del tenant actual en Client Components.
 * Re-exporta el hook de TenantProvider para que los componentes
 * puedan importarlo desde un lugar consistente.
 *
 * @example
 * const tenant = useTenant();
 * if (!tenant) return null;
 * return <p>{tenant.name}</p>;
 */
export { useTenant } from "@/components/tenant/TenantProvider";
