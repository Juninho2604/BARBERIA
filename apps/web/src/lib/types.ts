// Re-exports tipados desde el paquete compartido para que los componentes
// no tengan que importar zod ni saber del schema.
import type {
  Appointment,
  AvailabilityResponse,
  Barber,
  CreateAppointmentInput,
  Service,
} from "@barberia/shared";

export type ServiceDto = Service;
export type BarberDto = Barber;
export type AvailabilityResponseDto = AvailabilityResponse;
export type AppointmentDto = Appointment;
export type CreateAppointmentInputDto = CreateAppointmentInput;
