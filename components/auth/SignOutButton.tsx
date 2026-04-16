"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface SignOutButtonProps {
  locale: string;
  className?: string;
}

/**
 * Botón de cerrar sesión.
 * Llama a supabase.auth.signOut() y redirige al login.
 */
export function SignOutButton({ locale, className }: SignOutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    setLoading(true);
    await supabase.auth.signOut();
    router.push(`/${locale}/auth/login`);
    router.refresh();
  }

  return (
    <button
      id="signout-btn"
      onClick={handleSignOut}
      disabled={loading}
      className={cn(
        "flex items-center gap-2 rounded-xl border border-red-500/20 px-4 py-2.5",
        "text-sm font-medium text-red-500 transition-all duration-200",
        "hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-red-300 border-t-red-500" />
      ) : (
        <LogOut size={15} />
      )}
      Cerrar sesión
    </button>
  );
}
