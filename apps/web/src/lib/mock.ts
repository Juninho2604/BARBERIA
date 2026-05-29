// Datos mock — usados sólo cuando NEXT_PUBLIC_API_URL no está definida.
// Mantienen el shape exacto de la API real para que el día que enchufemos
// el backend la UI no cambie.
//
// Persistencia: en memoria del proceso del navegador. Una recarga lo resetea.
// Es suficiente para demo. Cuando llegue el dominio + var de entorno esto deja
// de usarse.

import { ApiError } from "./api-error";
import type {
  AppointmentDto,
  AuthSessionDto,
  AuthUserDto,
  AvailabilityResponseDto,
  BarberDto,
  CreateAppointmentInputDto,
  CreateBarberInputDto,
  CreateServiceInputDto,
  CreateTimeOffInputDto,
  InviteStaffInputDto,
  LoginInputDto,
  ServiceDto,
  StaffMemberDto,
  TimeOffDto,
  UpdateServiceInputDto,
  UpdateStaffInputDto,
} from "./types";

// Catálogo oficial de Brothers Club Barbershop.
// Pendiente confirmar: si Eyebrow Wax y servicios posteriores existen
// (la última captura del cliente quedó cortada en "Eyebrow Wax").
const services: ServiceDto[] = [
  {
    id: "svc-royal-package",
    name: "Royal Package",
    description: "Signature treatment.",
    durationMinutes: 60,
    priceCents: 11500,
    isActive: true,
  },
  {
    id: "svc-haircut",
    name: "Haircut",
    description: "Hair & beard.",
    durationMinutes: 30,
    priceCents: 4900,
    isActive: true,
  },
  {
    id: "svc-king-shave",
    name: "King Shave",
    description: "Hair & beard.",
    durationMinutes: 30,
    priceCents: 4500,
    isActive: true,
  },
  {
    id: "svc-balding-head-shave",
    name: "Balding Head Shave",
    description: "Hair & beard.",
    durationMinutes: 30,
    priceCents: 5000,
    isActive: true,
  },
  {
    id: "svc-beard-trim",
    name: "Beard Trim",
    description: "Hair & beard.",
    durationMinutes: 30,
    priceCents: 2500,
    isActive: true,
  },
  {
    id: "svc-black-mask",
    name: "Black Mask",
    description: "Spa & skin boosters.",
    durationMinutes: 5,
    priceCents: 2000,
    isActive: true,
  },
  {
    id: "svc-detox-mask",
    name: "Nourishing / Purifying Detox Mask",
    description: "Spa & skin boosters.",
    durationMinutes: 15,
    priceCents: 2000,
    isActive: true,
  },
  {
    id: "svc-ear-wax",
    name: "Ear Wax",
    description: "Wax services.",
    durationMinutes: 5,
    priceCents: 1500,
    isActive: true,
  },
  {
    id: "svc-nose-wax",
    name: "Nose Wax",
    description: "Wax services.",
    durationMinutes: 5,
    priceCents: 1500,
    isActive: true,
  },
  {
    id: "svc-eyebrow-wax",
    name: "Eyebrow Wax",
    description: "Wax services.",
    durationMinutes: 5,
    priceCents: 1500,
    isActive: true,
  },
];

const barbers: BarberDto[] = [
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

const timeOffs: TimeOffDto[] = [];
const appointments: AppointmentDto[] = [];

const BOOKINGS = new Set<string>(); // claves "barberId|startsAt"

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function generateMockSlots(barberId: string, date: string, durationMinutes: number) {
  const barber = barbers.find((b) => b.id === barberId);
  if (!barber || !barber.workingHours) return [];

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
      const startsAt = new Date(
        `${date}T${pad(hh)}:${pad(mm)}:00-04:00`,
      ).toISOString();
      const endsAt = new Date(
        `${date}T${pad(hhEnd)}:${pad(mmEnd)}:00-04:00`,
      ).toISOString();
      const key = `${barberId}|${startsAt}`;
      if (BOOKINGS.has(key)) continue;
      slots.push({ startsAt, endsAt });
    }
  }
  return slots;
}

// --- auth + staff ---

const nowIso = () => new Date().toISOString();

// Equipo demo. El que abra la sesión asume identidad del primero (OWNER).
const staffMembers: StaffMemberDto[] = [
  {
    id: "user-owner",
    email: "owner@brothersclub.co",
    name: "Owner Demo",
    phone: null,
    role: "OWNER",
    isActive: true,
    barberId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: nowIso(),
  },
  {
    id: "user-manager",
    email: "manager@brothersclub.co",
    name: "Carla Manager",
    phone: "+1 305 555 0102",
    role: "MANAGER",
    isActive: true,
    barberId: null,
    createdAt: "2026-02-01T00:00:00.000Z",
    lastLoginAt: null,
  },
  {
    id: "user-reception",
    email: "reception@brothersclub.co",
    name: "Sofía Recepción",
    phone: "+1 305 555 0103",
    role: "RECEPTIONIST",
    isActive: true,
    barberId: null,
    createdAt: "2026-02-10T00:00:00.000Z",
    lastLoginAt: null,
  },
  {
    id: "user-juan",
    email: "juan@brothersclub.co",
    name: "Juan",
    phone: null,
    role: "BARBER",
    isActive: true,
    barberId: "barb-juan",
    createdAt: "2026-01-15T00:00:00.000Z",
    lastLoginAt: null,
  },
  {
    id: "user-luis",
    email: "luis@brothersclub.co",
    name: "Luis",
    phone: null,
    role: "BARBER",
    isActive: true,
    barberId: "barb-luis",
    createdAt: "2026-01-20T00:00:00.000Z",
    lastLoginAt: null,
  },
];

const MOCK_OWNER: AuthUserDto = {
  id: staffMembers[0]!.id,
  email: staffMembers[0]!.email,
  name: staffMembers[0]!.name,
  phone: staffMembers[0]!.phone,
  role: staffMembers[0]!.role,
};

function fakeToken(): string {
  return `mock-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function assertAdminToken(token: string) {
  if (!token.startsWith("mock-")) {
    throw new ApiError(401, "Token mock inválido");
  }
}

export const mockApi = {
  async listServices(): Promise<ServiceDto[]> {
    return services.filter((s) => s.isActive);
  },
  async listBarbers(): Promise<BarberDto[]> {
    return barbers.filter((b) => b.isActive);
  },
  async getAvailability(
    barberId: string,
    serviceId: string,
    date: string,
  ): Promise<AvailabilityResponseDto> {
    const service = services.find((s) => s.id === serviceId);
    const slots = service ? generateMockSlots(barberId, date, service.durationMinutes) : [];
    return {
      date,
      tz: "America/Caracas",
      durationMinutes: service?.durationMinutes ?? 30,
      slots,
    };
  },
  async createAppointment(input: CreateAppointmentInputDto): Promise<AppointmentDto> {
    const service = services.find((s) => s.id === input.serviceId);
    const barber = barbers.find((b) => b.id === input.barberId);
    if (!service || !barber) {
      throw new ApiError(404, "Servicio o barbero no existe (mock)");
    }
    const key = `${input.barberId}|${new Date(input.startsAt).toISOString()}`;
    if (BOOKINGS.has(key)) {
      throw new ApiError(409, "Slot ya reservado (mock)");
    }
    BOOKINGS.add(key);
    const endsAt = new Date(
      new Date(input.startsAt).getTime() + service.durationMinutes * 60_000,
    ).toISOString();
    const created: AppointmentDto = {
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
    appointments.push(created);
    return created;
  },

  // --- auth ---
  async login(_input: LoginInputDto): Promise<AuthSessionDto> {
    // En modo demo aceptamos cualquier credencial y devolvemos sesión owner.
    return {
      user: MOCK_OWNER,
      tokens: { accessToken: fakeToken(), refreshToken: fakeToken() },
    };
  },
  async me(token: string): Promise<AuthUserDto> {
    assertAdminToken(token);
    return MOCK_OWNER;
  },

  // --- admin: staff ---
  async adminListStaff(token: string): Promise<StaffMemberDto[]> {
    assertAdminToken(token);
    return [...staffMembers];
  },
  async adminInviteStaff(input: InviteStaffInputDto, token: string): Promise<StaffMemberDto> {
    assertAdminToken(token);
    if (staffMembers.some((s) => s.email.toLowerCase() === input.email.toLowerCase())) {
      throw new ApiError(409, "Ya existe un miembro con ese email");
    }
    const created: StaffMemberDto = {
      id: `user-${Date.now()}`,
      email: input.email.toLowerCase(),
      name: input.name.trim(),
      phone: null,
      role: input.role,
      isActive: true,
      barberId: input.barberId ?? null,
      createdAt: nowIso(),
      lastLoginAt: null,
    };
    staffMembers.push(created);
    return created;
  },
  async adminUpdateStaff(
    id: string,
    input: UpdateStaffInputDto,
    token: string,
  ): Promise<StaffMemberDto> {
    assertAdminToken(token);
    const idx = staffMembers.findIndex((s) => s.id === id);
    if (idx < 0) throw new ApiError(404, "Miembro no encontrado");
    const cur = staffMembers[idx]!;
    // No permitir degradar al único OWNER.
    if (input.role && cur.role === "OWNER" && input.role !== "OWNER") {
      const owners = staffMembers.filter((s) => s.role === "OWNER" && s.isActive).length;
      if (owners <= 1) throw new ApiError(400, "Debe haber al menos un OWNER activo");
    }
    if (input.isActive === false && cur.role === "OWNER") {
      const owners = staffMembers.filter((s) => s.role === "OWNER" && s.isActive).length;
      if (owners <= 1) throw new ApiError(400, "Debe haber al menos un OWNER activo");
    }
    staffMembers[idx] = {
      ...cur,
      role: input.role ?? cur.role,
      isActive: input.isActive ?? cur.isActive,
      name: input.name?.trim() ?? cur.name,
      phone: input.phone === undefined ? cur.phone : input.phone,
    };
    return staffMembers[idx]!;
  },

  // --- admin: services ---
  async adminListServices(token: string): Promise<ServiceDto[]> {
    assertAdminToken(token);
    return [...services];
  },
  async createService(input: CreateServiceInputDto, token: string): Promise<ServiceDto> {
    assertAdminToken(token);
    const created: ServiceDto = {
      id: `svc-${Date.now()}`,
      name: input.name,
      description: input.description ?? null,
      durationMinutes: input.durationMinutes,
      priceCents: input.priceCents,
      isActive: input.isActive ?? true,
    };
    services.push(created);
    return created;
  },
  async updateService(
    id: string,
    input: UpdateServiceInputDto,
    token: string,
  ): Promise<ServiceDto> {
    assertAdminToken(token);
    const idx = services.findIndex((s) => s.id === id);
    if (idx < 0) throw new ApiError(404, "Servicio no encontrado");
    const cur = services[idx]!;
    services[idx] = {
      ...cur,
      name: input.name ?? cur.name,
      description: input.description ?? cur.description,
      durationMinutes: input.durationMinutes ?? cur.durationMinutes,
      priceCents: input.priceCents ?? cur.priceCents,
      isActive: input.isActive ?? cur.isActive,
    };
    return services[idx]!;
  },
  async deleteService(id: string, token: string): Promise<void> {
    assertAdminToken(token);
    const svc = services.find((s) => s.id === id);
    if (!svc) throw new ApiError(404, "Servicio no encontrado");
    svc.isActive = false;
  },

  // --- admin: barbers ---
  async adminListBarbers(token: string): Promise<BarberDto[]> {
    assertAdminToken(token);
    return [...barbers];
  },
  async createBarber(input: CreateBarberInputDto, token: string): Promise<BarberDto> {
    assertAdminToken(token);
    const id = `barb-${Date.now()}`;
    const userId = `user-${Date.now()}`;
    const created: BarberDto = {
      id,
      userId,
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      bio: input.bio ?? null,
      photoUrl: input.photoUrl ?? null,
      isActive: true,
      workingHours:
        input.workingHours?.map((w, i) => ({
          id: `wh-${id}-${i}`,
          barberId: id,
          weekday: w.weekday,
          startMin: w.startMin,
          endMin: w.endMin,
        })) ?? [],
    };
    barbers.push(created);
    return created;
  },
  async deleteBarber(id: string, token: string): Promise<void> {
    assertAdminToken(token);
    const b = barbers.find((x) => x.id === id);
    if (!b) throw new ApiError(404, "Barbero no encontrado");
    b.isActive = false;
  },
  async getBarber(id: string): Promise<BarberDto | null> {
    return barbers.find((b) => b.id === id) ?? null;
  },
  async setBarberWorkingHours(
    id: string,
    workingHours: { weekday: number; startMin: number; endMin: number }[],
    token: string,
  ): Promise<BarberDto> {
    assertAdminToken(token);
    const b = barbers.find((x) => x.id === id);
    if (!b) throw new ApiError(404, "Barbero no encontrado");
    b.workingHours = workingHours.map((w, i) => ({
      id: `wh-${id}-${i}-${Date.now()}`,
      barberId: id,
      weekday: w.weekday,
      startMin: w.startMin,
      endMin: w.endMin,
    }));
    return b;
  },

  // --- admin: appointments ---
  async adminListAppointments(token: string): Promise<AppointmentDto[]> {
    assertAdminToken(token);
    return [...appointments].sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  },
  async cancelAppointment(id: string, token: string): Promise<AppointmentDto> {
    assertAdminToken(token);
    const appt = appointments.find((a) => a.id === id);
    if (!appt) throw new ApiError(404, "Cita no encontrada");
    appt.status = "CANCELLED";
    return appt;
  },

  // --- time off ---
  async listTimeOff(barberId: string): Promise<TimeOffDto[]> {
    return timeOffs.filter((t) => t.barberId === barberId);
  },
  async createTimeOff(
    barberId: string,
    input: CreateTimeOffInputDto,
    token: string,
  ): Promise<TimeOffDto> {
    assertAdminToken(token);
    const created: TimeOffDto = {
      id: `to-${Date.now()}`,
      barberId,
      startsAt: new Date(input.startsAt).toISOString(),
      endsAt: new Date(input.endsAt).toISOString(),
      reason: input.reason ?? null,
    };
    timeOffs.push(created);
    return created;
  },
  async deleteTimeOff(id: string, token: string): Promise<void> {
    assertAdminToken(token);
    const idx = timeOffs.findIndex((t) => t.id === id);
    if (idx < 0) throw new ApiError(404, "TimeOff no encontrado");
    timeOffs.splice(idx, 1);
  },
};
