// Helpers de persistencia de sesión. Para v1 usamos localStorage — basta porque
// el panel admin es de uso interno y los riesgos de XSS están acotados por las
// CSP de Next + tokens cortos (15 min). Si más adelante exponemos al público
// migramos a cookies httpOnly.

import type { AuthSession, AuthUser } from "@barberia/shared";

const STORAGE_KEY = "barberia.session";

export function readSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function writeSession(session: AuthSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function readUser(): AuthUser | null {
  return readSession()?.user ?? null;
}

export function readAccessToken(): string | null {
  return readSession()?.tokens.accessToken ?? null;
}
