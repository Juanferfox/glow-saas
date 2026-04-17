import { ReactNode } from "react";
import { Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: string[];
  fallback?: ReactNode;
}

/**
 * Guard para proteger componentes basados en roles de usuario.
 * (MOCK: por ahora asume que el usuario es admin si tiene sesión).
 */
export async function RoleGuard({ children, allowedRoles, fallback }: RoleGuardProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. En entorno real, consultaríamos la tabla `profiles` o `user_roles`.
  // 2. Para este demo, asumimos que todos los usuarios autenticados en el admin son 'admin'.
  const userRole = user ? "admin" : "guest";

  if (!allowedRoles.includes(userRole)) {
    return fallback || (
      <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-[var(--brand-border)] bg-zinc-500/5 p-12 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-500/10 opacity-30">
          <Lock size={20} />
        </div>
        <h4 className="text-sm font-bold opacity-40">Acceso Restringido</h4>
        <p className="max-w-[200px] text-[10px] opacity-30 mt-1">Tu perfil actual no tiene permisos para ver este módulo.</p>
      </div>
    );
  }

  return <>{children}</>;
}
