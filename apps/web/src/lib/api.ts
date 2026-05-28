// Cliente HTTP de la API. Si NEXT_PUBLIC_API_URL no está configurada, devolvemos
// datos mock para que la UI sea visible en Vercel mientras el VPS no esté expuesto.
//
// Una vez tengamos dominio + API expuesta:
//   Vercel env -> NEXT_PUBLIC_API_URL=https://api.midominio.com
// y todo este módulo se redirige automáticamente.

import type {
  AppointmentDto,
  AvailabilityResponseDto,
  BarberDto,
  CreateAppointmentInputDto,
  ServiceDto,
} from "./types";
import { mockApi } from "./mock";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

function useMock() {
  return !API_URL;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
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

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const api = {
  isMock: useMock,
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
  ): Promise<AppointmentDto> {
    if (useMock()) return mockApi.createAppointment(input);
    return http<AppointmentDto>("/appointments", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
