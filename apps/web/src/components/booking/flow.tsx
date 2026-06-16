"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ApiError, api } from "@/lib/api";
import { formatDayLabel, formatDuration, formatPrice, formatTime } from "@/lib/format";
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

// formatTimeAt/formatDateAt aceptan tz explícito (viene de la API en
// availability.tz). Para el step "done" usamos formatTime/formatDayLabel
// de @/lib/format que respetan BUSINESS.timezone.
function formatTimeAt(iso: string, tz: string, locale: string) {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: tz,
  });
}

function formatDateAt(iso: string, tz: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale, {
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
  const t = useTranslations("booking");
  const locale = useLocale();
  // BCP-47 tag para Intl: "en" → "en-US", "es" → "es-ES" (defaults
  // razonables para el mercado del cliente).
  const intlLocale = locale === "es" ? "es-ES" : "en-US";

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
        setSubmitError(t("errors.slotTaken"));
        setStep("datetime");
      } else {
        setSubmitError(err instanceof Error ? err.message : t("errors.unexpected"));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-12">
      {isMock && step !== "done" && (
        <p className="mb-8 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-xs uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
          {t("mockMode")}
        </p>
      )}

      <ProgressBar step={step} />

      {step === "service" && (
        <StepShell title={t("step.service.title")} changeLabel={t("change")}>
          {/* Cortesías de la casa (asesoría, lavado, peinado, bebida) —
              copy provisto por el cliente. Se muestra arriba del listado
              para que quede claro antes de elegir servicio. */}
          <p className="mb-8 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-4 text-sm leading-relaxed text-[color:var(--color-fg-muted)]">
            {t("step.service.intro")}
          </p>
          <ul className="divide-y divide-[color:var(--color-border)] border-y border-[color:var(--color-border)]">
            {services.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setService(s);
                    setStep("barber");
                  }}
                  className="group flex w-full items-start gap-4 py-5 text-left transition hover:opacity-80"
                >
                  {/* Thumbnail opcional. Si no hay photoUrl (estado actual
                      mientras el cliente prepara material), el slot
                      colapsa y la fila se ve como antes. */}
                  {s.photoUrl && (
                    <img
                      src={s.photoUrl}
                      alt=""
                      loading="lazy"
                      className="h-16 w-16 flex-shrink-0 rounded-[var(--radius-md)] object-cover sm:h-20 sm:w-20"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-normal text-[color:var(--color-fg)]">{s.name}</p>
                    <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">
                      {formatPrice(s.priceCents)} · {formatDuration(s.durationMinutes)}
                    </p>
                    {s.description && (
                      <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-fg-muted)]">
                        {s.description}
                      </p>
                    )}
                  </div>
                  <span className="mt-1 flex-shrink-0 text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)] group-hover:text-[color:var(--color-fg)]">
                    {t("step.service.choose")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </StepShell>
      )}

      {step === "barber" && service && (
        <StepShell
          title={t("step.barber.title")}
          summary={`${service.name} · ${formatDuration(service.durationMinutes)}`}
          onBack={() => setStep("service")}
          changeLabel={t("change")}
        >
          <ul className="divide-y divide-[color:var(--color-border)] border-y border-[color:var(--color-border)]">
            {barbers.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => {
                    setBarber(b);
                    setStep("datetime");
                  }}
                  className="group flex w-full items-baseline justify-between gap-6 py-5 text-left transition hover:opacity-80"
                >
                  <div>
                    <p className="text-lg font-normal text-[color:var(--color-fg)]">{b.name}</p>
                    {b.bio && (
                      <p className="mt-1 text-sm text-[color:var(--color-fg-muted)]">{b.bio}</p>
                    )}
                  </div>
                  <span className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)] group-hover:text-[color:var(--color-fg)]">
                    {t("step.barber.choose")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </StepShell>
      )}

      {step === "datetime" && service && barber && (
        <StepShell
          title={t("step.datetime.title")}
          summary={t("step.datetime.summary", { service: service.name, barber: barber.name })}
          onBack={() => setStep("barber")}
          changeLabel={t("change")}
        >
          {submitError && <Notice>{submitError}</Notice>}

          <div className="mb-8 flex flex-wrap gap-2">
            {upcomingDates.map((d) => {
              const selected = d === date;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDate(d)}
                  className={`rounded-[var(--radius-md)] border px-3 py-2 text-xs uppercase tracking-[0.16em] transition ${
                    selected
                      ? "border-[color:var(--color-fg)] bg-[color:var(--color-fg)] text-[color:var(--color-bg)]"
                      : "border-[color:var(--color-border)] bg-transparent text-[color:var(--color-fg-muted)] hover:border-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
                  }`}
                >
                  {new Date(`${d}T12:00:00Z`).toLocaleDateString(intlLocale, {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </button>
              );
            })}
          </div>

          {loadingSlots ? (
            <p className="text-sm uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
              {t("step.datetime.loading")}
            </p>
          ) : !availability || availability.slots.length === 0 ? (
            <p className="text-[color:var(--color-fg-muted)]">
              {t("step.datetime.empty")}
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
                  className="rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-transparent px-3 py-2 text-sm transition hover:border-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface)]"
                >
                  {formatTimeAt(s.startsAt, availability.tz, intlLocale)}
                </button>
              ))}
            </div>
          )}
        </StepShell>
      )}

      {step === "contact" && service && barber && slot && availability && (
        <StepShell
          title={t("step.contact.title")}
          summary={`${service.name} · ${barber.name} · ${formatDateAt(slot.startsAt, availability.tz, intlLocale)} ${formatTimeAt(slot.startsAt, availability.tz, intlLocale)}`}
          onBack={() => setStep("datetime")}
          changeLabel={t("change")}
        >
          <form
            className="grid gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <Field label={t("step.contact.name")}>
              <input
                required
                minLength={2}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-[color:var(--color-fg)] outline-none transition focus:border-[color:var(--color-fg)]"
              />
            </Field>
            <Field label={t("step.contact.email")}>
              <input
                required
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-[color:var(--color-fg)] outline-none transition focus:border-[color:var(--color-fg)]"
              />
            </Field>
            <Field label={t("step.contact.phone")}>
              <input
                required
                minLength={6}
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-[color:var(--color-fg)] outline-none transition focus:border-[color:var(--color-fg)]"
              />
            </Field>

            {submitError && <Notice>{submitError}</Notice>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-fg)] px-6 py-3 text-sm font-medium uppercase tracking-[0.18em] text-[color:var(--color-bg)] transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? t("step.contact.submitting") : t("step.contact.submit")}
            </button>
          </form>
        </StepShell>
      )}

      {step === "done" && confirmed && (
        <div className="mt-10 border-y border-[color:var(--color-border)] py-12">
          <p className="text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
            {t("step.done.label")}
          </p>
          <h2 className="mt-4 text-3xl font-light tracking-tight sm:text-4xl">
            {t("step.done.title")}
          </h2>
          <dl className="mt-10 grid gap-3 text-[color:var(--color-fg-muted)]">
            <Row label={t("step.done.row.service")} value={confirmed.service?.name ?? ""} />
            <Row label={t("step.done.row.barber")} value={confirmed.barber?.name ?? ""} />
            <Row
              label={t("step.done.row.when")}
              value={`${formatDayLabel(confirmed.startsAt)} · ${formatTime(confirmed.startsAt)}`}
            />
          </dl>
          {/* Recordatorio de puntualidad (provisto por el cliente).
              Destacado con borde y fondo para que no se pase por alto. */}
          <p className="mt-10 rounded-[var(--radius-md)] border border-[color:var(--color-fg-muted)] bg-[color:var(--color-surface)] px-5 py-4 text-sm leading-relaxed text-[color:var(--color-fg)]">
            {t("step.done.advice")}
          </p>
          <a
            href="/"
            className="mt-10 inline-block text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)] underline-offset-4 transition hover:text-[color:var(--color-fg)] hover:underline"
          >
            {t("step.done.homeLink")}
          </a>
        </div>
      )}
    </div>
  );
}

function ProgressBar({ step }: { step: Step }) {
  const t = useTranslations("booking.progress");
  const steps: { id: Step; label: string }[] = [
    { id: "service", label: t("service") },
    { id: "barber", label: t("barber") },
    { id: "datetime", label: t("datetime") },
    { id: "contact", label: t("contact") },
  ];
  const order = ["service", "barber", "datetime", "contact", "done"] as const;
  const currentIndex = order.indexOf(step);
  return (
    <ol className="mb-10 flex flex-wrap items-center gap-3 text-[0.65rem] uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
      {steps.map((s) => {
        const active = order.indexOf(s.id) <= currentIndex;
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={`h-px w-8 transition ${
                active ? "bg-[color:var(--color-fg)]" : "bg-[color:var(--color-border)]"
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
  changeLabel,
  children,
}: {
  title: string;
  summary?: string;
  onBack?: () => void;
  changeLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-2">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-2xl font-light tracking-tight sm:text-3xl">{title}</h2>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)] underline-offset-4 transition hover:text-[color:var(--color-fg)] hover:underline"
          >
            {changeLabel}
          </button>
        )}
      </div>
      {summary && (
        <p className="mt-2 text-sm text-[color:var(--color-fg-muted)]">{summary}</p>
      )}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)]">
        {label}
      </span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-[color:var(--color-border)] py-3">
      <dt className="text-xs uppercase tracking-[0.22em]">{label}</dt>
      <dd className="text-right text-[color:var(--color-fg)]">{value}</dd>
    </div>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-4 rounded-[var(--radius-md)] border border-[color:var(--color-fg-muted)] bg-[color:var(--color-surface)] px-4 py-3 text-sm text-[color:var(--color-fg)]">
      {children}
    </p>
  );
}
