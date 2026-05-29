// Re-exports tipados desde el paquete compartido para que los componentes
// no tengan que importar zod ni saber del schema.
import type {
  Appointment,
  AuthSession,
  AuthUser,
  AvailabilityResponse,
  Barber,
  CreateAppointmentInput,
  CreateBarberInput,
  CreateServiceInput,
  CreateTimeOffInput,
  InviteStaffInput,
  LoginInput,
  Role,
  Service,
  StaffMember,
  TimeOff,
  UpdateAppointmentInput,
  UpdateServiceInput,
  UpdateStaffInput,
} from "@barberia/shared";

export type ServiceDto = Service;
export type CreateServiceInputDto = CreateServiceInput;
export type UpdateServiceInputDto = UpdateServiceInput;
export type BarberDto = Barber;
export type CreateBarberInputDto = CreateBarberInput;
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
