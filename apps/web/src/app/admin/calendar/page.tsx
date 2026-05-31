"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError, api } from "@/lib/api";
import { readAccessToken, readUser } from "@/lib/auth-client";
import { can } from "@/lib/permissions";
import { useModal } from "@/lib/use-modal";
import { useConfirm } from "@/components/ui/confirm-provider";
import { formatDayLabel, formatPrice, formatTime, pad2 } from "@/lib/format";
import type { AppointmentDto, BarberDto, ServiceDto } from "@/lib/types";

/**
 * Calendario operativo — vista de día con columna por barbero. Cada cita
 * aparece como un bloque coloreado según estado. Click en una cita →
 * panel lateral con detalles + cambio de estado. Click en hueco vacío →
 * modal de "Nueva cita manual".
 *
 * Timezone: usamos la del navegador para mostrar, pero los timestamps
 * son ISO en UTC.
 */

const HOUR_START = 8;  // 08:00
const HOUR_END = 21;   // 21:00 (no inclusive)
const HOUR_HEIGHT = 56; // px por hora
const SLOT_GRANULARITY_MIN = 30;
const STATUS_LABEL: Record<AppointmentDto["status"], string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmada",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
  NO_SHOW: "No vino",
};

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function fromYmd(s: string) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function startOfDayMs(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}
// pad2 / formatTime / formatDayLabel viven en @/lib/format — usan
// BUSINESS.timezone para que admin y cliente vean la misma hora sin
// importar la zona del dispositivo.

export default function AdminCalendarPage() {
  const router = useRouter();
  const confirm = useConfirm();
  const me = readUser();
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [barbers, setBarbers] = useState<BarberDto[]>([]);
  const [appts, setAppts] = useState<AppointmentDto[]>([]);
  const [date, setDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AppointmentDto | null>(null);
  const [composer, setComposer] = useState<{
    barberId: string;
    startsAt: string;
  } | null>(null);

  useEffect(() => {
    if (me && !can(me.role, "appointments.viewAll") && !can(me.role, "appointments.viewOwn")) {
      router.replace("/admin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    const token = readAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const dayStart = new Date(date);
      const dayEnd = addDays(dayStart, 1);
      const [as, bs, ss] = await Promise.all([
        api.adminListAppointments(token, {
          from: dayStart.toISOString(),
          to: dayEnd.toISOString(),
        }),
        api.adminListBarbers(token),
        api.adminListServices(token),
      ]);
      setAppts(as);
      setBarbers(bs.filter((b) => b.isActive));
      setServices(ss.filter((s) => s.isActive));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  async function changeStatus(id: string, status: AppointmentDto["status"]) {
    // Cambios destructivos requieren confirm. NO_SHOW especialmente:
    // afecta histórico del cliente y métricas; antes la auditoría
    // marcaba este flow como "un click destructivo sin undo".
    if (status === "NO_SHOW") {
      const ok = await confirm({
        title: "¿Marcar como No vino?",
        description: "Esto cuenta en las métricas del cliente y no se puede revertir fácilmente.",
        confirmLabel: "Marcar no-show",
        destructive: true,
      });
      if (!ok) return;
    }
    const token = readAccessToken();
    if (!token) return;
    try {
      await api.updateAppointment(id, { status }, token);
      toast.success("Estado actualizado");
      await refresh();
      setSelected((cur) => (cur ? { ...cur, status } : cur));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cambiar estado");
    }
  }

  async function cancel(id: string) {
    const ok = await confirm({
      title: "¿Cancelar esta cita?",
      description: "El slot quedará libre para reservar de nuevo.",
      confirmLabel: "Cancelar cita",
      cancelLabel: "Volver",
      destructive: true,
    });
    if (!ok) return;
    const token = readAccessToken();
    if (!token) return;
    try {
      await api.cancelAppointment(id, token);
      toast.success("Cita cancelada");
      await refresh();
      setSelected(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al cancelar");
    }
  }

  const totalHours = HOUR_END - HOUR_START;
  const totalHeight = totalHours * HOUR_HEIGHT;
  const hours = useMemo(
    () => Array.from({ length: totalHours }, (_, i) => HOUR_START + i),
    [totalHours],
  );

  // Indicador "ahora" — refresca cada minuto. Antes solo se calculaba
  // al render inicial y se quedaba congelado durante la sesión.
  const [nowTick, setNowTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setNowTick((n) => n + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const nowOffset = useMemo(() => {
    const now = new Date();
    if (startOfDayMs(now) !== startOfDayMs(date)) return null;
    const minSinceStart = (now.getHours() - HOUR_START) * 60 + now.getMinutes();
    if (minSinceStart < 0 || minSinceStart > totalHours * 60) return null;
    return (minSinceStart / 60) * HOUR_HEIGHT;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, totalHours, nowTick]);

  return (
    <section>
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
            — Agenda —
          </p>
          <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">
            Calendario
          </h1>
          <p className="mt-3 text-[color:var(--color-fg-muted)]">
            Vista del día. Click en una cita para gestionarla, click en hueco
            vacío para reservar manualmente.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-[0.22em]">
          <button
            type="button"
            onClick={() => setDate((d) => addDays(d, -1))}
            className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] px-3 py-1.5 text-[color:var(--color-fg-muted)] transition hover:border-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
          >
            ← Día
          </button>
          <button
            type="button"
            onClick={() => {
              const t = new Date();
              t.setHours(0, 0, 0, 0);
              setDate(t);
            }}
            className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] px-3 py-1.5 text-[color:var(--color-fg-muted)] transition hover:border-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setDate((d) => addDays(d, 1))}
            className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] px-3 py-1.5 text-[color:var(--color-fg-muted)] transition hover:border-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
          >
            Día →
          </button>
          <input
            type="date"
            value={toYmd(date)}
            onChange={(e) => setDate(fromYmd(e.target.value))}
            className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-2 py-1.5 text-[0.7rem] text-[color:var(--color-fg)] outline-none focus:border-[color:var(--color-fg)]"
          />
        </div>
      </header>

      <p className="mt-6 text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
        {formatDayLabel(date)}
      </p>

      {error && (
        <p className="mt-6 rounded-[var(--radius-md)] border border-[color:var(--color-fg-muted)] bg-[color:var(--color-surface)] px-4 py-3 text-sm">
          {error}
        </p>
      )}

      {loading && barbers.length === 0 ? (
        <p className="mt-10 text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
          Cargando…
        </p>
      ) : barbers.length === 0 ? (
        <p className="mt-10 text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
          No hay barberos activos.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-[var(--radius-md)] border border-[color:var(--color-border)]">
          <div
            className="grid"
            style={{
              gridTemplateColumns: `64px repeat(${barbers.length}, minmax(180px, 1fr))`,
              minWidth: 64 + barbers.length * 180,
            }}
          >
            {/* Header con nombre de barberos. La esquina superior izquierda
                (spacer) tiene sticky en LEFT+TOP para que no se mueva al
                scrollear horizontal. */}
            <div className="sticky left-0 top-0 z-30 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)]" />
            {barbers.map((b) => (
              <div
                key={b.id}
                className="border-b border-l border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-center"
              >
                <p className="text-sm text-[color:var(--color-fg)]">{b.name}</p>
                <p className="mt-0.5 text-[0.65rem] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
                  {appts.filter((a) => a.barberId === b.id && a.status !== "CANCELLED").length} citas
                </p>
              </div>
            ))}

            {/* Columna de horas — sticky LEFT para que en mobile siempre
                veas la referencia horaria mientras swipeas entre barberos. */}
            <div
              className="sticky left-0 z-20 relative border-r border-[color:var(--color-border)] bg-[color:var(--color-bg)]"
              style={{ height: totalHeight }}
            >
              {hours.map((h) => (
                <div
                  key={h}
                  className="text-[0.65rem] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]"
                  style={{
                    position: "absolute",
                    top: (h - HOUR_START) * HOUR_HEIGHT - 6,
                    right: 8,
                  }}
                >
                  {pad2(h)}:00
                </div>
              ))}
            </div>

            {/* Una columna por barbero */}
            {barbers.map((b) => {
              const barberAppts = appts.filter((a) => a.barberId === b.id);
              return (
                <div
                  key={b.id}
                  className="relative border-l border-[color:var(--color-border)]"
                  style={{ height: totalHeight }}
                  onClick={(e) => {
                    if (e.target !== e.currentTarget) return;
                    // Click en hueco: calcular hora aproximada
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const minutesFromStart = Math.floor((y / HOUR_HEIGHT) * 60);
                    const snapped = Math.round(minutesFromStart / SLOT_GRANULARITY_MIN) * SLOT_GRANULARITY_MIN;
                    const start = new Date(date);
                    start.setHours(HOUR_START, snapped, 0, 0);
                    setComposer({
                      barberId: b.id,
                      startsAt: start.toISOString(),
                    });
                  }}
                >
                  {/* Gridlines cada hora */}
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="pointer-events-none absolute left-0 right-0 border-t border-[color:var(--color-border)]/40"
                      style={{ top: (h - HOUR_START) * HOUR_HEIGHT }}
                    />
                  ))}
                  {/* Indicador now */}
                  {nowOffset !== null && (
                    <div
                      className="pointer-events-none absolute left-0 right-0 z-10"
                      style={{ top: nowOffset }}
                    >
                      <div className="h-px bg-[color:var(--color-fg)]" />
                      <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-[color:var(--color-fg)]" />
                    </div>
                  )}
                  {/* Citas — clampeadas al rango [HOUR_START, HOUR_END].
                      Si una cita empieza antes o termina después, ajustamos
                      top/height para que no flote fuera de la grilla. */}
                  {barberAppts.map((a) => {
                    const s = new Date(a.startsAt);
                    const e = new Date(a.endsAt);
                    const rawStartMin = (s.getHours() - HOUR_START) * 60 + s.getMinutes();
                    const rawEndMin = (e.getHours() - HOUR_START) * 60 + e.getMinutes();
                    const dayMax = (HOUR_END - HOUR_START) * 60;
                    // Skip si la cita está completamente fuera de la grilla.
                    if (rawEndMin <= 0 || rawStartMin >= dayMax) return null;
                    const startMin = Math.max(rawStartMin, 0);
                    const endMin = Math.min(rawEndMin, dayMax);
                    const top = (startMin / 60) * HOUR_HEIGHT;
                    const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 26);
                    const isCancelled = a.status === "CANCELLED";
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setSelected(a);
                        }}
                        className={`absolute left-1 right-1 overflow-hidden rounded-[var(--radius-md)] border px-2 py-1.5 text-left transition hover:scale-[1.01] ${
                          isCancelled
                            ? "border-[color:var(--color-border)] bg-[color:var(--color-surface)] opacity-50"
                            : a.status === "PENDING"
                              ? "border-[color:var(--color-fg-muted)] bg-[color:var(--color-surface)]"
                              : a.status === "COMPLETED"
                                ? "border-[color:var(--color-fg)] bg-[color:var(--color-fg)] text-[color:var(--color-bg)]"
                                : a.status === "NO_SHOW"
                                  ? "border-[color:var(--color-border)] bg-[color:var(--color-surface-muted)] opacity-70"
                                  : "border-[color:var(--color-fg)] bg-[color:var(--color-surface)]"
                        }`}
                        style={{ top, height }}
                      >
                        <p className="truncate text-[0.7rem] font-medium">
                          {formatTime(a.startsAt)} · {a.client?.name ?? "—"}
                        </p>
                        <p className="truncate text-[0.62rem] opacity-80">
                          {a.service?.name}
                        </p>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Side panel — detalles de la cita seleccionada */}
      {selected && (
        <DetailPanel
          appt={selected}
          onClose={() => setSelected(null)}
          onChangeStatus={(s) => changeStatus(selected.id, s)}
          onCancel={() => cancel(selected.id)}
        />
      )}

      {/* Composer — crear cita manual */}
      {composer && (
        <Composer
          services={services}
          barberId={composer.barberId}
          startsAt={composer.startsAt}
          barbers={barbers}
          onClose={() => setComposer(null)}
          onCreated={async () => {
            setComposer(null);
            await refresh();
          }}
        />
      )}
    </section>
  );
}

function DetailPanel({
  appt,
  onClose,
  onChangeStatus,
  onCancel,
}: {
  appt: AppointmentDto;
  onClose: () => void;
  onChangeStatus: (s: AppointmentDto["status"]) => void;
  onCancel: () => void;
}) {
  const ref = useModal(true, onClose);
  return (
    <div
      className="bc-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-panel-title"
        tabIndex={-1}
        className="h-full w-full max-w-md overflow-y-auto border-l border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar panel de cita"
          className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
        >
          Cerrar ×
        </button>
        <p className="mt-6 text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
          — Cita —
        </p>
        <h2 id="detail-panel-title" className="mt-4 text-3xl font-light tracking-tight">
          {appt.client?.name ?? "Cliente"}
        </h2>
        <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
          {new Date(appt.startsAt).toLocaleString("es-ES", {
            weekday: "long",
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        <dl className="mt-8 space-y-4 border-y border-[color:var(--color-border)] py-6 text-sm">
          <Row label="Servicio" value={appt.service?.name ?? "—"} />
          <Row label="Barbero" value={appt.barber?.name ?? "—"} />
          <Row
            label="Duración"
            value={`${appt.service?.durationMinutes ?? 0} min`}
          />
          <Row
            label="Precio"
            value={
              appt.service?.priceCents !== undefined
                ? formatPrice(appt.service.priceCents)
                : "—"
            }
          />
          <Row label="Email" value={appt.client?.email ?? "—"} />
          <Row label="Teléfono" value={appt.client?.phone ?? "—"} />
        </dl>

        <p className="mt-8 text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
          Estado actual · {STATUS_LABEL[appt.status]}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["PENDING", "CONFIRMED", "COMPLETED", "NO_SHOW"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChangeStatus(s)}
              disabled={appt.status === s}
              className={`rounded-[var(--radius-md)] border px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.22em] transition disabled:opacity-30 ${
                appt.status === s
                  ? "border-[color:var(--color-fg)] bg-[color:var(--color-fg)] text-[color:var(--color-bg)]"
                  : "border-[color:var(--color-border)] text-[color:var(--color-fg-muted)] hover:border-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
              }`}
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {appt.status !== "CANCELLED" && (
          <button
            type="button"
            onClick={onCancel}
            className="mt-10 inline-flex items-center justify-center rounded-[var(--radius-md)] border border-[color:var(--color-fg-muted)] px-5 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)] transition hover:border-[color:var(--color-fg)] hover:text-[color:var(--color-fg)]"
          >
            Cancelar cita
          </button>
        )}
      </div>
    </div>
  );
}

function Composer({
  services,
  barbers,
  barberId,
  startsAt,
  onClose,
  onCreated,
}: {
  services: ServiceDto[];
  barbers: BarberDto[];
  barberId: string;
  startsAt: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [serviceId, setServiceId] = useState<string>(services[0]?.id ?? "");
  const [selectedBarberId, setSelectedBarberId] = useState<string>(barberId);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Convertir el ISO a un valor para input datetime-local (sin tz)
  const initialDateTime = (() => {
    const d = new Date(startsAt);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
  })();
  const [whenLocal, setWhenLocal] = useState(initialDateTime);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!whenLocal) {
      setError("Selecciona una fecha y hora.");
      return;
    }
    const whenDate = new Date(whenLocal);
    if (Number.isNaN(whenDate.getTime())) {
      setError("Fecha u hora inválida.");
      return;
    }
    setSaving(true);
    try {
      const whenIso = whenDate.toISOString();
      await api.createAppointment({
        serviceId,
        barberId: selectedBarberId,
        startsAt: whenIso,
        guest: {
          name: clientName.trim(),
          email: clientEmail.trim().toLowerCase(),
          phone: clientPhone.trim(),
        },
        notes: notes.trim() || undefined,
      });
      onCreated();
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSaving(false);
    }
  }

  const ref = useModal(true, onClose);
  return (
    <div
      className="bc-modal-backdrop is-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="composer-title"
        tabIndex={-1}
        className="w-full max-w-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8 outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar nueva cita"
          className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
        >
          Cerrar ×
        </button>
        <p className="mt-6 text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
          — Nueva cita —
        </p>
        <h2 id="composer-title" className="mt-4 text-2xl font-light tracking-tight sm:text-3xl">
          Reservar a mano
        </h2>
        <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">
          Para cuando un cliente llama o llega sin reserva online.
        </p>

        <form onSubmit={submit} className="mt-8 grid gap-5 sm:grid-cols-2">
          <Field label="Servicio" className="sm:col-span-2">
            <select
              required
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[color:var(--color-fg)]"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {s.durationMinutes} min · {formatPrice(s.priceCents)}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Barbero">
            <select
              required
              value={selectedBarberId}
              onChange={(e) => setSelectedBarberId(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[color:var(--color-fg)]"
            >
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cuándo">
            <input
              required
              type="datetime-local"
              value={whenLocal}
              onChange={(e) => setWhenLocal(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[color:var(--color-fg)] outline-none focus:border-[color:var(--color-fg)]"
            />
          </Field>
          <Field label="Nombre del cliente" className="sm:col-span-2">
            <input
              required
              minLength={2}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[color:var(--color-fg)] outline-none focus:border-[color:var(--color-fg)]"
            />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[color:var(--color-fg)] outline-none focus:border-[color:var(--color-fg)]"
            />
          </Field>
          <Field label="Teléfono">
            <input
              required
              minLength={6}
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[color:var(--color-fg)] outline-none focus:border-[color:var(--color-fg)]"
            />
          </Field>
          <Field label="Notas (opcional)" className="sm:col-span-2">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={2}
              className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-bg)] px-3 py-2 text-[color:var(--color-fg)] outline-none focus:border-[color:var(--color-fg)]"
            />
          </Field>

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
              {saving ? "Creando…" : "Crear cita"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
        {label}
      </dt>
      <dd className="text-right text-[color:var(--color-fg)]">{value}</dd>
    </div>
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
