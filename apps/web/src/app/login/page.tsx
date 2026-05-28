"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, api } from "@/lib/api";
import { writeSession } from "@/lib/auth-client";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginShell />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginShell() {
  return (
    <main className="flex min-h-screen items-center justify-center text-[color:var(--color-fg-muted)]">
      Cargando…
    </main>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await api.login({ email, password });
      writeSession(session);
      router.replace(next);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Email o contraseña inválidos.");
      } else {
        setError(err instanceof Error ? err.message : "Error al iniciar sesión.");
      }
    } finally {
      setLoading(false);
    }
  }

  const isMock = api.isMock();

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <a
          href="/"
          className="text-sm text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
        >
          ← Inicio
        </a>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl">
          Acceso staff
        </h1>
        <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
          Para gestionar servicios, barberos y citas.
        </p>

        {isMock && (
          <p className="mt-6 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-xs text-[color:var(--color-fg-muted)]">
            Modo demo — cualquier email/contraseña te da acceso de admin.
          </p>
        )}

        <form onSubmit={submit} className="mt-8 grid gap-4">
          <label className="block">
            <span className="mb-1 block text-sm text-[color:var(--color-fg-muted)]">
              Email
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-[color:var(--color-fg-muted)]">
              Contraseña
            </span>
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
            />
          </label>

          {error && (
            <p className="rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-[var(--radius-md)] bg-[color:var(--color-accent)] px-6 py-3 font-medium text-[color:var(--color-accent-fg)] transition hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
