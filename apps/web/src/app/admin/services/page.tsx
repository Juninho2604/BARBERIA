"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError, api } from "@/lib/api";
import { readAccessToken } from "@/lib/auth-client";
import { useConfirm } from "@/components/ui/confirm-provider";
import { formatPrice } from "@/lib/format";
import type { ServiceDto } from "@/lib/types";

export default function AdminServices() {
  const confirm = useConfirm();
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

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
    const ok = await confirm({
      title: "¿Desactivar este servicio?",
      description: "Dejará de aparecer en la web pública. Citas existentes lo mantienen.",
      confirmLabel: "Desactivar",
      destructive: true,
    });
    if (!ok) return;
    const token = readAccessToken();
    if (!token) return;
    try {
      await api.deleteService(id, token);
      toast.success("Servicio desactivado");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al desactivar");
    }
  }

  async function onReactivate(id: string) {
    const token = readAccessToken();
    if (!token) return;
    try {
      await api.updateService(id, { isActive: true }, token);
      toast.success("Servicio reactivado");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al reactivar");
    }
  }

  return (
    <section>
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
            — Catálogo —
          </p>
          <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">
            Servicios
          </h1>
          <p className="mt-3 text-[color:var(--color-fg-muted)]">
            Inactivos no aparecen en la web pública.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowForm((s) => !s);
            setEditingId(null);
          }}
          className="rounded-[var(--radius-md)] bg-[color:var(--color-fg)] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--color-bg)] transition hover:opacity-90"
        >
          {showForm ? "Cancelar" : "+ Nuevo"}
        </button>
      </header>

      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-[color:var(--color-fg-muted)] bg-[color:var(--color-surface)] px-4 py-3 text-sm">
          {error}
        </p>
      )}

      {showForm && (
        <ServiceForm
          mode="create"
          onDone={async () => {
            setShowForm(false);
            await refresh();
          }}
        />
      )}

      <div className="mt-10 overflow-x-auto rounded-[var(--radius-md)] border border-[color:var(--color-border)]">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--color-surface)] text-left text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
            <tr>
              <th className="px-4 py-4">Nombre</th>
              <th className="px-4 py-4">Duración</th>
              <th className="px-4 py-4">Precio</th>
              <th className="px-4 py-4">Estado</th>
              <th className="px-4 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {loading && services.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
                  Cargando…
                </td>
              </tr>
            ) : services.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
                  Sin servicios todavía.
                </td>
              </tr>
            ) : (
              services.flatMap((s) => {
                const isEditing = editingId === s.id;
                const row = (
                  <tr
                    key={s.id}
                    className="border-t border-[color:var(--color-border)]"
                  >
                    <td className="px-4 py-4">
                      <p className="text-[color:var(--color-fg)]">{s.name}</p>
                      {s.description && (
                        <p className="mt-1 text-xs text-[color:var(--color-fg-muted)]">
                          {s.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-[color:var(--color-fg-muted)]">{s.durationMinutes} min</td>
                    <td className="px-4 py-4 text-[color:var(--color-fg-muted)]">{formatPrice(s.priceCents)}</td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.18em] ${
                          s.isActive
                            ? "border-[color:var(--color-fg-muted)] text-[color:var(--color-fg)]"
                            : "border-[color:var(--color-border)] text-[color:var(--color-fg-muted)]"
                        }`}
                      >
                        {s.isActive ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex gap-4 text-[0.65rem] uppercase tracking-[0.22em]">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(isEditing ? null : s.id);
                            setShowForm(false);
                          }}
                          className="text-[color:var(--color-fg-muted)] underline-offset-4 transition hover:text-[color:var(--color-fg)] hover:underline"
                        >
                          {isEditing ? "Cerrar" : "Editar"}
                        </button>
                        {s.isActive ? (
                          <button
                            type="button"
                            onClick={() => onDelete(s.id)}
                            className="text-[color:var(--color-fg-muted)] underline-offset-4 transition hover:text-[color:var(--color-fg)] hover:underline"
                          >
                            Desactivar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onReactivate(s.id)}
                            className="text-[color:var(--color-fg-muted)] underline-offset-4 transition hover:text-[color:var(--color-fg)] hover:underline"
                          >
                            Reactivar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
                if (!isEditing) return [row];
                const editor = (
                  <tr key={`${s.id}-edit`} className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
                    <td colSpan={5} className="px-4 py-6">
                      <ServiceForm
                        mode="edit"
                        initial={s}
                        onDone={async () => {
                          setEditingId(null);
                          await refresh();
                        }}
                      />
                    </td>
                  </tr>
                );
                return [row, editor];
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ServiceForm({
  mode,
  initial,
  onDone,
}: {
  mode: "create" | "edit";
  initial?: ServiceDto;
  onDone: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [durationMinutes, setDurationMinutes] = useState(initial?.durationMinutes ?? 30);
  const [priceCents, setPriceCents] = useState(initial?.priceCents ?? 1500);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const token = readAccessToken();
    if (!token) return;
    setError(null);
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        durationMinutes,
        priceCents,
      };
      if (mode === "create") {
        await api.createService({ ...payload, isActive: true }, token);
      } else if (initial) {
        await api.updateService(initial.id, payload, token);
      }
      onDone();
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
      className={`grid gap-5 sm:grid-cols-2 ${
        mode === "create"
          ? "mt-6 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6"
          : ""
      }`}
    >
      <Field label="Nombre" className="sm:col-span-2">
        <input
          required
          minLength={2}
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[color:var(--color-fg)] outline-none transition focus:border-[color:var(--color-fg)]"
        />
      </Field>
      <Field label="Descripción (opcional)" className="sm:col-span-2">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={500}
          rows={2}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[color:var(--color-fg)] outline-none transition focus:border-[color:var(--color-fg)]"
        />
      </Field>
      <Field label="Duración (min)">
        <input
          required
          type="number"
          min={5}
          max={240}
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[color:var(--color-fg)] outline-none transition focus:border-[color:var(--color-fg)]"
        />
      </Field>
      <Field label="Precio (céntimos)">
        <input
          required
          type="number"
          min={0}
          value={priceCents}
          onChange={(e) => setPriceCents(Number(e.target.value))}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[color:var(--color-fg)] outline-none transition focus:border-[color:var(--color-fg)]"
        />
      </Field>

      {error && (
        <p className="sm:col-span-2 rounded-[var(--radius-md)] border border-[color:var(--color-fg-muted)] bg-[color:var(--color-bg)] px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-fg)] px-5 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--color-bg)] transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Guardando…" : mode === "create" ? "Crear servicio" : "Guardar cambios"}
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
      <span className="mb-2 block text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}
