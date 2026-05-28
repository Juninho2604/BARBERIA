"use client";

import Image from "next/image";
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
      <main className="flex min-h-screen items-center justify-center text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
        Cargando…
      </main>
    );
  }

  if (!user || user.role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-[color:var(--color-bg)]">
      <header className="border-b border-[color:var(--color-border)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5">
          <a href="/" className="flex items-center gap-3">
            <Image
              src="/brand/logo-combinado-inverso.svg"
              alt="Brothers Club Barbershop"
              width={1125}
              height={411}
              className="h-8 w-auto opacity-90"
            />
            <span className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
              · admin
            </span>
          </a>
          <div className="flex items-center gap-4 text-xs uppercase tracking-[0.18em]">
            <span className="hidden text-[color:var(--color-fg-muted)] sm:inline">
              {user.email}
            </span>
            <button
              type="button"
              onClick={logout}
              className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] px-3 py-1.5 text-[color:var(--color-fg-muted)] transition hover:border-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
            >
              Salir
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6 pb-3 text-xs uppercase tracking-[0.22em]">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <a
                key={item.href}
                href={item.href}
                className={`rounded-[var(--radius-md)] px-3 py-2 transition ${
                  active
                    ? "bg-[color:var(--color-fg)] text-[color:var(--color-bg)]"
                    : "text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
                }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-12">{children}</main>
    </div>
  );
}
