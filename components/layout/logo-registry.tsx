import type { JSX } from "react";
import { FmGlowLogo } from "@/components/ui/FmGlowLogo";

type LogoProps = { size?: number };

/**
 * Mapa de tenant slug → componente React logo.
 * Usado por TopBar cuando el tenant no tiene logo_url pero sí un componente inline.
 * Añadir aquí logos de nuevos tenants sin tocar TopBar.
 */
export const LOGO_REGISTRY: Record<string, (props: LogoProps) => JSX.Element> = {
  "fm-glow-studio": (props) => <FmGlowLogo variant="isotipo" {...props} />,
};
