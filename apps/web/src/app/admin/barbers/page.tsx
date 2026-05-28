"use client";

import { useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { readAccessToken } from "@/lib/auth-client";
import type { BarberDto } from "@/lib/types";

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function minutesToHHMM(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export default function AdminBarbers() {
  const [barbers, setBarbers] = useState<BarberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const token = readAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const list = await api.adminListBarbers(token);
      setBarbers(list);
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
    if (!confirm("¿Desactivar este barbero?")) return;
    const token = readAccessToken();
    if (!token) return;
    try {
      await api.deleteBarber(id, token);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <section>
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
            — Equipo —
          </p>
          <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">Barberos</h1>
          <p className="mt-3 text-[color:var(--color-fg-muted)]">
            Equipo activo y su disponibilidad semanal.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
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
        <NewBarberForm
          onCreated={async () => {
            setShowForm(false);
            await refresh();
          }}
        />
      )}

      <div className="mt-10 grid gap-4">
        {loading && barbers.length === 0 ? (
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">Cargando…</p>
        ) : barbers.length === 0 ? (
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">Sin barberos todavía.</p>
        ) : (
          barbers.map((b) => (
            <article
              key={b.id}
              className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-light tracking-tight">
                    {b.name}
                    {!b.isActive && (
                      <span className="ml-3 text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
                        (inactivo)
                      </span>
                    )}
                  </h3>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">{b.email}</p>
                  {b.bio && <p className="mt-3 text-sm text-[color:var(--color-fg-muted)]">{b.bio}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 text-[0.65rem] uppercase tracking-[0.22em]">
                  <a
                    href={`/admin/barbers/${b.id}`}
                    className="text-[color:var(--color-fg-muted)] underline-offset-4 transition hover:text-[color:var(--color-fg)] hover:underline"
                  >
                    Editar
                  </a>
                  {b.isActive && (
                    <button
                      type="button"
                      onClick={() => onDelete(b.id)}
                      className="text-[color:var(--color-fg-muted)] underline-offset-4 transition hover:text-[color:var(--color-fg)] hover:underline"
                    >
                      Desactivar
                    </button>
                  )}
                </div>
              </div>
              {b.workingHours && b.workingHours.length > 0 && (
                <div className="mt-5 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  {b.workingHours.map((w) => (
                    <div
                      key={w.id}
                      className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2"
                    >
                      <span className="text-[0.65rem] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
                        {DAYS[w.weekday]}
                      </span>{" "}
                      <span className="ml-1 text-[color:var(--color-fg)]">
                        {minutesToHHMM(w.startMin)} – {minutesToHHMM(w.endMin)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

function NewBarberForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const token = readAccessToken();
    if (!token) return;
    setError(null);
    setSaving(true);
    try {
      // Por defecto L-V 9:00-17:00. El admin lo afina luego con PUT working-hours.
      const workingHours = [1, 2, 3, 4, 5].map((weekday) => ({
        weekday,
        startMin: 9 * 60,
        endMin: 17 * 60,
      }));
      await api.createBarber(
        {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          bio: bio.trim() || undefined,
          workingHours,
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
      className="mt-6 grid gap-5 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 sm:grid-cols-2"
    >
      <Field label="Nombre">
        <input
          required
          minLength={2}
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[color:var(--color-fg)] outline-none transition focus:border-[color:var(--color-fg)]"
        />
      </Field>
      <Field label="Email">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[color:var(--color-fg)] outline-none transition focus:border-[color:var(--color-fg)]"
        />
      </Field>
      <Field label="Bio (opcional)" className="sm:col-span-2">
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={2}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[color:var(--color-fg)] outline-none transition focus:border-[color:var(--color-fg)]"
        />
      </Field>

      <p className="sm:col-span-2 text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
        Horario inicial · L–V 9:00–17:00. Lo afinas después.
      </p>

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
          {saving ? "Guardando…" : "Crear barbero"}
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
