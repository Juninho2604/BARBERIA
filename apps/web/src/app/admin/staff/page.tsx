"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError, api } from "@/lib/api";
import { readAccessToken, readUser } from "@/lib/auth-client";
import { ROLE_LABEL, can } from "@/lib/permissions";
import { useConfirm } from "@/components/ui/confirm-provider";
import { formatDate } from "@/lib/format";
import type { BarberDto, StaffMemberDto } from "@/lib/types";

type AssignableRole = "OWNER" | "MANAGER" | "RECEPTIONIST" | "BARBER";

const ROLE_OPTIONS: { value: AssignableRole; label: string; help: string }[] = [
  { value: "OWNER",        label: "Owner",     help: "Acceso total" },
  { value: "MANAGER",      label: "Manager",   help: "Gestiona operación, sin staff/settings" },
  { value: "RECEPTIONIST", label: "Recepción", help: "Citas y clientes" },
  { value: "BARBER",       label: "Barbero",   help: "Solo su agenda" },
];

// formatDate vive en @/lib/format con timezone consistente.

export default function AdminStaffPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const me = readUser();
  const [staff, setStaff] = useState<StaffMemberDto[]>([]);
  const [barbers, setBarbers] = useState<BarberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (me && !can(me.role, "staff.manage")) {
      router.replace("/admin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    const token = readAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const [list, bs] = await Promise.all([
        api.adminListStaff(token),
        api.adminListBarbers(token),
      ]);
      setStaff(list);
      setBarbers(bs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function onChangeRole(id: string, role: AssignableRole) {
    const target = staff.find((s) => s.id === id);
    // Cambios destructivos (degradar) requieren confirm.
    if (target && target.role === "OWNER" && role !== "OWNER") {
      const ok = await confirm({
        title: "¿Degradar a este OWNER?",
        description: `Perderá acceso a Staff, Settings y configuración.`,
        confirmLabel: `Cambiar a ${ROLE_LABEL[role]}`,
        destructive: true,
      });
      if (!ok) return;
    }
    const token = readAccessToken();
    if (!token) return;
    try {
      await api.adminUpdateStaff(id, { role }, token);
      toast.success("Rol actualizado");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar rol");
    }
  }

  async function onToggleActive(id: string, isActive: boolean) {
    const token = readAccessToken();
    if (!token) return;
    if (!isActive) {
      const ok = await confirm({
        title: "¿Desactivar este miembro?",
        description: "Perderá acceso al panel inmediatamente. Sus citas como barbero se mantienen.",
        confirmLabel: "Desactivar",
        destructive: true,
      });
      if (!ok) return;
    }
    try {
      await api.adminUpdateStaff(id, { isActive }, token);
      toast.success(isActive ? "Miembro reactivado" : "Miembro desactivado");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  }

  const grouped = useMemo(() => {
    const order: AssignableRole[] = ["OWNER", "MANAGER", "RECEPTIONIST", "BARBER"];
    return order
      .map((role) => ({
        role,
        members: staff.filter(
          (s) => s.role === role || (role === "OWNER" && s.role === "ADMIN"),
        ),
      }))
      .filter((g) => g.members.length > 0);
  }, [staff]);

  return (
    <section>
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
            — Equipo —
          </p>
          <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">Staff</h1>
          <p className="mt-3 text-[color:var(--color-fg-muted)]">
            Quién tiene acceso al panel y con qué rol.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowInvite((s) => !s);
            setEditingId(null);
          }}
          className="rounded-[var(--radius-md)] bg-[color:var(--color-fg)] px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--color-bg)] transition hover:opacity-90"
        >
          {showInvite ? "Cancelar" : "+ Invitar"}
        </button>
      </header>

      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-[color:var(--color-fg-muted)] bg-[color:var(--color-surface)] px-4 py-3 text-sm">
          {error}
        </p>
      )}

      {showInvite && (
        <InviteForm
          barbers={barbers}
          onDone={async () => {
            setShowInvite(false);
            await refresh();
          }}
        />
      )}

      <div className="mt-10 space-y-12">
        {loading && staff.length === 0 ? (
          <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
            Cargando…
          </p>
        ) : (
          grouped.map(({ role, members }) => (
            <section key={role}>
              <h2 className="mb-4 text-[0.65rem] uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
                — {ROLE_LABEL[role]} —
              </h2>
              <div className="overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-border)]">
                <table className="w-full text-sm">
                  <thead className="bg-[color:var(--color-surface)] text-left text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
                    <tr>
                      <th className="px-4 py-4">Nombre</th>
                      <th className="px-4 py-4">Email</th>
                      <th className="px-4 py-4">Último acceso</th>
                      <th className="px-4 py-4">Estado</th>
                      <th className="px-4 py-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((m) => {
                      const isEditing = editingId === m.id;
                      const isSelf = me?.id === m.id;
                      return (
                        <tr
                          key={m.id}
                          className="border-t border-[color:var(--color-border)]"
                        >
                          <td className="px-4 py-4">
                            <p className="text-[color:var(--color-fg)]">{m.name}</p>
                            {m.barberId && (
                              <p className="mt-1 text-[0.65rem] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
                                · Perfil barber
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-4 text-[color:var(--color-fg-muted)]">
                            {m.email}
                          </td>
                          <td className="px-4 py-4 text-[color:var(--color-fg-muted)]">
                            {formatDate(m.lastLoginAt)}
                          </td>
                          <td className="px-4 py-4">
                            <span
                              className={`inline-block rounded-full border px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.18em] ${
                                m.isActive
                                  ? "border-[color:var(--color-fg-muted)] text-[color:var(--color-fg)]"
                                  : "border-[color:var(--color-border)] text-[color:var(--color-fg-muted)]"
                              }`}
                            >
                              {m.isActive ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            {isEditing ? (
                              <div className="inline-flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.22em]">
                                <select
                                  defaultValue={role}
                                  onChange={(e) =>
                                    onChangeRole(m.id, e.target.value as AssignableRole)
                                  }
                                  className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1 text-[color:var(--color-fg)]"
                                >
                                  {ROLE_OPTIONS.map((r) => (
                                    <option key={r.value} value={r.value}>
                                      {r.label}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
                                >
                                  Cerrar
                                </button>
                              </div>
                            ) : (
                              <div className="inline-flex gap-4 text-[0.65rem] uppercase tracking-[0.22em]">
                                {!isSelf && (
                                  <button
                                    type="button"
                                    onClick={() => setEditingId(m.id)}
                                    className="text-[color:var(--color-fg-muted)] underline-offset-4 transition hover:text-[color:var(--color-fg)] hover:underline"
                                  >
                                    Cambiar rol
                                  </button>
                                )}
                                {!isSelf && (
                                  <button
                                    type="button"
                                    onClick={() => onToggleActive(m.id, !m.isActive)}
                                    className="text-[color:var(--color-fg-muted)] underline-offset-4 transition hover:text-[color:var(--color-fg)] hover:underline"
                                  >
                                    {m.isActive ? "Desactivar" : "Reactivar"}
                                  </button>
                                )}
                                {isSelf && (
                                  <span className="text-[color:var(--color-fg-muted)]">
                                    · tú ·
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))
        )}
      </div>
    </section>
  );
}

function InviteForm({
  barbers,
  onDone,
}: {
  barbers: BarberDto[];
  onDone: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AssignableRole>("RECEPTIONIST");
  const [barberId, setBarberId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const token = readAccessToken();
    if (!token) return;
    setError(null);
    setSaving(true);
    try {
      await api.adminInviteStaff(
        {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          role,
          barberId: role === "BARBER" && barberId ? barberId : null,
        },
        token,
      );
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
      <Field label="Rol" className="sm:col-span-2">
        <div className="grid gap-2 sm:grid-cols-2">
          {ROLE_OPTIONS.map((r) => (
            <label
              key={r.value}
              className={`flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border p-3 transition ${
                role === r.value
                  ? "border-[color:var(--color-fg)] bg-[color:var(--color-bg)]"
                  : "border-[color:var(--color-border)] bg-[color:var(--color-bg)] hover:border-[color:var(--color-fg-muted)]"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={role === r.value}
                onChange={() => setRole(r.value)}
                className="mt-1 accent-[color:var(--color-fg)]"
              />
              <span>
                <span className="block text-sm text-[color:var(--color-fg)]">
                  {r.label}
                </span>
                <span className="mt-0.5 block text-xs text-[color:var(--color-fg-muted)]">
                  {r.help}
                </span>
              </span>
            </label>
          ))}
        </div>
      </Field>

      {role === "BARBER" && barbers.length > 0 && (
        <Field label="Vincular a perfil de barber (opcional)" className="sm:col-span-2">
          <select
            value={barberId}
            onChange={(e) => setBarberId(e.target.value)}
            className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[color:var(--color-fg)]"
          >
            <option value="">— Ninguno —</option>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      <p className="sm:col-span-2 text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
        En modo demo el invitado se crea al instante. En producción se le mandará
        email con link para fijar contraseña.
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
          {saving ? "Invitando…" : "Invitar al equipo"}
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
