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
      <header className="flex items-baseline justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">Barberos</h1>
          <p className="mt-2 text-[color:var(--color-fg-muted)]">
            Equipo activo y su disponibilidad semanal.
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
        <NewBarberForm
          onCreated={async () => {
            setShowForm(false);
            await refresh();
          }}
        />
      )}

      <div className="mt-8 grid gap-4">
        {loading && barbers.length === 0 ? (
          <p className="text-[color:var(--color-fg-muted)]">Cargando…</p>
        ) : barbers.length === 0 ? (
          <p className="text-[color:var(--color-fg-muted)]">Sin barberos todavía.</p>
        ) : (
          barbers.map((b) => (
            <article
              key={b.id}
              className="rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl">
                    {b.name}{" "}
                    {!b.isActive && (
                      <span className="ml-2 text-xs text-[color:var(--color-fg-muted)]">
                        (inactivo)
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-[color:var(--color-fg-muted)]">{b.email}</p>
                  {b.bio && <p className="mt-2 text-sm">{b.bio}</p>}
                </div>
                {b.isActive && (
                  <button
                    type="button"
                    onClick={() => onDelete(b.id)}
                    className="text-xs text-[color:var(--color-fg-muted)] hover:text-red-500"
                  >
                    Desactivar
                  </button>
                )}
              </div>
              {b.workingHours && b.workingHours.length > 0 && (
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  {b.workingHours.map((w) => (
                    <div
                      key={w.id}
                      className="rounded-[var(--radius-md)] bg-[color:var(--color-surface-muted)] px-3 py-2"
                    >
                      <span className="text-[color:var(--color-fg-muted)]">
                        {DAYS[w.weekday]}
                      </span>{" "}
                      {minutesToHHMM(w.startMin)} – {minutesToHHMM(w.endMin)}
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
      className="mt-6 grid gap-4 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 sm:grid-cols-2"
    >
      <Field label="Nombre">
        <input
          required
          minLength={2}
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
        />
      </Field>
      <Field label="Email">
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
        />
      </Field>
      <Field label="Bio (opcional)" className="sm:col-span-2">
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={500}
          rows={2}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
        />
      </Field>

      <p className="sm:col-span-2 text-xs text-[color:var(--color-fg-muted)]">
        Horario inicial: L–V 9:00–17:00. Lo afinas después.
      </p>

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
      <span className="mb-1 block text-sm text-[color:var(--color-fg-muted)]">{label}</span>
      {children}
    </label>
  );
}
