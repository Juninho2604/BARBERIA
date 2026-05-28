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
  CreateAppointmentInputDto,
  CreateBarberInputDto,
  CreateServiceInputDto,
  CreateTimeOffInputDto,
  LoginInputDto,
  ServiceDto,
  TimeOffDto,
  UpdateServiceInputDto,
} from "./types";
import { ApiError } from "./api-error";
import { mockApi } from "./mock";

export { ApiError };

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

function useMock() {
  return !API_URL;
}

interface HttpOptions extends RequestInit {
  token?: string;
}

async function http<T>(path: string, options: HttpOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
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
  async deleteBarber(id: string, token: string): Promise<void> {
    if (useMock()) return mockApi.deleteBarber(id, token);
    return http<void>(`/barbers/${id}`, { method: "DELETE", token });
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

  async adminListAppointments(token: string): Promise<AppointmentDto[]> {
    if (useMock()) return mockApi.adminListAppointments(token);
    return http<AppointmentDto[]>("/appointments", { token });
  },
  async cancelAppointment(id: string, token: string): Promise<AppointmentDto> {
    if (useMock()) return mockApi.cancelAppointment(id, token);
    return http<AppointmentDto>(`/appointments/${id}/cancel`, {
      method: "PATCH",
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
};
