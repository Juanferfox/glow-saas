"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Users, Search, Plus, Mail, ChevronDown,
  Trash2, MoreHorizontal, Crown, Scissors,
  Headphones, User, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRoleBadge } from "./UserRoleBadge";
import type { ProfileWithEmail } from "@/lib/data/users";
import type { UserRole } from "@/lib/supabase/types";

interface UserManagementProps {
  users: ProfileWithEmail[];
  locale?: string;
}

const ROLES: { value: UserRole; icon: typeof Crown; es: string; en: string }[] = [
  { value: "admin",        icon: Crown,      es: "Dueña",          en: "Owner" },
  { value: "trabajadora",  icon: Scissors,   es: "Trabajadora",    en: "Worker" },
  { value: "recepcionista",icon: Headphones, es: "Recepcionista",  en: "Receptionist" },
  { value: "cliente",      icon: User,       es: "Cliente",        en: "Client" },
];

export function UserManagement({ users: initialUsers, locale = "es" }: UserManagementProps) {
  const isES = locale === "es";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteData, setInviteData] = useState({ email: "", fullName: "", role: "trabajadora" as UserRole });
  const [inviteStatus, setInviteStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [inviteError, setInviteError] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const filteredUsers = initialUsers.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (u.full_name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q);
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const counts: Record<string, number> = { all: initialUsers.length };
  for (const r of ROLES) {
    counts[r.value] = initialUsers.filter((u) => u.role === r.value).length;
  }

  async function handleInvite() {
    if (!inviteData.email || !inviteData.fullName) return;
    setInviteStatus("loading");
    setInviteError("");

    try {
      const res = await fetch("/api/admin/usuarios/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteData),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error ?? "Error al invitar");
      setInviteStatus("success");
      setInviteData({ email: "", fullName: "", role: "trabajadora" });
      setTimeout(() => { setInviteStatus("idle"); setShowInviteForm(false); }, 2000);
      startTransition(() => router.refresh());
    } catch (e) {
      setInviteStatus("error");
      setInviteError(String(e));
    }
  }

  async function handleDeactivate(userId: string) {
    if (!confirm(isES ? "¿Desactivar este usuario? Su rol cambiará a Cliente." : "Deactivate this user? Their role will change to Client.")) return;
    await fetch("/api/admin/usuarios/deactivate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setOpenMenuId(null);
    startTransition(() => router.refresh());
  }

  async function handleChangeRole(userId: string, newRole: UserRole) {
    await fetch("/api/admin/usuarios/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    setOpenMenuId(null);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      {/* Barra de herramientas */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          {/* Búsqueda */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 opacity-40" style={{ color: "var(--brand-text)" }} />
            <input
              type="text"
              placeholder={isES ? "Buscar..." : "Search..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-lg border border-[var(--brand-border)] bg-transparent pl-8 pr-3 text-sm outline-none focus:border-[var(--brand-primary)]"
              style={{ color: "var(--brand-text)" }}
            />
          </div>

          {/* Filtro por rol */}
          <div className="flex flex-wrap gap-1">
            {["all", ...ROLES.map((r) => r.value)].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r as UserRole | "all")}
                className={cn(
                  "rounded-lg border px-2 py-1 text-xs font-medium transition-colors",
                  roleFilter === r
                    ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
                    : "border-[var(--brand-border)] opacity-60 hover:opacity-100"
                )}
                style={{ color: roleFilter === r ? undefined : "var(--brand-text)" }}
              >
                {r === "all" ? (isES ? "Todos" : "All") : (isES ? ROLES.find((x) => x.value === r)?.es : ROLES.find((x) => x.value === r)?.en)}
                <span className="ml-1 opacity-60">({counts[r] ?? 0})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Botón de invitar */}
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:opacity-90"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          <Plus size={14} />
          {isES ? "Invitar usuario" : "Invite user"}
        </button>
      </div>

      {/* Formulario de invitación */}
      {showInviteForm && (
        <div
          className="rounded-xl border border-[var(--brand-border)] p-4 space-y-3"
          style={{ backgroundColor: "var(--brand-surface)" }}
        >
          <h3 className="text-sm font-semibold" style={{ color: "var(--brand-text)" }}>
            {isES ? "Invitar nuevo usuario" : "Invite new user"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="text"
              placeholder={isES ? "Nombre completo" : "Full name"}
              value={inviteData.fullName}
              onChange={(e) => setInviteData((d) => ({ ...d, fullName: e.target.value }))}
              className="h-9 rounded-lg border border-[var(--brand-border)] bg-transparent px-3 text-sm outline-none focus:border-[var(--brand-primary)]"
              style={{ color: "var(--brand-text)" }}
            />
            <input
              type="email"
              placeholder={isES ? "Correo electrónico" : "Email address"}
              value={inviteData.email}
              onChange={(e) => setInviteData((d) => ({ ...d, email: e.target.value }))}
              className="h-9 rounded-lg border border-[var(--brand-border)] bg-transparent px-3 text-sm outline-none focus:border-[var(--brand-primary)]"
              style={{ color: "var(--brand-text)" }}
            />
            <select
              value={inviteData.role}
              onChange={(e) => setInviteData((d) => ({ ...d, role: e.target.value as UserRole }))}
              className="h-9 rounded-lg border border-[var(--brand-border)] bg-transparent px-3 text-sm outline-none focus:border-[var(--brand-primary)]"
              style={{ color: "var(--brand-text)" }}
            >
              {ROLES.filter((r) => r.value !== "cliente").map((r) => (
                <option key={r.value} value={r.value}>
                  {isES ? r.es : r.en}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleInvite}
              disabled={inviteStatus === "loading" || !inviteData.email || !inviteData.fullName}
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: "var(--brand-primary)" }}
            >
              {inviteStatus === "loading" ? (
                <span className="animate-spin">⟳</span>
              ) : inviteStatus === "success" ? (
                <CheckCircle2 size={13} />
              ) : (
                <Mail size={13} />
              )}
              {inviteStatus === "success"
                ? (isES ? "¡Invitación enviada!" : "Invitation sent!")
                : (isES ? "Enviar invitación" : "Send invitation")}
            </button>
            <button
              onClick={() => setShowInviteForm(false)}
              className="text-xs opacity-50 hover:opacity-80"
              style={{ color: "var(--brand-text)" }}
            >
              {isES ? "Cancelar" : "Cancel"}
            </button>
            {inviteStatus === "error" && (
              <p className="text-xs text-red-500">{inviteError}</p>
            )}
          </div>
        </div>
      )}

      {/* Lista de usuarios */}
      <div
        className="overflow-hidden rounded-xl border border-[var(--brand-border)]"
        style={{ backgroundColor: "var(--brand-surface)" }}
      >
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Users size={32} className="opacity-20" style={{ color: "var(--brand-text)" }} />
            <p className="text-sm opacity-40" style={{ color: "var(--brand-text)" }}>
              {isES ? "No hay usuarios" : "No users found"}
            </p>
          </div>
        ) : (
          <div>
            {filteredUsers.map((user, i) => (
              <div
                key={user.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  i > 0 && "border-t border-[var(--brand-border)]"
                )}
              >
                {/* Avatar */}
                <div
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: "var(--brand-primary)" }}
                >
                  {(user.full_name ?? "?").charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium" style={{ color: "var(--brand-text)" }}>
                      {user.full_name ?? (isES ? "Sin nombre" : "No name")}
                    </span>
                    <UserRoleBadge role={user.role} locale={locale} />
                  </div>
                  {user.email && (
                    <span className="truncate text-xs opacity-50" style={{ color: "var(--brand-text)" }}>
                      {user.email}
                    </span>
                  )}
                  {user.specialist_name && (
                    <span className="text-xs opacity-40" style={{ color: "var(--brand-text)" }}>
                      ✂ {user.specialist_name}
                    </span>
                  )}
                </div>

                {/* Puntos (si es cliente) */}
                {user.role === "cliente" && user.loyalty_points > 0 && (
                  <span className="flex-shrink-0 text-xs opacity-50" style={{ color: "var(--brand-text)" }}>
                    ★ {user.loyalty_points}
                  </span>
                )}

                {/* Menú de acciones */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--brand-border)] hover:bg-[var(--brand-border)] transition-colors"
                    style={{ color: "var(--brand-text)" }}
                    aria-label={isES ? "Opciones" : "Options"}
                  >
                    <MoreHorizontal size={14} />
                  </button>

                  {openMenuId === user.id && (
                    <>
                      {/* Overlay para cerrar */}
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                      <div
                        className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-[var(--brand-border)] shadow-lg"
                        style={{ backgroundColor: "var(--brand-bg)" }}
                      >
                        {/* Cambiar rol */}
                        <div className="border-b border-[var(--brand-border)] px-3 py-1.5">
                          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-40" style={{ color: "var(--brand-text)" }}>
                            {isES ? "Cambiar rol" : "Change role"}
                          </p>
                        </div>
                        {ROLES.filter((r) => r.value !== user.role).map((r) => {
                          const Icon = r.icon;
                          return (
                            <button
                              key={r.value}
                              onClick={() => handleChangeRole(user.id, r.value)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-[var(--brand-surface)]"
                              style={{ color: "var(--brand-text)" }}
                            >
                              <Icon size={12} />
                              {isES ? r.es : r.en}
                            </button>
                          );
                        })}

                        {/* Desactivar */}
                        {user.role !== "cliente" && (
                          <>
                            <div className="border-t border-[var(--brand-border)]" />
                            <button
                              onClick={() => handleDeactivate(user.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-500 transition-colors hover:bg-red-500/10"
                            >
                              <Trash2 size={12} />
                              {isES ? "Desactivar usuario" : "Deactivate user"}
                            </button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
