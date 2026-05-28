"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { clearSession, readAccessToken, readUser } from "@/lib/auth-client";
import type { AuthUserDto } from "@/lib/types";

const NAV = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/services", label: "Servicios" },
  { href: "/admin/barbers", label: "Barberos" },
  { href: "/admin/appointments", label: "Citas" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUserDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = readAccessToken();
    if (!token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    const cached = readUser();
    if (cached) setUser(cached);

    api
      .me(token)
      .then((u) => {
        if (u.role !== "ADMIN") {
          clearSession();
          router.replace("/login");
          return;
        }
        setUser(u);
      })
      .catch(() => {
        clearSession();
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      })
      .finally(() => setLoading(false));
  }, [pathname, router]);

  function logout() {
    clearSession();
    router.replace("/login");
  }

  if (loading && !user) {
    return (
      <main className="flex min-h-screen items-center justify-center text-[color:var(--color-fg-muted)]">
        Cargando…
      </main>
    );
  }

  if (!user || user.role !== "ADMIN") return null;

  return (
    <div className="min-h-screen">
      <header className="border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a
            href="/"
            className="font-[family-name:var(--font-display)] text-lg"
          >
            Barbería · admin
          </a>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[color:var(--color-fg-muted)]">{user.email}</span>
            <button
              type="button"
              onClick={logout}
              className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] px-3 py-1 text-[color:var(--color-fg-muted)] transition hover:text-[color:var(--color-fg)]"
            >
              Salir
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 pb-2 text-sm">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`rounded-[var(--radius-md)] px-3 py-2 transition ${
                  active
                    ? "bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)]"
                    : "text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
