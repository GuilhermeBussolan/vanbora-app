/** Painel inicial do responsável (`GET /api/guardians/me/dashboard`). */
import { apiFetch } from './client';

export interface DayAttendance {
  day: string;
  present: boolean | null;
}

export interface DashboardPayment {
  id: number;
  referenceMonth: string;
  amount: number;
  status: string;
  dueDate: string | null;
}

export interface DashboardNotice {
  title: string | null;
  message: string;
}

export interface GuardianDashboardDto {
  hasTransporter: boolean;
  studentName: string | null;
  weekAttendance: DayAttendance[];
  nextPayment: DashboardPayment | null;
  notice: DashboardNotice | null;
}

export function getGuardianDashboard(token: string): Promise<GuardianDashboardDto> {
  return apiFetch<GuardianDashboardDto>('/api/guardians/me/dashboard', { token });
}

export interface AddressDto {
  cep: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface GuardianProfileDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string | null;
  neighborhood: string | null;
  pickup: AddressDto;
  delivery: AddressDto;
  deliverySameAsPickup: boolean;
  dependents: { id: number; name: string; school: string }[];
}

export interface AddressInputBody {
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
}

export function getMyGuardianProfile(token: string): Promise<GuardianProfileDto> {
  return apiFetch<GuardianProfileDto>('/api/guardians/me', { token });
}

export function updateAddress(
  token: string,
  body: { pickup: AddressInputBody; deliverySameAsPickup: boolean; delivery?: AddressInputBody | null },
): Promise<GuardianProfileDto> {
  return apiFetch<GuardianProfileDto>('/api/guardians/me/address', { method: 'PUT', body, token });
}
