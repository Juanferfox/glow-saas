/**
 * Layout para rutas /dev — solo en desarrollo.
 * El root layout ya provee <html> y <body>,
 * aquí solo aplicamos estilos mínimos sin spa-layout.
 */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
