/** Painel inicial do responsável (`GET /api/guardians/me/dashboard`). */
import { apiFetch } from './client';

export interface DayAttendance {
  day: string;
  /** Data ISO (YYYY-MM-DD) do dia. */
  date: string;
  present: boolean;
}

export interface NextPayment {
  referenceMonth: string;
  amount: number;
  dueDate: string | null;
  /** PENDING | OVERDUE | SCHEDULED */
  status: string;
  /** true = cobrança real em aberto; false = projeção do próximo mês. */
  payable: boolean;
}

export interface DashboardNotice {
  title: string | null;
  message: string;
}

export interface GuardianDashboardDto {
  hasTransporter: boolean;
  /** Dependente exibido neste painel. */
  dependentId: number | null;
  studentName: string | null;
  /** Contrato pendente de assinatura do dependente (em fase de contratação). */
  pendingContractId: number | null;
  transporterId: number | null;
  transporterName: string | null;
  /** Pesquisa de satisfação vencida (nunca avaliou ou última > 3 meses). */
  reviewDue: boolean;
  /** Vai hoje? null = fim de semana / sem aula. */
  goingToday: boolean | null;
  weekAttendance: DayAttendance[];
  nextPayment: NextPayment | null;
  notice: DashboardNotice | null;
}

/** Monta `?dependentId=...` (ou vazio) para as rotas por dependente. */
function depQuery(dependentId?: number | null, sep: '?' | '&' = '?'): string {
  return dependentId != null ? `${sep}dependentId=${dependentId}` : '';
}

export function getGuardianDashboard(
  token: string,
  dependentId?: number | null,
): Promise<GuardianDashboardDto> {
  return apiFetch<GuardianDashboardDto>(
    `/api/guardians/me/dashboard${depQuery(dependentId)}`,
    { token },
  );
}

/** Um dia letivo na tela "Avisar falta". */
export interface AttendanceDay {
  date: string;
  weekdayLabel: string;
  going: boolean;
  today: boolean;
  editable: boolean;
}

export function listAttendance(
  token: string,
  dependentId?: number | null,
): Promise<AttendanceDay[]> {
  return apiFetch<AttendanceDay[]>(
    `/api/guardians/me/attendance${depQuery(dependentId)}`,
    { token },
  );
}

/** Presença (seg–sex) da semana que contém `date` (ISO YYYY-MM-DD). */
export function getWeekAttendance(
  token: string,
  date: string,
  dependentId?: number | null,
): Promise<AttendanceDay[]> {
  return apiFetch<AttendanceDay[]>(
    `/api/guardians/me/attendance/week?date=${date}${depQuery(dependentId, '&')}`,
    { token },
  );
}

/** Marca/desmarca falta numa data (going=false ⇒ falta). Devolve a agenda atualizada. */
export function setGoing(
  token: string,
  date: string,
  going: boolean,
  dependentId?: number | null,
): Promise<AttendanceDay[]> {
  return apiFetch<AttendanceDay[]>(`/api/guardians/me/attendance/${date}${depQuery(dependentId)}`, {
    method: 'PUT',
    body: { going },
    token,
  });
}

/** Item do cronograma de pagamentos (histórico real + futuros projetados). */
export interface PaymentScheduleItem {
  id: number | null;
  referenceMonth: string;
  amount: number;
  /** PAID | PENDING | OVERDUE | SCHEDULED */
  status: string;
  dueDate: string | null;
  projected: boolean;
}

export function getPaymentSchedule(
  token: string,
  dependentId?: number | null,
): Promise<PaymentScheduleItem[]> {
  return apiFetch<PaymentScheduleItem[]>(
    `/api/guardians/me/payments/schedule${depQuery(dependentId)}`,
    { token },
  );
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
