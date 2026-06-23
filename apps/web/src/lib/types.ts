// Re-exports tipados desde el paquete compartido para que los componentes
// no tengan que importar zod ni saber del schema.
import type {
  Appointment,
  AuthSession,
  AuthUser,
  AvailabilityResponse,
  Barber,
  ClientDetail,
  ClientSummary,
  CreateAppointmentInput,
  CreateBarberInput,
  UpdateBarberInput,
  CreateServiceInput,
  CreateTimeOffInput,
  InviteStaffInput,
  LoginInput,
  Role,
  Service,
  StaffMember,
  TimeOff,
  UpdateAppointmentInput,
  UpdateClientNotesInput,
  UpdateServiceInput,
  UpdateStaffInput,
} from "@barberia/shared";

export type ServiceDto = Service;
export type CreateServiceInputDto = CreateServiceInput;
export type UpdateServiceInputDto = UpdateServiceInput;
export type BarberDto = Barber;
export type CreateBarberInputDto = CreateBarberInput;
export type UpdateBarberInputDto = UpdateBarberInput;
export type TimeOffDto = TimeOff;
export type CreateTimeOffInputDto = CreateTimeOffInput;
export type AvailabilityResponseDto = AvailabilityResponse;
export type AppointmentDto = Appointment;
export type CreateAppointmentInputDto = CreateAppointmentInput;
export type UpdateAppointmentInputDto = UpdateAppointmentInput;
export type LoginInputDto = LoginInput;
export type AuthSessionDto = AuthSession;
export type AuthUserDto = AuthUser;
export type RoleDto = Role;
export type StaffMemberDto = StaffMember;
export type InviteStaffInputDto = InviteStaffInput;
export type UpdateStaffInputDto = UpdateStaffInput;
export type ClientSummaryDto = ClientSummary;
export type ClientDetailDto = ClientDetail;
export type UpdateClientNotesInputDto = UpdateClientNotesInput;
