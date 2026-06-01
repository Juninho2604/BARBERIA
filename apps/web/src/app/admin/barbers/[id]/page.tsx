"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError, api } from "@/lib/api";
import { readAccessToken } from "@/lib/auth-client";
import { useConfirm } from "@/components/ui/confirm-provider";
import type { BarberDto, TimeOffDto } from "@/lib/types";

const DAYS = [
  { weekday: 0, label: "Domingo" },
  { weekday: 1, label: "Lunes" },
  { weekday: 2, label: "Martes" },
  { weekday: 3, label: "Miércoles" },
  { weekday: 4, label: "Jueves" },
  { weekday: 5, label: "Viernes" },
  { weekday: 6, label: "Sábado" },
];

interface DayState {
  active: boolean;
  start: string; // HH:MM
  end: string; // HH:MM
}

function minutesToHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

function HHMMToMinutes(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function barberToDayState(b: BarberDto | null): Record<number, DayState> {
  const initial: Record<number, DayState> = {};
  for (const d of DAYS) {
    initial[d.weekday] = { active: false, start: "09:00", end: "17:00" };
  }
  if (!b?.workingHours) return initial;
  for (const wh of b.workingHours) {
    initial[wh.weekday] = {
      active: true,
      start: minutesToHHMM(wh.startMin),
      end: minutesToHHMM(wh.endMin),
    };
  }
  return initial;
}

export default function BarberDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);

  const [barber, setBarber] = useState<BarberDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const b = await api.getBarber(id);
      if (!b) {
        setError("Barbero no encontrado");
        return;
      }
      setBarber(b);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading && !barber) {
    return <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">Cargando…</p>;
  }
  if (error || !barber) {
    return (
      <section>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)] underline-offset-4 transition hover:text-[color:var(--color-fg)] hover:underline"
        >
          ← Volver
        </button>
        <p className="mt-6 rounded-[var(--radius-md)] border border-[color:var(--color-fg-muted)] bg-[color:var(--color-surface)] px-4 py-3 text-sm">
          {error ?? "No encontrado"}
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-10">
      <header>
        <a
          href="/admin/barbers"
          className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)] underline-offset-4 transition hover:text-[color:var(--color-fg)] hover:underline"
        >
          ← Barberos
        </a>
        <h1 className="mt-6 text-4xl font-light tracking-tight sm:text-5xl">
          {barber.name}
        </h1>
        <p className="mt-2 text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">{barber.email}</p>
        {barber.bio && <p className="mt-4 max-w-2xl text-sm text-[color:var(--color-fg-muted)]">{barber.bio}</p>}
      </header>

      <WorkingHoursEditor barber={barber} onSaved={refresh} />
      <TimeOffSection barberId={barber.id} />
    </section>
  );
}

function WorkingHoursEditor({
  barber,
  onSaved,
}: {
  barber: BarberDto;
  onSaved: () => Promise<void>;
}) {
  const [state, setState] = useState<Record<number, DayState>>(() =>
    barberToDayState(barber),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  function update(weekday: number, patch: Partial<DayState>) {
    setState((prev) => ({ ...prev, [weekday]: { ...prev[weekday]!, ...patch } }));
  }

  async function save() {
    const token = readAccessToken();
    if (!token) return;

    const workingHours: { weekday: number; startMin: number; endMin: number }[] = [];
    for (const d of DAYS) {
      const day = state[d.weekday]!;
      if (!day.active) continue;
      const startMin = HHMMToMinutes(day.start);
      const endMin = HHMMToMinutes(day.end);
      if (endMin <= startMin) {
        setError(`${d.label}: la hora de fin debe ser mayor que la de inicio.`);
        return;
      }
      workingHours.push({ weekday: d.weekday, startMin, endMin });
    }

    setError(null);
    setOkMessage(null);
    setSaving(true);
    try {
      await api.setBarberWorkingHours(barber.id, workingHours, token);
      await onSaved();
      setOkMessage("Horario actualizado.");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
      <h2 className="text-2xl font-light tracking-tight">Horario semanal</h2>
      <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
        Marca los días que trabaja y ajusta las horas. Guarda al final.
      </p>

      <div className="mt-6 grid gap-3">
        {DAYS.map((d) => {
          const day = state[d.weekday]!;
          return (
            <div
              key={d.weekday}
              className="flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] bg-[color:var(--color-surface-muted)] px-4 py-3"
            >
              <label className="flex w-32 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={day.active}
                  onChange={(e) => update(d.weekday, { active: e.target.checked })}
                  className="accent-[color:var(--color-accent)]"
                />
                <span>{d.label}</span>
              </label>
              <input
                type="time"
                disabled={!day.active}
                value={day.start}
                onChange={(e) => update(d.weekday, { start: e.target.value })}
                className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1 text-sm disabled:opacity-40"
              />
              <span className="text-[color:var(--color-fg-muted)]">–</span>
              <input
                type="time"
                disabled={!day.active}
                value={day.end}
                onChange={(e) => update(d.weekday, { end: e.target.value })}
                className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1 text-sm disabled:opacity-40"
              />
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 rounded-[var(--radius-md)] border border-[color:var(--color-fg-muted)] bg-[color:var(--color-bg)] px-4 py-3 text-sm">
          {error}
        </p>
      )}
      {okMessage && (
        <p className="mt-4 rounded-[var(--radius-md)] border border-[color:var(--color-fg-muted)] bg-[color:var(--color-bg)] px-4 py-3 text-xs uppercase tracking-[0.18em] text-[color:var(--color-fg)]">
          {okMessage}
        </p>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-fg)] px-5 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--color-bg)] transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar horario"}
        </button>
      </div>
    </article>
  );
}

function TimeOffSection({ barberId }: { barberId: string }) {
  const confirm = useConfirm();
  const [items, setItems] = useState<TimeOffDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const all = await api.listTimeOff(barberId);
      // Sólo los futuros, ordenados ascendente.
      const now = Date.now();
      const upcoming = all
        .filter((t) => new Date(t.endsAt).getTime() > now)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
      setItems(upcoming);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barberId]);

  async function onDelete(id: string) {
    const ok = await confirm({
      title: "¿Eliminar este permiso?",
      description: "Los slots vuelven a estar disponibles para reserva.",
      confirmLabel: "Eliminar",
      destructive: true,
    });
    if (!ok) return;
    const token = readAccessToken();
    if (!token) return;
    try {
      await api.deleteTimeOff(id, token);
      toast.success("Permiso eliminado");
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    }
  }

  return (
    <article className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-2xl font-light tracking-tight">Vacaciones · permisos</h2>
          <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
            Bloques en los que no se pueden reservar citas.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)] transition hover:border-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
        >
          {showForm ? "Cancelar" : "+ Nuevo"}
        </button>
      </header>

      {error && (
        <p className="mt-4 rounded-[var(--radius-md)] border border-[color:var(--color-fg-muted)] bg-[color:var(--color-bg)] px-4 py-3 text-sm">
          {error}
        </p>
      )}

      {showForm && (
        <NewTimeOffForm
          barberId={barberId}
          onCreated={async () => {
            setShowForm(false);
            await refresh();
          }}
        />
      )}

      <div className="mt-6 grid gap-2">
        {loading && items.length === 0 ? (
          <p className="text-sm text-[color:var(--color-fg-muted)]">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-[color:var(--color-fg-muted)]">
            Sin vacaciones próximas.
          </p>
        ) : (
          items.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-4 py-3 text-sm"
            >
              <div>
                <p className="text-[color:var(--color-fg)]">
                  {new Date(t.startsAt).toLocaleString("es-ES", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  →{" "}
                  {new Date(t.endsAt).toLocaleString("es-ES", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
                {t.reason && (
                  <p className="mt-1 text-xs text-[color:var(--color-fg-muted)]">{t.reason}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => onDelete(t.id)}
                className="text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)] underline-offset-4 transition hover:text-[color:var(--color-fg)] hover:underline"
              >
                Eliminar
              </button>
            </div>
          ))
        )}
      </div>
    </article>
  );
}

function NewTimeOffForm({
  barberId,
  onCreated,
}: {
  barberId: string;
  onCreated: () => void;
}) {
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const token = readAccessToken();
    if (!token) return;
    setError(null);
    if (new Date(endsAt) <= new Date(startsAt)) {
      setError("La fecha de fin debe ser posterior a la de inicio.");
      return;
    }
    setSaving(true);
    try {
      await api.createTimeOff(
        barberId,
        {
          startsAt: new Date(startsAt).toISOString(),
          endsAt: new Date(endsAt).toISOString(),
          reason: reason.trim() || undefined,
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
      className="mt-4 grid gap-3 rounded-[var(--radius-md)] bg-[color:var(--color-surface-muted)] p-4 sm:grid-cols-2"
    >
      <label className="block">
        <span className="mb-1 block text-xs text-[color:var(--color-fg-muted)]">Inicio</span>
        <input
          required
          type="datetime-local"
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-accent)]"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-[color:var(--color-fg-muted)]">Fin</span>
        <input
          required
          type="datetime-local"
          value={endsAt}
          onChange={(e) => setEndsAt(e.target.value)}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-accent)]"
        />
      </label>
      <label className="block sm:col-span-2">
        <span className="mb-1 block text-xs text-[color:var(--color-fg-muted)]">
          Motivo (opcional)
        </span>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={200}
          className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-sm outline-none focus:border-[color:var(--color-accent)]"
        />
      </label>

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
          {saving ? "Guardando…" : "Crear permiso"}
        </button>
      </div>
    </form>
  );
}
