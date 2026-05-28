import { api } from "@/lib/api";
import { BookingFlow } from "@/components/booking/flow";

export const metadata = {
  title: "Reservar — Brothers Club Barbershop",
};

export default async function ReservarPage() {
  const [services, barbers] = await Promise.all([
    api.listServices().catch(() => []),
    api.listBarbers().catch(() => []),
  ]);

  return (
    <main className="min-h-screen bg-[color:var(--color-bg)]">
      <div className="mx-auto max-w-3xl px-6 py-20 sm:py-24">
        <a
          href="/"
          className="text-xs uppercase tracking-[0.22em] text-[color:var(--color-fg-muted)] underline-offset-4 transition hover:text-[color:var(--color-fg)] hover:underline"
        >
          ← Volver
        </a>
        <p className="mt-10 text-xs uppercase tracking-[0.28em] text-[color:var(--color-fg-muted)]">
          — Reserva —
        </p>
        <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">
          Reservar cita
        </h1>
        <p className="mt-4 max-w-xl text-[color:var(--color-fg-muted)]">
          Elige servicio, barbero y horario. Sin cuenta necesaria.
        </p>

        {services.length === 0 || barbers.length === 0 ? (
          <p className="mt-12 rounded-[var(--radius-md)] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 text-[color:var(--color-fg-muted)]">
            Aún no hay servicios o barberos configurados. Vuelve pronto.
          </p>
        ) : (
          <BookingFlow services={services} barbers={barbers} />
        )}
      </div>
    </main>
  );
}
