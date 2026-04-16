import { redirect } from "next/navigation";
import { routing } from "@/i18n/routing";

/**
 * Ruta raíz — redirige al locale por defecto.
 * next-intl maneja todas las rutas bajo /[locale]/
 * Esta página actúa de fallback si alguien llega a "/"
 */
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
