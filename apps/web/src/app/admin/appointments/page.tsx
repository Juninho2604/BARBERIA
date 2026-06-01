"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { readAccessToken } from "@/lib/auth-client";
import { useConfirm } from "@/components/ui/confirm-provider";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { AppointmentDto } from "@/lib/types";

const STATUS_LABEL: Record<AppointmentDto["status"], string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No vino",
};

export default function AdminAppointments() {
  const confirm = useConfirm();
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
    const ok = await confirm({
      title: "¿Cancelar esta cita?",
      description: "El cliente recibirá el slot como liberado.",
      confirmLabel: "Cancelar cita",
      cancelLabel: "Volver",
      destructive: true,
    });
    if (!ok) return;
    const token = readAccessToken();
    if (!token) return;
    try {
      await api.cancelAppointment(id, token);
      toast.success("Cita cancelada");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cancelar");
    }
  }

  return (
    <section>
      <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
        — Agenda —
      </p>
      <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">Citas</h1>
      <p className="mt-3 text-[color:var(--color-fg-muted)]">
        Todas las reservas, ordenadas por fecha.
      </p>

      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-[color:var(--color-fg-muted)] bg-[color:var(--color-surface)] px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div className="mt-10 overflow-x-auto rounded-[var(--radius-md)] border border-[color:var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--color-surface)] text-left text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
            <tr>
              <th className="px-4 py-4">Cuándo</th>
              <th className="px-4 py-4">Cliente</th>
              <th className="px-4 py-4">Servicio</th>
              <th className="px-4 py-4">Barbero</th>
              <th className="px-4 py-4">Estado</th>
              <th className="px-4 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading && appts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
                  Cargando…
                </td>
              </tr>
            ) : appts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
                  Aún no hay reservas.
                </td>
              </tr>
            ) : (
              appts.map((a) => (
                <tr
                  key={a.id}
                  className="border-t border-[color:var(--color-border)]"
                >
                  <td className="px-4 py-4">{formatDateTime(a.startsAt)}</td>
                  <td className="px-4 py-4">
                    {a.client?.name ?? "—"}
                    {a.client?.phone && (
                      <p className="mt-1 text-xs text-[color:var(--color-fg-muted)]">
                        {a.client.phone}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {a.service?.name ?? "—"}
                    {a.service && (
                      <p className="mt-1 text-xs text-[color:var(--color-fg-muted)]">
                        {formatPrice(a.service.priceCents)}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-[color:var(--color-fg-muted)]">{a.barber?.name ?? "—"}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-block rounded-full border px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.18em] ${
                        a.status === "CANCELLED"
                          ? "border-[color:var(--color-border)] text-[color:var(--color-fg-muted)]"
                          : "border-[color:var(--color-fg-muted)] text-[color:var(--color-fg)]"
                      }`}
                    >
                      {STATUS_LABEL[a.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    {a.status !== "CANCELLED" && (
                      <button
                        type="button"
                        onClick={() => onCancel(a.id)}
                        className="text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)] underline-offset-4 transition hover:text-[color:var(--color-fg)] hover:underline"
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
