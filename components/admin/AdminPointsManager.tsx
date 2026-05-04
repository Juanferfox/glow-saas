"use client";

import { useEffect, useState, useCallback } from "react";
import { Minus, Plus, History } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserPoints {
  id: string;
  full_name: string;
  email: string;
  points: number;
  role: string;
}

export function AdminPointsManager() {
  const [users, setUsers] = useState<UserPoints[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalUser, setModalUser] = useState<UserPoints | null>(null);
  const [delta, setDelta] = useState<number>(0);
  const [reason, setReason] = useState("");
  const [actionType, setActionType] = useState<"add" | "remove">("add");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/puntos");
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  function openModal(user: UserPoints, type: "add" | "remove") {
    setModalUser(user);
    setActionType(type);
    setDelta(0);
    setReason("");
    setFeedback(null);
  }

  async function handleSave() {
    if (!modalUser || delta <= 0) return;
    setSubmitting(true);
    setFeedback(null);

    const res = await fetch("/api/admin/puntos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: modalUser.id,
        delta: actionType === "add" ? delta : -delta,
        reason,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setFeedback(data.error || "Error al ajustar puntos");
      return;
    }

    const label = actionType === "add" ? "otorgaron" : "quitaron";
    setFeedback(`Se ${label} ${delta} puntos a ${modalUser.full_name}`);
    fetchUsers();
    setTimeout(() => setModalUser(null), 1500);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-border)] border-t-[var(--brand-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold uppercase tracking-widest opacity-40" style={{ color: "var(--brand-text)" }}>
        Saldo de puntos
      </h3>

      <div className="overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)]">
        {users.map((u, i) => (
          <div
            key={u.id}
            className={cn(
              "flex items-center justify-between px-4 py-3",
              i < users.length - 1 && "border-b border-[var(--brand-border)]"
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold" style={{ color: "var(--brand-text)" }}>
                {u.full_name}
              </p>
              <p className="text-xs opacity-50" style={{ color: "var(--brand-text)" }}>
                {u.email} · {u.role}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold" style={{ color: "var(--brand-primary)" }}>
                {u.points} pts
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => openModal(u, "remove")}
                  className="rounded-lg p-1.5 text-red-400 opacity-50 hover:opacity-100 hover:bg-red-500/10"
                >
                  <Minus size={14} />
                </button>
                <button
                  onClick={() => openModal(u, "add")}
                  className="rounded-lg p-1.5 text-green-500 opacity-50 hover:opacity-100 hover:bg-green-500/10"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-2xl">
            <h3 className="mb-1 text-lg font-bold" style={{ color: "var(--brand-text)", fontFamily: "var(--font-heading)" }}>
              {actionType === "add" ? "Otorgar puntos" : "Quitar puntos"}
            </h3>
            <p className="mb-4 text-sm opacity-50" style={{ color: "var(--brand-text)" }}>
              {modalUser.full_name} · Saldo actual: {modalUser.points} pts
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-50" style={{ color: "var(--brand-text)" }}>
                  Cantidad de puntos
                </label>
                <input
                  type="number"
                  min={1}
                  value={delta || ""}
                  onChange={(e) => setDelta(Number(e.target.value))}
                  className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] px-3 py-2 text-sm text-[var(--brand-text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 opacity-50" style={{ color: "var(--brand-text)" }}>
                  Razón / Nota
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej. Bonificación por referido"
                  required
                  className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] px-3 py-2 text-sm text-[var(--brand-text)] placeholder:opacity-40 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                />
              </div>
            </div>

            {feedback && (
              <p className={cn(
                "mt-3 rounded-xl px-3 py-2 text-xs",
                feedback.includes("Error") || feedback.includes("negativo")
                  ? "bg-red-500/10 text-red-500"
                  : "bg-green-500/10 text-green-600"
              )}>
                {feedback}
              </p>
            )}

            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setModalUser(null)}
                className="flex-1 rounded-xl border border-[var(--brand-border)] py-2 text-sm font-medium opacity-60 hover:opacity-100"
                style={{ color: "var(--brand-text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={submitting || delta <= 0 || !reason}
                className={cn(
                  "flex-1 rounded-xl py-2 text-sm font-semibold text-white transition-opacity",
                  actionType === "add" ? "bg-green-600" : "bg-red-600",
                  "hover:opacity-90 disabled:opacity-50"
                )}
              >
                {submitting ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
