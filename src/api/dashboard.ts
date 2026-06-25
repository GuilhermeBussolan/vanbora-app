/**
 * Painel inicial e lista de alunos do transportador.
 * Endpoints em `/api/transporters/me` (ver TransporterDashboardController).
 */
import { apiFetch } from './client';

/** Métricas do topo do painel (demais campos do dashboard são carregados à parte). */
export interface DashboardMetrics {
  totalStudents: number;
  confirmed: number;
  absent: number;
}

export interface StudentDto {
  id: number;
  name: string;
  guardianName: string;
  school: string;
  neighborhood: string;
  /** EM_DIA | PENDENTE | ATRASADO (enum do backend). */
  financeStatus: string;
  /** Vai hoje (presença do dia; fim de semana conta como presente). */
  presentToday: boolean;
}

export function getDashboard(token: string): Promise<DashboardMetrics> {
  return apiFetch<DashboardMetrics>('/api/transporters/me/dashboard', { token });
}

export function listMyStudents(token: string): Promise<StudentDto[]> {
  return apiFetch<StudentDto[]>('/api/transporters/me/students', { token });
}
