"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { readAccessToken } from "@/lib/auth-client";
import type { AppointmentDto } from "@/lib/types";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Caracas",
  });
}

const STATUS_LABEL: Record<AppointmentDto["status"], string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No vino",
};

export default function AdminAppointments() {
  const [appts, setAppts] = useState<AppointmentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const token = readAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      setAppts(await api.adminListAppointments(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onCancel(id: string) {
    if (!confirm("¿Cancelar esta cita?")) return;
    const token = readAccessToken();
    if (!token) return;
    try {
      await api.cancelAppointment(id, token);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <section>
      <h1 className="font-[family-name:var(--font-display)] text-3xl">Citas</h1>
      <p className="mt-2 text-[color:var(--color-fg-muted)]">
        Todas las reservas, ordenadas por fecha.
      </p>

      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div className="mt-8 overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--color-surface)] text-left text-xs uppercase tracking-[0.15em] text-[color:var(--color-fg-muted)]">
            <tr>
              <th className="px-4 py-3">Cuándo</th>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Servicio</th>
              <th className="px-4 py-3">Barbero</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && appts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[color:var(--color-fg-muted)]">
                  Cargando…
                </td>
              </tr>
            ) : appts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[color:var(--color-fg-muted)]">
                  Aún no hay reservas.
                </td>
              </tr>
            ) : (
              appts.map((a) => (
                <tr
                  key={a.id}
                  className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]"
                >
                  <td className="px-4 py-3">{formatDateTime(a.startsAt)}</td>
                  <td className="px-4 py-3">
                    {a.client?.name ?? "—"}
                    {a.client?.phone && (
                      <p className="text-xs text-[color:var(--color-fg-muted)]">
                        {a.client.phone}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {a.service?.name ?? "—"}
                    {a.service && (
                      <p className="text-xs text-[color:var(--color-fg-muted)]">
                        {formatPrice(a.service.priceCents)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">{a.barber?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        a.status === "CANCELLED"
                          ? "bg-[color:var(--color-border)] text-[color:var(--color-fg-muted)]"
                          : a.status === "COMPLETED"
                            ? "bg-green-500/20 text-green-300"
                            : "bg-[color:var(--color-accent)]/20 text-[color:var(--color-accent)]"
                      }`}
                    >
                      {STATUS_LABEL[a.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {a.status !== "CANCELLED" && (
                      <button
                        type="button"
                        onClick={() => onCancel(a.id)}
                        className="text-xs text-[color:var(--color-fg-muted)] hover:text-red-500"
                      >
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
