import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import { getFOUCPreventionScript } from "@/lib/theme";
import "./globals.css";

/**
 * Root layout — requerido por Next.js 16 con <html> y <body>.
 *
 * Responsabilidades mínimas:
 * 1. Proveer el shell HTML para TODAS las rutas (incluido 404, /dev, etc.)
 * 2. Script anti-FOUC para dark mode — debe ejecutarse antes de cualquier CSS
 * 3. Variables CSS de fallback (se sobreescriben por tenant en locale layout)
 * 4. Activar las variables de Google Fonts en el body
 *
 * El lang, theming por tenant y providers van en app/[locale]/layout.tsx
 */
export const metadata: Metadata = {
  title: {
    template: "%s | SPA",
    default: "SPA",
  },
  description: "Plataforma SaaS white-label para SPAs y salones de belleza",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      suppressHydrationWarning // evita mismatch por data-theme aplicado pre-render
    >
      <head>
        {/* Script anti-FOUC: aplica data-theme ANTES del primer render de React */}
        <script
          dangerouslySetInnerHTML={{ __html: getFOUCPreventionScript() }}
        />
      </head>
      <body className={fontVariables}>
        {children}
      </body>
    </html>
  );
}
