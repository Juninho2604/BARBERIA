"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { readAccessToken } from "@/lib/auth-client";
import type { ServiceDto } from "@/lib/types";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminServices() {
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const token = readAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const list = await api.adminListServices(token);
      setServices(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onDelete(id: string) {
    if (!confirm("¿Desactivar este servicio?")) return;
    const token = readAccessToken();
    if (!token) return;
    try {
      await api.deleteService(id, token);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <section>
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">Servicios</h1>
          <p className="mt-2 text-[color:var(--color-fg-muted)]">
            Catálogo completo. Inactivos no aparecen en la web pública.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-[var(--radius-md)] bg-[color:var(--color-accent)] px-4 py-2 text-sm font-medium text-[color:var(--color-accent-fg)] transition hover:brightness-110"
        >
          {showForm ? "Cancelar" : "+ Nuevo"}
        </button>
      </header>

      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      {showForm && (
        <NewServiceForm
          onCreated={async () => {
            setShowForm(false);
            await refresh();
          }}
        />
      )}

      <div className="mt-8 overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--color-surface)] text-left text-xs uppercase tracking-[0.15em] text-[color:var(--color-fg-muted)]">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Duración</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && services.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[color:var(--color-fg-muted)]">
                  Cargando…
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[color:var(--color-fg-muted)]">
                  Sin servicios todavía.
                </td>
              </tr>
            ) : (
              services.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)]"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{s.name}</p>
                    {s.description && (
                      <p className="text-xs text-[color:var(--color-fg-muted)]">
                        {s.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">{s.durationMinutes} min</td>
                  <td className="px-4 py-3">{formatPrice(s.priceCents)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        s.isActive
                          ? "bg-[color:var(--color-accent)]/20 text-[color:var(--color-accent)]"
                          : "bg-[color:var(--color-border)] text-[color:var(--color-fg-muted)]"
                      }`}
                    >
                      {s.isActive ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {s.isActive && (
                      <button
                        type="button"
                        onClick={() => onDelete(s.id)}
                        className="text-xs text-[color:var(--color-fg-muted)] hover:text-red-500"
                      >
                        Desactivar
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

function NewServiceForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [priceCents, setPriceCents] = useState(1500);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const token = readAccessToken();
    if (!token) return;
    setError(null);
    setSaving(true);
    try {
      await api.createService(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          durationMinutes,
          priceCents,
          isActive: true,
        },
        token,
      );
      onCreated();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mt-6 grid gap-4 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 sm:grid-cols-2"
    >
      <Field label="Nombre" className="sm:col-span-2">
        <input
          required
          minLength={2}
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
        />
      </Field>
      <Field label="Descripción (opcional)" className="sm:col-span-2">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={2}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
        />
      </Field>
      <Field label="Duración (min)">
        <input
          required
          type="number"
          min={15}
          max={240}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
        />
      </Field>
      <Field label="Precio (céntimos)">
        <input
          required
          type="number"
          min={0}
          value={priceCents}
          onChange={(e) => setPriceCents(Number(e.target.value))}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
        />
      </Field>

      {error && (
        <p className="sm:col-span-2 rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-[var(--radius-md)] bg-[color:var(--color-accent)] px-6 py-2 text-sm font-medium text-[color:var(--color-accent-fg)] transition hover:brightness-110 disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Crear servicio"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-sm text-[color:var(--color-fg-muted)]">{label}</span>
      {children}
    </label>
  );
}
