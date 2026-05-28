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
      <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
        — Panel —
      </p>
      <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">
        Resumen
      </h1>
      <p className="mt-3 text-[color:var(--color-fg-muted)]">
        Estado actual de Brothers Club.
      </p>

      <div className="mt-12 grid gap-px overflow-hidden border border-[color:var(--color-border)] bg-[color:var(--color-border)] sm:grid-cols-3">
        <Stat label="Servicios activos" value={stats?.services ?? "—"} />
        <Stat label="Barberos activos" value={stats?.barbers ?? "—"} />
        <Stat label="Citas pendientes" value={stats?.pendingAppointments ?? "—"} />
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-[color:var(--color-bg)] p-8">
      <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
        {label}
      </p>
      <p className="mt-4 text-5xl font-light tracking-tight">{value}</p>
    </div>
  );
}
