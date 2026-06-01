"use client";

import Image from "next/image";
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
    <main className="flex min-h-screen items-center justify-center text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
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
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-[color:var(--color-bg)] px-6 py-16">
      <div className="w-full max-w-sm">
        <a
          href="/"
          className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)] underline-offset-4 transition hover:text-[color:var(--color-fg)] hover:underline"
        >
          ← Inicio
        </a>

        <Image
          src="/brand/logo-combinado-inverso.svg"
          alt="Brothers Club Barbershop"
          width={1125}
          height={411}
          className="mt-10 h-14 w-auto"
        />

        <p className="mt-10 text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
          — Acceso staff —
        </p>
        <h1 className="mt-4 text-3xl font-light tracking-tight sm:text-4xl">
          Entrar al panel
        </h1>
        <p className="mt-3 text-sm text-[color:var(--color-fg-muted)]">
          Para gestionar servicios, barberos y citas.
        </p>

        {isMock && (
          <p className="mt-8 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-xs uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
            Modo demo · cualquier email/contraseña accede
          </p>
        )}

        <form onSubmit={submit} className="mt-8 grid gap-5">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Email
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-[color:var(--color-fg)] outline-none transition focus:border-[color:var(--color-fg)]"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              Contraseña
            </span>
            <input
              required
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-[color:var(--color-fg)] outline-none transition focus:border-[color:var(--color-fg)]"
            />
          </label>

          {error && (
            <p className="rounded-[var(--radius-md)] border border-[color:var(--color-fg-muted)] bg-[color:var(--color-surface)] px-4 py-3 text-sm text-[color:var(--color-fg)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-fg)] px-6 py-3 text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--color-bg)] transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
