// Datos mock — usados sólo cuando NEXT_PUBLIC_API_URL no está definida.
// Mantienen el shape exacto de la API real para que el día que enchufemos
// el backend la UI no cambie.

import type {
  AppointmentDto,
  AvailabilityResponseDto,
  BarberDto,
  CreateAppointmentInputDto,
  ServiceDto,
} from "./types";

const SERVICES: ServiceDto[] = [
  {
    id: "svc-corte",
    name: "Corte clásico",
    description: "Tijera + máquina, lavado incluido.",
    durationMinutes: 30,
    priceCents: 1500,
    isActive: true,
  },
  {
    id: "svc-corte-barba",
    name: "Corte + barba",
    description: "Servicio completo, toalla caliente.",
    durationMinutes: 45,
    priceCents: 2200,
    isActive: true,
  },
  {
    id: "svc-barba",
    name: "Arreglo de barba",
    description: "Perfilado y aceite.",
    durationMinutes: 20,
    priceCents: 1000,
    isActive: true,
  },
  {
    id: "svc-afeitado",
    name: "Afeitado tradicional",
    description: "Navaja, toalla caliente, after-shave.",
    durationMinutes: 40,
    priceCents: 1800,
    isActive: true,
  },
];

const BARBERS: BarberDto[] = [
  {
    id: "barb-juan",
    userId: "user-juan",
    name: "Juan",
    email: "juan@barberia.com",
    phone: null,
    bio: "10 años cortando. Especialista en fade.",
    photoUrl: null,
    isActive: true,
    workingHours: [
      { id: "wh1", barberId: "barb-juan", weekday: 1, startMin: 540, endMin: 1080 },
      { id: "wh2", barberId: "barb-juan", weekday: 2, startMin: 540, endMin: 1080 },
      { id: "wh3", barberId: "barb-juan", weekday: 3, startMin: 540, endMin: 1080 },
      { id: "wh4", barberId: "barb-juan", weekday: 4, startMin: 540, endMin: 1080 },
      { id: "wh5", barberId: "barb-juan", weekday: 5, startMin: 540, endMin: 1080 },
      { id: "wh6", barberId: "barb-juan", weekday: 6, startMin: 600, endMin: 840 },
    ],
  },
  {
    id: "barb-luis",
    userId: "user-luis",
    name: "Luis",
    email: "luis@barberia.com",
    phone: null,
    bio: "Estilo clásico, barbas y afeitado.",
    photoUrl: null,
    isActive: true,
    workingHours: [
      { id: "wh7", barberId: "barb-luis", weekday: 2, startMin: 660, endMin: 1200 },
      { id: "wh8", barberId: "barb-luis", weekday: 3, startMin: 660, endMin: 1200 },
      { id: "wh9", barberId: "barb-luis", weekday: 4, startMin: 660, endMin: 1200 },
      { id: "wh10", barberId: "barb-luis", weekday: 5, startMin: 660, endMin: 1200 },
      { id: "wh11", barberId: "barb-luis", weekday: 6, startMin: 600, endMin: 1080 },
    ],
  },
];

const BOOKINGS = new Set<string>(); // claves "barberId|startsAt"

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function generateMockSlots(barberId: string, date: string, durationMinutes: number) {
  const barber = BARBERS.find((b) => b.id === barberId);
  if (!barber || !barber.workingHours) return [];

  // weekday: 0=domingo … 6=sábado (UTC simplificado para mock)
  const [y, m, d] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(y!, m! - 1, d!)).getUTCDay();
  const blocks = barber.workingHours.filter((w) => w.weekday === weekday);

  const slots: { startsAt: string; endsAt: string }[] = [];
  for (const block of blocks) {
    for (let min = block.startMin; min + durationMinutes <= block.endMin; min += 30) {
      const hh = Math.floor(min / 60);
      const mm = min % 60;
      const hhEnd = Math.floor((min + durationMinutes) / 60);
      const mmEnd = (min + durationMinutes) % 60;
      // En mock asumimos -04:00 (Caracas). Suficiente para visualizar.
      const startsAt = `${date}T${pad(hh)}:${pad(mm)}:00-04:00`;
      const endsAt = `${date}T${pad(hhEnd)}:${pad(mmEnd)}:00-04:00`;
      const key = `${barberId}|${new Date(startsAt).toISOString()}`;
      if (BOOKINGS.has(key)) continue;
      slots.push({
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      });
    }
  }
  return slots;
}

export const mockApi = {
  async listServices(): Promise<ServiceDto[]> {
    return SERVICES.filter((s) => s.isActive);
  },
  async listBarbers(): Promise<BarberDto[]> {
    return BARBERS.filter((b) => b.isActive);
  },
  async getAvailability(
    barberId: string,
    serviceId: string,
    date: string,
  ): Promise<AvailabilityResponseDto> {
    const service = SERVICES.find((s) => s.id === serviceId);
    const slots = service ? generateMockSlots(barberId, date, service.durationMinutes) : [];
    return {
      date,
      tz: "America/Caracas",
      durationMinutes: service?.durationMinutes ?? 30,
      slots,
    };
  },
  async createAppointment(input: CreateAppointmentInputDto): Promise<AppointmentDto> {
    const service = SERVICES.find((s) => s.id === input.serviceId);
    const barber = BARBERS.find((b) => b.id === input.barberId);
    if (!service || !barber) {
      throw new Error("Servicio o barbero no existe (mock)");
    }
    const key = `${input.barberId}|${new Date(input.startsAt).toISOString()}`;
    if (BOOKINGS.has(key)) {
      throw new Error("Slot ya reservado (mock)");
    }
    BOOKINGS.add(key);
    const endsAt = new Date(
      new Date(input.startsAt).getTime() + service.durationMinutes * 60_000,
    ).toISOString();
    return {
      id: `appt-${Date.now()}`,
      clientId: "mock-client",
      barberId: barber.id,
      serviceId: service.id,
      startsAt: new Date(input.startsAt).toISOString(),
      endsAt,
      status: "PENDING",
      notes: input.notes ?? null,
      createdAt: new Date().toISOString(),
      client: input.guest
        ? { name: input.guest.name, email: input.guest.email, phone: input.guest.phone }
        : undefined,
      barber: { id: barber.id, name: barber.name },
      service: {
        id: service.id,
        name: service.name,
        durationMinutes: service.durationMinutes,
        priceCents: service.priceCents,
      },
    };
  },
};
