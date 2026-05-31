"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { readAccessToken } from "@/lib/auth-client";
import { Stat } from "@/components/admin/ui";
import { formatPrice } from "@/lib/format";

interface Stats {
  services: number;
  barbers: number;
  staff: number;
  pendingAppointments: number;
  todayAppointments: number;
  clients: number;
  lifetimeCents: number;
  completionRate: number;
}

export default function AdminHome() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const token = readAccessToken();
    if (!token) return;
    Promise.all([
      api.adminListServices(token),
      api.adminListBarbers(token),
      api.adminListAppointments(token),
      api.adminListClients(token),
      api.adminListStaff(token),
    ])
      .then(([svcs, barbs, appts, clients, staff]) => {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);
        const todayMs = todayStart.getTime();
        const tomorrowMs = todayEnd.getTime();
        const totalNonCancelled = appts.filter((a) => a.status !== "CANCELLED").length;
        const completed = appts.filter((a) => a.status === "COMPLETED").length;
        setStats({
          services: svcs.filter((s) => s.isActive).length,
          barbers: barbs.filter((b) => b.isActive).length,
          staff: staff.filter((s) => s.isActive).length,
          pendingAppointments: appts.filter((a) => a.status === "PENDING").length,
          todayAppointments: appts.filter((a) => {
            const t = new Date(a.startsAt).getTime();
            return t >= todayMs && t < tomorrowMs && a.status !== "CANCELLED";
          }).length,
          clients: clients.length,
          lifetimeCents: clients.reduce((acc, c) => acc + c.lifetimeCents, 0),
          completionRate:
            totalNonCancelled === 0
              ? 0
              : Math.round((completed / totalNonCancelled) * 100),
        });
      })
      .catch(() => setStats(null));
  }, []);

  return (
    <section>
      <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
        — Panel —
      </p>
      <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">
        Resumen
      </h1>
      <p className="mt-3 text-[color:var(--color-fg-muted)]">
        Estado actual de Brothers Club.
      </p>

      {/* Hoy */}
      <h2 className="mt-12 mb-4 text-[0.65rem] uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
        — Hoy —
      </h2>
      <div className="grid gap-px overflow-hidden border border-[color:var(--color-border)] bg-[color:var(--color-border)] sm:grid-cols-3">
        <Stat size="lg" label="Citas de hoy" value={stats?.todayAppointments ?? "—"} />
        <Stat size="lg" label="Pendientes confirmar" value={stats?.pendingAppointments ?? "—"} />
        <Stat size="lg" label="% Completadas (histórico)" value={stats ? `${stats.completionRate}%` : "—"} />
      </div>

      {/* Equipo */}
      <h2 className="mt-12 mb-4 text-[0.65rem] uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
        — Equipo —
      </h2>
      <div className="grid gap-px overflow-hidden border border-[color:var(--color-border)] bg-[color:var(--color-border)] sm:grid-cols-3">
        <Stat size="lg" label="Servicios activos" value={stats?.services ?? "—"} />
        <Stat size="lg" label="Barberos activos" value={stats?.barbers ?? "—"} />
        <Stat size="lg" label="Miembros staff" value={stats?.staff ?? "—"} />
      </div>

      {/* Clientes */}
      <h2 className="mt-12 mb-4 text-[0.65rem] uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
        — Clientes —
      </h2>
      <div className="grid gap-px overflow-hidden border border-[color:var(--color-border)] bg-[color:var(--color-border)] sm:grid-cols-2">
        <Stat size="lg" label="Clientes registrados" value={stats?.clients ?? "—"} />
        <Stat size="lg" label="Facturación histórica" value={stats ? formatPrice(stats.lifetimeCents) : "—"} />
      </div>
    </section>
  );
}

// Stat se importa de @/components/admin/ui (con size="lg" para este resumen).
// formatPrice local porque usa toLocaleString con maximumFractionDigits — el
// helper de @/lib/format usa el default. Es OK leve divergencia.
