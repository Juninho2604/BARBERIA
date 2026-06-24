"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ApiError, api } from "@/lib/api";
import { readAccessToken, readUser } from "@/lib/auth-client";
import { ROLE_LABEL } from "@/lib/permissions";
import { Field } from "@/components/admin/ui";
import type { AuthUserDto } from "@/lib/types";

export default function AdminAccount() {
  const [user, setUser] = useState<AuthUserDto | null>(null);

  useEffect(() => {
    setUser(readUser());
  }, []);

  return (
    <section className="max-w-xl">
      <header>
        <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
          — Mi cuenta —
        </p>
        <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">Tu perfil</h1>
        <p className="mt-3 text-[color:var(--color-fg-muted)]">
          Tus datos de acceso y seguridad.
        </p>
      </header>

      {user && (
        <dl className="mt-10 grid gap-px overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-border)] sm:grid-cols-2">
          <div className="bg-[color:var(--color-surface)] p-5">
            <dt className="text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Nombre
            </dt>
            <dd className="mt-1 text-[color:var(--color-fg)]">{user.name}</dd>
          </div>
          <div className="bg-[color:var(--color-surface)] p-5">
            <dt className="text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Email
            </dt>
            <dd className="mt-1 break-all text-[color:var(--color-fg)]">{user.email}</dd>
          </div>
          <div className="bg-[color:var(--color-surface)] p-5">
            <dt className="text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Rol
            </dt>
            <dd className="mt-1 text-[color:var(--color-fg)]">{ROLE_LABEL[user.role]}</dd>
          </div>
          {user.phone && (
            <div className="bg-[color:var(--color-surface)] p-5">
              <dt className="text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
                Teléfono
              </dt>
              <dd className="mt-1 text-[color:var(--color-fg)]">{user.phone}</dd>
            </div>
          )}
        </dl>
      )}

      <ChangePasswordForm />
    </section>
  );
}

function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (next.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (next !== confirm) {
      setError("La confirmación no coincide con la nueva contraseña.");
      return;
    }
    if (next === current) {
      setError("La nueva contraseña debe ser distinta a la actual.");
      return;
    }

    const token = readAccessToken();
    if (!token) {
      setError("Sesión expirada. Vuelve a entrar.");
      return;
    }

    setSaving(true);
    try {
      await api.changePassword({ currentPassword: current, newPassword: next }, token);
      toast.success("Contraseña actualizada");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      if (err instanceof ApiError) {
        // Mensajes específicos del backend en español.
        setError(err.message || "No se pudo cambiar la contraseña.");
      } else {
        setError(err instanceof Error ? err.message : "Error inesperado.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="mt-12 grid gap-5 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6"
    >
      <h2 className="text-xl font-light tracking-tight">Cambiar contraseña</h2>

      <Field label="Contraseña actual">
        <input
          required
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[color:var(--color-fg)] outline-none transition focus:border-[color:var(--color-fg)]"
        />
      </Field>
      <Field label="Nueva contraseña">
        <input
          required
          type="password"
          minLength={8}
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[color:var(--color-fg)] outline-none transition focus:border-[color:var(--color-fg)]"
        />
      </Field>
      <Field label="Repite la nueva contraseña">
        <input
          required
          type="password"
          minLength={8}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[color:var(--color-fg)] outline-none transition focus:border-[color:var(--color-fg)]"
        />
      </Field>

      <p className="text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
        Mínimo 8 caracteres. Distinta a la actual.
      </p>

      {error && (
        <p className="rounded-[var(--radius-md)] border border-[color:var(--color-fg-muted)] bg-[color:var(--color-bg)] px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-fg)] px-5 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--color-bg)] transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Actualizar contraseña"}
        </button>
      </div>
    </form>
  );
}
