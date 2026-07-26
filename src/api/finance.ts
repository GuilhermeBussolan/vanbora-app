/**
 * Cliente da API do painel financeiro do transportador.
 * Endpoints em `/api/transporters/me/finance` (ver FinanceController no backend).
 */
import { apiFetch } from './client';

// ----- Tipos de resposta -----

export interface CategoryTotal {
  category: string;
  total: number;
}

export interface Consumption {
  liters: number;
  kmPerLiter: number | null;
  costPerKm: number | null;
}

export interface Goal {
  monthlyGoal: number | null;
  monthRevenue: number;
  /** Progresso 0..1. */
  progress: number;
}

export interface Maintenance {
  intervalKm: number | null;
  kmSinceLast: number | null;
  remainingKm: number | null;
}

export interface MonthlyRevenue {
  label: string;
  value: number;
}

export interface FinanceSummary {
  received: number;
  pending: number;
  overdue: number;
  expenses: number;
  balance: number;
  kmToday: number;
  kmPeriod: number;
  kmTotal: number;
  expensesByCategory: CategoryTotal[];
  consumption: Consumption;
  goal: Goal;
  maintenance: Maintenance;
  monthlyRevenue: MonthlyRevenue[];
}

/** Item do detalhamento (pendente/vencido/recebido) por aluno. */
export interface FinanceBreakdownItem {
  student: string;
  referenceMonth: string;
  amount: number;
  date: string | null;
  status: string;
}

export type BreakdownType = 'pending' | 'overdue' | 'received';

/** Detalhamento por aluno para os tiles clicáveis. */
export function getFinanceBreakdown(
  token: string,
  type: BreakdownType,
): Promise<FinanceBreakdownItem[]> {
  return apiFetch<FinanceBreakdownItem[]>(
    `/api/transporters/me/finance/breakdown?type=${type}`,
    { token },
  );
}

/** Lança/atualiza a receita manual de um mês (yyyy-MM). */
export function setManualRevenue(
  token: string,
  referenceMonth: string,
  amount: number,
): Promise<void> {
  return apiFetch<void>('/api/transporters/me/finance/revenue', {
    method: 'POST',
    body: { referenceMonth, amount },
    token,
  });
}

export interface ExpenseDto {
  id: number;
  date: string;
  category: string;
  description: string | null;
  amount: number;
}

export interface FuelEntryDto {
  id: number;
  date: string;
  liters: number;
  amount: number;
}

export interface SuggestionDto {
  title: string;
  detail: string;
  suggestedCategory: string | null;
  suggestedAmount: number | null;
}

export interface ReportLine {
  date: string;
  description: string;
  amount: number;
}

export interface FinanceReport {
  from: string;
  to: string;
  transporterName: string;
  totalReceived: number;
  totalExpenses: number;
  balance: number;
  km: number;
  income: ReportLine[];
  expenses: ReportLine[];
}

// ----- Tipos de entrada -----

export interface ExpenseInput {
  /** ISO date (yyyy-MM-dd); null = hoje. */
  date: string | null;
  category: string;
  description: string | null;
  amount: number;
}

export interface FuelInput {
  date: string | null;
  liters: number;
  amount: number;
}

export interface FinanceSettingsInput {
  monthlyRevenueGoal: number | null;
  maintenanceIntervalKm: number | null;
}

/** Monta `?from=&to=` quando o período é informado. */
function periodQuery(from?: string, to?: string): string {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// ----- Resumo / relatório / sugestões -----

export function getFinanceSummary(token: string, from?: string, to?: string): Promise<FinanceSummary> {
  return apiFetch<FinanceSummary>(`/api/transporters/me/finance${periodQuery(from, to)}`, { token });
}

export function getFinanceReport(token: string, from?: string, to?: string): Promise<FinanceReport> {
  return apiFetch<FinanceReport>(`/api/transporters/me/finance/report${periodQuery(from, to)}`, { token });
}

export function getSuggestions(token: string): Promise<SuggestionDto[]> {
  return apiFetch<SuggestionDto[]>('/api/transporters/me/finance/suggestions', { token });
}

// ----- Gastos -----

export function listExpenses(token: string, from?: string, to?: string): Promise<ExpenseDto[]> {
  return apiFetch<ExpenseDto[]>(`/api/transporters/me/finance/expenses${periodQuery(from, to)}`, { token });
}

export function addExpense(token: string, input: ExpenseInput): Promise<ExpenseDto> {
  return apiFetch<ExpenseDto>('/api/transporters/me/finance/expenses', {
    method: 'POST',
    body: input,
    token,
  });
}

export function updateExpense(token: string, id: number, input: ExpenseInput): Promise<ExpenseDto> {
  return apiFetch<ExpenseDto>(`/api/transporters/me/finance/expenses/${id}`, {
    method: 'PUT',
    body: input,
    token,
  });
}

export function deleteExpense(token: string, id: number): Promise<void> {
  return apiFetch<void>(`/api/transporters/me/finance/expenses/${id}`, { method: 'DELETE', token });
}

// ----- Combustível -----

export function listFuel(token: string, from?: string, to?: string): Promise<FuelEntryDto[]> {
  return apiFetch<FuelEntryDto[]>(`/api/transporters/me/finance/fuel${periodQuery(from, to)}`, { token });
}

export function addFuel(token: string, input: FuelInput): Promise<FuelEntryDto> {
  return apiFetch<FuelEntryDto>('/api/transporters/me/finance/fuel', {
    method: 'POST',
    body: input,
    token,
  });
}

export function deleteFuel(token: string, id: number): Promise<void> {
  return apiFetch<void>(`/api/transporters/me/finance/fuel/${id}`, { method: 'DELETE', token });
}

// ----- Ajustes / manutenção -----

export function updateFinanceSettings(token: string, input: FinanceSettingsInput): Promise<void> {
  return apiFetch<void>('/api/transporters/me/finance/settings', {
    method: 'PUT',
    body: input,
    token,
  });
}

export function markMaintenanceDone(token: string): Promise<void> {
  return apiFetch<void>('/api/transporters/me/finance/maintenance-done', { method: 'POST', token });
}
