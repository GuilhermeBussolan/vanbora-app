import { MonitorProfileDto, MonitorStudentDto } from '@/types';
import { apiFetch } from './client';

/** [Monitor] Dados do próprio monitor + transportador para quem trabalha. */
export function getMonitorProfile(token: string): Promise<MonitorProfileDto> {
  return apiFetch<MonitorProfileDto>('/api/monitors/me', { token });
}

/** [Monitor] Alunos dos percursos em que está escalado (sem dados financeiros). */
export function listMonitorStudents(token: string): Promise<MonitorStudentDto[]> {
  return apiFetch<MonitorStudentDto[]>('/api/monitors/me/students', { token });
}
