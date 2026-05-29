"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { readAccessToken, readUser } from "@/lib/auth-client";
import { can } from "@/lib/permissions";
import type { ClientDetailDto } from "@/lib/types";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const STATUS_LABEL: Record<ClientDetailDto["appointments"][number]["status"], string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No vino",
};

export default function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const me = readUser();
  const { id } = use(params);

  const [client, setClient] = useState<ClientDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (me && !can(me.role, "clients.manage")) {
      router.replace("/admin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    const token = readAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const c = await api.adminGetClient(id, token);
      if (!c) {
        setError("Cliente no encontrado");
        return;
      }
      setClient(c);
      setNotes(c.notes ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function saveNotes() {
    const token = readAccessToken();
    if (!token) return;
    setSavingNotes(true);
    try {
      await api.adminUpdateClientNotes(id, notes, token);
      setSavedAt(new Date().toISOString());
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSavingNotes(false);
    }
  }

  if (loading && !client) {
    return (
      <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
        Cargando…
      </p>
    );
  }
  if (error || !client) {
    return (
      <section>
        <a
          href="/admin/clients"
          className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)] underline-offset-4 transition hover:text-[color:var(--color-fg)] hover:underline"
        >
          ← Clientes
        </a>
        <p className="mt-6 rounded-[var(--radius-md)] border border-[color:var(--color-fg-muted)] bg-[color:var(--color-surface)] px-4 py-3 text-sm">
          {error ?? "No encontrado"}
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-12">
      <header>
        <a
          href="/admin/clients"
          className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)] underline-offset-4 transition hover:text-[color:var(--color-fg)] hover:underline"
        >
          ← Clientes
        </a>
        <h1 className="mt-6 text-4xl font-light tracking-tight sm:text-5xl">
          {client.name}
        </h1>
        <p className="mt-3 text-sm text-[color:var(--color-fg-muted)]">
          {client.email}
          {client.phone && ` · ${client.phone}`}
        </p>
      </header>

      <div className="grid gap-px overflow-hidden border border-[color:var(--color-border)] bg-[color:var(--color-border)] sm:grid-cols-4">
        <Stat label="Citas totales" value={String(client.totalAppointments)} />
        <Stat label="Completadas" value={String(client.completedAppointments)} />
        <Stat label="LTV" value={formatPrice(client.lifetimeCents)} />
        <Stat label="Primera visita" value={formatDate(client.firstVisitAt)} />
      </div>

      <article className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
        <header className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-2xl font-light tracking-tight">Notas internas</h2>
          {savedAt && (
            <span className="text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Guardado · {new Date(savedAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </header>
        <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
          Solo visibles para el staff. Alergias, preferencias, observaciones del barbero.
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Ej. 'Prefiere fade bajo. No le gusta la máquina alta en la nuca.'"
          className="mt-6 w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-sm text-[color:var(--color-fg)] outline-none transition focus:border-[color:var(--color-fg)]"
        />
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={saveNotes}
            disabled={savingNotes}
            className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-fg)] px-5 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--color-bg)] transition hover:opacity-90 disabled:opacity-50"
          >
            {savingNotes ? "Guardando…" : "Guardar notas"}
          </button>
          <span className="text-[0.65rem] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
            {notes.length} / 2000
          </span>
        </div>
      </article>

      <article>
        <h2 className="mb-4 text-2xl font-light tracking-tight">Historial</h2>
        {client.appointments.length === 0 ? (
          <p className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-6 text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
            Aún no hay citas registradas.
          </p>
        ) : (
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-border)]">
            <table className="w-full text-sm">
              <thead className="bg-[color:var(--color-surface)] text-left text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
                <tr>
                  <th className="px-4 py-4">Cuándo</th>
                  <th className="px-4 py-4">Servicio</th>
                  <th className="px-4 py-4">Barbero</th>
                  <th className="px-4 py-4">Precio</th>
                  <th className="px-4 py-4">Estado</th>
                </tr>
              </thead>
              <tbody>
                {client.appointments.map((a) => (
                  <tr
                    key={a.id}
                    className="border-t border-[color:var(--color-border)]"
                  >
                    <td className="px-4 py-4 text-[color:var(--color-fg-muted)]">
                      {formatDateTime(a.startsAt)}
                    </td>
                    <td className="px-4 py-4">{a.serviceName}</td>
                    <td className="px-4 py-4 text-[color:var(--color-fg-muted)]">
                      {a.barberName}
                    </td>
                    <td className="px-4 py-4 text-[color:var(--color-fg-muted)]">
                      {formatPrice(a.priceCents)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-block rounded-full border border-[color:var(--color-fg-muted)] px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.18em] text-[color:var(--color-fg)]">
                        {STATUS_LABEL[a.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[color:var(--color-bg)] p-6">
      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-light tracking-tight">{value}</p>
    </div>
  );
}
