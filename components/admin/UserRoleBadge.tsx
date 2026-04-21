import { Crown, Scissors, Headphones, User } from "lucide-react";
import type { UserRole } from "@/lib/supabase/types";

interface UserRoleBadgeProps {
  role: UserRole;
  locale?: string;
}

const ROLE_META: Record<UserRole, { icon: typeof Crown; color: string; es: string; en: string }> = {
  admin: {
    icon: Crown,
    color: "text-amber-600 bg-amber-500/10 border-amber-500/30",
    es: "Dueña",
    en: "Owner",
  },
  trabajadora: {
    icon: Scissors,
    color: "text-violet-600 bg-violet-500/10 border-violet-500/30",
    es: "Trabajadora",
    en: "Worker",
  },
  recepcionista: {
    icon: Headphones,
    color: "text-blue-600 bg-blue-500/10 border-blue-500/30",
    es: "Recepcionista",
    en: "Receptionist",
  },
  cliente: {
    icon: User,
    color: "text-slate-500 bg-slate-500/10 border-slate-500/20",
    es: "Cliente",
    en: "Client",
  },
};

export function UserRoleBadge({ role, locale = "es" }: UserRoleBadgeProps) {
  const meta = ROLE_META[role];
  const Icon = meta.icon;
  const label = locale === "es" ? meta.es : meta.en;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.color}`}
    >
      <Icon size={10} />
      {label}
    </span>
  );
}
