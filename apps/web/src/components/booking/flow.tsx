"use client";

import { useEffect, useMemo, useState } from "react";
import { ApiError, api } from "@/lib/api";
import type {
  AppointmentDto,
  AvailabilityResponseDto,
  BarberDto,
  ServiceDto,
} from "@/lib/types";

type Step = "service" | "barber" | "datetime" | "contact" | "done";

interface Props {
  services: ServiceDto[];
  barbers: BarberDto[];
}

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatLocalTime(iso: string, tz: string) {
  return new Date(iso).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });
}

function formatLocalDate(iso: string, tz: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: tz,
  });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateIso: string, days: number) {
  const d = new Date(`${dateIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function BookingFlow({ services, barbers }: Props) {
  const [step, setStep] = useState<Step>("service");
  const [service, setService] = useState<ServiceDto | null>(null);
  const [barber, setBarber] = useState<BarberDto | null>(null);
  const [date, setDate] = useState<string>(todayIso());
  const [availability, setAvailability] = useState<AvailabilityResponseDto | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slot, setSlot] = useState<{ startsAt: string; endsAt: string } | null>(null);

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<AppointmentDto | null>(null);

  const isMock = api.isMock();
  const upcomingDates = useMemo(
    () => Array.from({ length: 14 }, (_, i) => addDays(todayIso(), i)),
    [],
  );

  useEffect(() => {
    if (step !== "datetime" || !service || !barber) return;
    let cancelled = false;
    setLoadingSlots(true);
    setSlot(null);
    api
      .getAvailability(barber.id, service.id, date)
      .then((r) => !cancelled && setAvailability(r))
      .catch(() => !cancelled && setAvailability(null))
      .finally(() => !cancelled && setLoadingSlots(false));
    return () => {
      cancelled = true;
    };
  }, [step, service, barber, date]);

  async function submit() {
    if (!service || !barber || !slot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const created = await api.createAppointment({
        serviceId: service.id,
        barberId: barber.id,
        startsAt: slot.startsAt,
        guest: {
          name: guestName.trim(),
          email: guestEmail.trim(),
          phone: guestPhone.trim(),
        },
      });
      setConfirmed(created);
      setStep("done");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSubmitError("Ese horario acaba de ser reservado. Elige otro.");
        setStep("datetime");
      } else {
        setSubmitError(err instanceof Error ? err.message : "Error inesperado");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-10">
      {isMock && step !== "done" && (
        <p className="mb-6 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-sm text-[color:var(--color-fg-muted)]">
          Modo demo — los datos son de prueba.
        </p>
      )}

      <ProgressBar step={step} />

      {step === "service" && (
        <StepShell title="¿Qué te haces?">
          <ul className="grid gap-3">
            {services.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setService(s);
                    setStep("barber");
                  }}
                  className="flex w-full items-center justify-between rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 text-left transition hover:border-[color:var(--color-accent)]"
                >
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                      {s.durationMinutes} min
                    </p>
                  </div>
                  <p className="font-[family-name:var(--font-display)] text-xl text-[color:var(--color-accent)]">
                    {formatPrice(s.priceCents)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </StepShell>
      )}

      {step === "barber" && service && (
        <StepShell
          title="¿Con quién?"
          summary={`${service.name} · ${service.durationMinutes} min`}
          onBack={() => setStep("service")}
        >
          <ul className="grid gap-3">
            {barbers.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => {
                    setBarber(b);
                    setStep("datetime");
                  }}
                  className="flex w-full items-center justify-between rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 text-left transition hover:border-[color:var(--color-accent)]"
                >
                  <div>
                    <p className="font-medium">{b.name}</p>
                    {b.bio && (
                      <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                        {b.bio}
                      </p>
                    )}
                  </div>
                  <span className="text-[color:var(--color-fg-muted)]">→</span>
                </button>
              </li>
            ))}
          </ul>
        </StepShell>
      )}

      {step === "datetime" && service && barber && (
        <StepShell
          title="¿Cuándo?"
          summary={`${service.name} con ${barber.name}`}
          onBack={() => setStep("barber")}
        >
          {submitError && (
            <p className="mb-4 rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
              {submitError}
            </p>
          )}
          <div className="mb-6 flex flex-wrap gap-2">
            {upcomingDates.map((d) => {
              const selected = d === date;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDate(d)}
                  className={`rounded-[var(--radius-md)] border px-3 py-2 text-sm transition ${
                    selected
                      ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)]"
                      : "border-[color:var(--color-border)] bg-[color:var(--color-surface)] hover:border-[color:var(--color-accent)]"
                  }`}
                >
                  {new Date(`${d}T12:00:00Z`).toLocaleDateString("es-ES", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </button>
              );
            })}
          </div>

          {loadingSlots ? (
            <p className="text-[color:var(--color-fg-muted)]">Buscando horarios…</p>
          ) : !availability || availability.slots.length === 0 ? (
            <p className="text-[color:var(--color-fg-muted)]">
              No hay horarios disponibles ese día. Prueba otra fecha.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {availability.slots.map((s) => (
                <button
                  key={s.startsAt}
                  type="button"
                  onClick={() => {
                    setSlot(s);
                    setStep("contact");
                  }}
                  className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-sm transition hover:border-[color:var(--color-accent)]"
                >
                  {formatLocalTime(s.startsAt, availability.tz)}
                </button>
              ))}
            </div>
          )}
        </StepShell>
      )}

      {step === "contact" && service && barber && slot && availability && (
        <StepShell
          title="Tus datos"
          summary={`${service.name} · ${barber.name} · ${formatLocalDate(slot.startsAt, availability.tz)} ${formatLocalTime(slot.startsAt, availability.tz)}`}
          onBack={() => setStep("datetime")}
        >
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Field label="Nombre">
              <input
                required
                minLength={2}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
              />
            </Field>
            <Field label="Email">
              <input
                required
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
              />
            </Field>
            <Field label="Teléfono">
              <input
                required
                minLength={6}
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 outline-none focus:border-[color:var(--color-accent)]"
              />
            </Field>

            {submitError && (
              <p className="rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 rounded-[var(--radius-md)] bg-[color:var(--color-accent)] px-6 py-3 font-medium text-[color:var(--color-accent-fg)] transition hover:brightness-110 disabled:opacity-50"
            >
              {submitting ? "Reservando…" : "Confirmar reserva"}
            </button>
          </form>
        </StepShell>
      )}

      {step === "done" && confirmed && (
        <div className="mt-8 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-8">
          <p className="text-sm uppercase tracking-[0.3em] text-[color:var(--color-accent)]">
            Reserva confirmada
          </p>
          <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl">
            Te esperamos
          </h2>
          <dl className="mt-6 grid gap-3 text-[color:var(--color-fg-muted)]">
            <Row label="Servicio" value={confirmed.service?.name ?? ""} />
            <Row label="Barbero" value={confirmed.barber?.name ?? ""} />
            <Row
              label="Cuándo"
              value={`${formatLocalDate(confirmed.startsAt, "America/Caracas")} · ${formatLocalTime(confirmed.startsAt, "America/Caracas")}`}
            />
          </dl>
          <a
            href="/"
            className="mt-8 inline-block text-sm text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
          >
            ← Volver al inicio
          </a>
        </div>
      )}
    </div>
  );
}

function ProgressBar({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "service", label: "Servicio" },
    { id: "barber", label: "Barbero" },
    { id: "datetime", label: "Horario" },
    { id: "contact", label: "Datos" },
  ];
  const order = ["service", "barber", "datetime", "contact", "done"] as const;
  const currentIndex = order.indexOf(step);
  return (
    <ol className="mb-8 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[color:var(--color-fg-muted)]">
      {steps.map((s, i) => {
        const active = order.indexOf(s.id) <= currentIndex;
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={`h-1.5 w-6 rounded-full ${
                active ? "bg-[color:var(--color-accent)]" : "bg-[color:var(--color-border)]"
              }`}
            />
            <span className={active ? "text-[color:var(--color-fg)]" : ""}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function StepShell({
  title,
  summary,
  onBack,
  children,
}: {
  title: string;
  summary?: string;
  onBack?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-2">
      <div className="flex items-baseline justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-2xl">{title}</h2>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
          >
            ← Cambiar
          </button>
        )}
      </div>
      {summary && (
        <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">{summary}</p>
      )}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-[color:var(--color-fg-muted)]">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-[color:var(--color-border)] pb-2">
      <dt>{label}</dt>
      <dd className="text-[color:var(--color-fg)]">{value}</dd>
    </div>
  );
}
