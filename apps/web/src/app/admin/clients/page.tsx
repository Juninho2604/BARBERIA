"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { readAccessToken, readUser } from "@/lib/auth-client";
import { can } from "@/lib/permissions";
import type { ClientSummaryDto } from "@/lib/types";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminClientsPage() {
  const router = useRouter();
  const me = readUser();
  const [clients, setClients] = useState<ClientSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

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
      const list = await api.adminListClients(token);
      setClients(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q),
    );
  }, [clients, search]);

  const totals = useMemo(() => {
    return clients.reduce(
      (acc, c) => {
        acc.totalAppts += c.totalAppointments;
        acc.lifetimeCents += c.lifetimeCents;
        return acc;
      },
      { totalAppts: 0, lifetimeCents: 0 },
    );
  }, [clients]);

  return (
    <section>
      <header>
        <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
          — Personas —
        </p>
        <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">
          Clientes
        </h1>
        <p className="mt-3 text-[color:var(--color-fg-muted)]">
          Todos los que reservaron alguna vez. Click en un cliente para ver su
          historial completo y notas.
        </p>
      </header>

      <div className="mt-10 grid gap-px overflow-hidden border border-[color:var(--color-border)] bg-[color:var(--color-border)] sm:grid-cols-3">
        <Stat label="Clientes registrados" value={String(clients.length)} />
        <Stat label="Citas totales" value={String(totals.totalAppts)} />
        <Stat label="LTV agregado" value={formatPrice(totals.lifetimeCents)} />
      </div>

      <div className="mt-10">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, email o teléfono…"
          className="w-full max-w-md rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm text-[color:var(--color-fg)] outline-none transition focus:border-[color:var(--color-fg)]"
        />
      </div>

      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-[color:var(--color-fg-muted)] bg-[color:var(--color-surface)] px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div className="mt-8 overflow-x-auto rounded-[var(--radius-md)] border border-[color:var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--color-surface)] text-left text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
            <tr>
              <th className="px-4 py-4">Cliente</th>
              <th className="px-4 py-4">Contacto</th>
              <th className="px-4 py-4">Citas</th>
              <th className="px-4 py-4">LTV</th>
              <th className="px-4 py-4">Última visita</th>
              <th className="px-4 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading && clients.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
                  Cargando…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
                  {search ? "Sin resultados." : "Aún no hay clientes."}
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-[color:var(--color-border)]"
                >
                  <td className="px-4 py-4">
                    <p className="text-[color:var(--color-fg)]">{c.name}</p>
                    {c.notes && (
                      <p className="mt-1 line-clamp-1 text-[0.65rem] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
                        · Tiene notas
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-4 text-[color:var(--color-fg-muted)]">
                    <p>{c.email}</p>
                    {c.phone && <p className="mt-0.5 text-xs">{c.phone}</p>}
                  </td>
                  <td className="px-4 py-4 text-[color:var(--color-fg-muted)]">
                    {c.completedAppointments} / {c.totalAppointments}
                  </td>
                  <td className="px-4 py-4 text-[color:var(--color-fg)]">
                    {formatPrice(c.lifetimeCents)}
                  </td>
                  <td className="px-4 py-4 text-[color:var(--color-fg-muted)]">
                    {formatDate(c.lastVisitAt)}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <a
                      href={`/admin/clients/${encodeURIComponent(c.id)}`}
                      className="text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)] underline-offset-4 transition hover:text-[color:var(--color-fg)] hover:underline"
                    >
                      Ver ficha →
                    </a>
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
