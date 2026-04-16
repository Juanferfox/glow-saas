"use client";

import { useEffect } from "react";

interface LocaleAttributesSetterProps {
  locale: string;
  fontBody: string;
}

/**
 * Componente cliente que aplica atributos al elemento <html> root.
 *
 * Necesario porque el root layout no tiene acceso al locale dinámico,
 * y el locale layout no puede renderizar un segundo <html>.
 *
 * Aplica:
 * - `lang` correcto al <html> según el locale activo
 * - `style.fontFamily` al <body> según la fuente del tenant
 */
export function LocaleAttributesSetter({
  locale,
  fontBody,
}: LocaleAttributesSetterProps) {
  useEffect(() => {
    // Actualizar lang del documento
    document.documentElement.lang = locale;
    // Aplicar fuente del tenant al body
    document.body.style.fontFamily = fontBody;
  }, [locale, fontBody]);

  return null;
}
