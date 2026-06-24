// Cliente HTTP de la API. Si NEXT_PUBLIC_API_URL no está configurada, devolvemos
// datos mock para que la UI sea visible en Vercel mientras el VPS no esté expuesto.
//
// Una vez tengamos dominio + API expuesta:
//   Vercel env -> NEXT_PUBLIC_API_URL=https://api.midominio.com
// y todo este módulo se redirige automáticamente.

import type {
  AppointmentDto,
  AuthSessionDto,
  AuthUserDto,
  AvailabilityResponseDto,
  BarberDto,
  ChangePasswordInputDto,
  CreateAppointmentInputDto,
  CreateBarberInputDto,
  UpdateBarberInputDto,
  CreateServiceInputDto,
  CreateTimeOffInputDto,
  ClientDetailDto,
  ClientSummaryDto,
  InviteStaffInputDto,
  LoginInputDto,
  ServiceDto,
  StaffMemberDto,
  TimeOffDto,
  UpdateAppointmentInputDto,
  UpdateServiceInputDto,
  UpdateStaffInputDto,
} from "./types";
import { ApiError } from "./api-error";
import { mockApi } from "./mock";

export { ApiError };

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

// Cuando renderizamos en el server (SSR/SSG) los fetch relativos como
// "/api/services" fallan porque Node fetch exige URL absoluta. Dentro
// del Docker compose, el contenedor web alcanza al contenedor api por
// la red interna en http://api:4000 (service-name DNS de Docker).
// Configurable vía INTERNAL_API_URL para tests o setups custom.
const INTERNAL_API_URL = process.env.INTERNAL_API_URL?.replace(/\/$/, "") ?? "";

function resolveUrl(path: string): string {
  // En el browser: API_URL ya es la URL pública (vía Nginx en mismo origen).
  if (typeof window !== "undefined") return `${API_URL}${path}`;
  // En el server: si tenemos INTERNAL_API_URL, vamos directo al api
  // container (saltando Nginx → menos latencia y evita el problema
  // de URL relativa). Si no, caemos al API_URL (sirve para dev con
  // backend en localhost absoluto).
  return INTERNAL_API_URL ? `${INTERNAL_API_URL}${path}` : `${API_URL}${path}`;
}

// Failsafe: si el build se sube a producción sin NEXT_PUBLIC_API_URL, el
// cliente caería al mock — donde cualquier credencial autentica como OWNER.
// Para evitar exponer accidentalmente el panel admin (ej. olvidar la env
// var en Vercel), exigimos un opt-in explícito vía
// NEXT_PUBLIC_ALLOW_MOCK=true. En dev/preview es libre.
//
// Para mantener el demo público funcionando: añadir
// `NEXT_PUBLIC_ALLOW_MOCK=true` en Vercel → Settings → Environment Variables.
// El día que enchufemos backend real, basta con definir NEXT_PUBLIC_API_URL
// y eliminar la opt-in.
if (
  !API_URL &&
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PUBLIC_ALLOW_MOCK !== "true"
) {
  throw new Error(
    "[barberia] Modo mock detectado en build de producción sin opt-in. " +
      "El mock acepta cualquier credencial como OWNER y dejaría el panel " +
      "admin abierto. Configura NEXT_PUBLIC_API_URL en Vercel (cuando el " +
      "backend esté listo), o define NEXT_PUBLIC_ALLOW_MOCK=true si el " +
      "demo es deliberado.",
  );
}

function useMock() {
  return !API_URL;
}

interface HttpOptions extends RequestInit {
  token?: string;
}

async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const { token, headers, body, ...rest } = options;
  // Solo enviamos Content-Type cuando hay body. Fastify rechaza con
  // FST_ERR_CTP_EMPTY_JSON_BODY si el content-type es application/json
  // y el body viene vacío (DELETE / PATCH sin payload).
  const hasBody = body !== undefined && body !== null;
  const res = await fetch(resolveUrl(path), {
    ...rest,
    body,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    let detail = "";
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      detail = await res.text();
    }
    throw new ApiError(res.status, detail || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  isMock: useMock,

  // --- públicos ---
  async listServices(): Promise<ServiceDto[]> {
    if (useMock()) return mockApi.listServices();
    return http<ServiceDto[]>("/services");
  },
  async listBarbers(): Promise<BarberDto[]> {
    if (useMock()) return mockApi.listBarbers();
    return http<BarberDto[]>("/barbers");
  },
  async getAvailability(
    barberId: string,
    serviceId: string,
    date: string,
  ): Promise<AvailabilityResponseDto> {
    if (useMock()) return mockApi.getAvailability(barberId, serviceId, date);
    const qs = new URLSearchParams({ serviceId, date });
    return http<AvailabilityResponseDto>(
      `/barbers/${barberId}/availability?${qs.toString()}`,
    );
  },
  async createAppointment(
    input: CreateAppointmentInputDto,
    token?: string,
  ): Promise<AppointmentDto> {
    if (useMock()) return mockApi.createAppointment(input);
    return http<AppointmentDto>("/appointments", {
      method: "POST",
      body: JSON.stringify(input),
      token,
    });
  },

  // --- auth ---
  async login(input: LoginInputDto): Promise<AuthSessionDto> {
    if (useMock()) return mockApi.login(input);
    return http<AuthSessionDto>("/auth/login", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  async me(token: string): Promise<AuthUserDto> {
    if (useMock()) return mockApi.me(token);
    return http<AuthUserDto>("/auth/me", { token });
  },
  async changePassword(
    input: ChangePasswordInputDto,
    token: string,
  ): Promise<void> {
    if (useMock()) return mockApi.changePassword(input, token);
    return http<void>("/auth/change-password", {
      method: "POST",
      body: JSON.stringify(input),
      token,
    });
  },

  // --- admin ---
  async adminListServices(token: string): Promise<ServiceDto[]> {
    if (useMock()) return mockApi.adminListServices(token);
    return http<ServiceDto[]>("/services?includeInactive=true", { token });
  },
  async createService(input: CreateServiceInputDto, token: string): Promise<ServiceDto> {
    if (useMock()) return mockApi.createService(input, token);
    return http<ServiceDto>("/services", {
      method: "POST",
      body: JSON.stringify(input),
      token,
    });
  },
  async updateService(
    id: string,
    input: UpdateServiceInputDto,
    token: string,
  ): Promise<ServiceDto> {
    if (useMock()) return mockApi.updateService(id, input, token);
    return http<ServiceDto>(`/services/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
      token,
    });
  },
  async deleteService(id: string, token: string): Promise<void> {
    if (useMock()) return mockApi.deleteService(id, token);
    return http<void>(`/services/${id}`, { method: "DELETE", token });
  },

  async adminListBarbers(token: string): Promise<BarberDto[]> {
    if (useMock()) return mockApi.adminListBarbers(token);
    return http<BarberDto[]>("/barbers?includeInactive=true", { token });
  },
  async createBarber(input: CreateBarberInputDto, token: string): Promise<BarberDto> {
    if (useMock()) return mockApi.createBarber(input, token);
    return http<BarberDto>("/barbers", {
      method: "POST",
      body: JSON.stringify(input),
      token,
    });
  },
  async updateBarber(
    id: string,
    input: UpdateBarberInputDto,
    token: string,
  ): Promise<BarberDto> {
    if (useMock()) return mockApi.updateBarber(id, input, token);
    return http<BarberDto>(`/barbers/${id}`, {
      method: "PUT",
      body: JSON.stringify(input),
      token,
    });
  },
  async deleteBarber(
    id: string,
    token: string,
    opts?: { purge?: boolean },
  ): Promise<void> {
    if (useMock()) return mockApi.deleteBarber(id, token, opts);
    const qs = opts?.purge ? "?purge=true" : "";
    return http<void>(`/barbers/${id}${qs}`, { method: "DELETE", token });
  },
  async getBarber(id: string): Promise<BarberDto | null> {
    if (useMock()) return mockApi.getBarber(id);
    try {
      return await http<BarberDto>(`/barbers/${id}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },
  async setBarberWorkingHours(
    id: string,
    workingHours: { weekday: number; startMin: number; endMin: number }[],
    token: string,
  ): Promise<BarberDto> {
    if (useMock()) return mockApi.setBarberWorkingHours(id, workingHours, token);
    return http<BarberDto>(`/barbers/${id}/working-hours`, {
      method: "PUT",
      body: JSON.stringify({ workingHours }),
      token,
    });
  },

  async adminListAppointments(
    token: string,
    range?: { from?: string; to?: string; barberId?: string },
  ): Promise<AppointmentDto[]> {
    if (useMock()) return mockApi.adminListAppointments(token, range);
    const qs = new URLSearchParams();
    if (range?.from) qs.set("from", range.from);
    if (range?.to) qs.set("to", range.to);
    if (range?.barberId) qs.set("barberId", range.barberId);
    const tail = qs.toString() ? `?${qs.toString()}` : "";
    return http<AppointmentDto[]>(`/appointments${tail}`, { token });
  },
  async cancelAppointment(id: string, token: string): Promise<AppointmentDto> {
    if (useMock()) return mockApi.cancelAppointment(id, token);
    return http<AppointmentDto>(`/appointments/${id}/cancel`, {
      method: "PATCH",
      token,
    });
  },
  async updateAppointment(
    id: string,
    input: UpdateAppointmentInputDto,
    token: string,
  ): Promise<AppointmentDto> {
    if (useMock()) return mockApi.updateAppointment(id, input, token);
    return http<AppointmentDto>(`/appointments/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      token,
    });
  },

  async listTimeOff(barberId: string): Promise<TimeOffDto[]> {
    if (useMock()) return mockApi.listTimeOff(barberId);
    return http<TimeOffDto[]>(`/barbers/${barberId}/time-off`);
  },
  async createTimeOff(
    barberId: string,
    input: CreateTimeOffInputDto,
    token: string,
  ): Promise<TimeOffDto> {
    if (useMock()) return mockApi.createTimeOff(barberId, input, token);
    return http<TimeOffDto>(`/barbers/${barberId}/time-off`, {
      method: "POST",
      body: JSON.stringify(input),
      token,
    });
  },
  async deleteTimeOff(id: string, token: string): Promise<void> {
    if (useMock()) return mockApi.deleteTimeOff(id, token);
    return http<void>(`/time-off/${id}`, { method: "DELETE", token });
  },

  // --- admin: staff ---
  async adminListStaff(token: string): Promise<StaffMemberDto[]> {
    if (useMock()) return mockApi.adminListStaff(token);
    return http<StaffMemberDto[]>("/staff", { token });
  },
  async adminInviteStaff(
    input: InviteStaffInputDto,
    token: string,
  ): Promise<StaffMemberDto> {
    if (useMock()) return mockApi.adminInviteStaff(input, token);
    return http<StaffMemberDto>("/staff/invite", {
      method: "POST",
      body: JSON.stringify(input),
      token,
    });
  },
  async adminUpdateStaff(
    id: string,
    input: UpdateStaffInputDto,
    token: string,
  ): Promise<StaffMemberDto> {
    if (useMock()) return mockApi.adminUpdateStaff(id, input, token);
    return http<StaffMemberDto>(`/staff/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
      token,
    });
  },

  // --- admin: clients ---
  async adminListClients(token: string): Promise<ClientSummaryDto[]> {
    if (useMock()) return mockApi.adminListClients(token);
    return http<ClientSummaryDto[]>("/clients", { token });
  },
  async adminGetClient(id: string, token: string): Promise<ClientDetailDto | null> {
    if (useMock()) return mockApi.adminGetClient(id, token);
    try {
      return await http<ClientDetailDto>(`/clients/${id}`, { token });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    }
  },
  async adminUpdateClientNotes(
    id: string,
    notes: string,
    token: string,
  ): Promise<ClientSummaryDto> {
    if (useMock()) return mockApi.adminUpdateClientNotes(id, notes, token);
    return http<ClientSummaryDto>(`/clients/${id}/notes`, {
      method: "PATCH",
      body: JSON.stringify({ notes }),
      token,
    });
  },
};
