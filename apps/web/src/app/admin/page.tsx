"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { readAccessToken } from "@/lib/auth-client";

interface Stats {
  services: number;
  barbers: number;
  pendingAppointments: number;
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
    ])
      .then(([svcs, barbs, appts]) =>
        setStats({
          services: svcs.filter((s) => s.isActive).length,
          barbers: barbs.filter((b) => b.isActive).length,
          pendingAppointments: appts.filter((a) => a.status === "PENDING").length,
        }),
      )
      .catch(() => setStats(null));
  }, []);

  return (
    <section>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Resumen</h1>
      <p className="mt-2 text-[color:var(--color-fg-muted)]">
        Estado actual de la barbería.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Servicios activos" value={stats?.services ?? "—"} />
        <Stat label="Barberos activos" value={stats?.barbers ?? "—"} />
        <Stat label="Citas pendientes" value={stats?.pendingAppointments ?? "—"} />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--color-fg-muted)]">
        {label}
      </p>
      <p className="mt-3 font-[family-name:var(--font-display)] text-4xl">{value}</p>
    </div>
  );
}
