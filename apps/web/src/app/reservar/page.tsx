import { api } from "@/lib/api";
import { BookingFlow } from "@/components/booking/flow";

export const metadata = {
  title: "Reservar — Barbería",
};

export default async function ReservarPage() {
  const [services, barbers] = await Promise.all([
    api.listServices().catch(() => []),
    api.listBarbers().catch(() => []),
  ]);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <a
          href="/"
          className="text-sm text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
        >
          ← Volver
        </a>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl sm:text-5xl">
          Reservar cita
        </h1>
        <p className="mt-3 text-[color:var(--color-fg-muted)]">
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
