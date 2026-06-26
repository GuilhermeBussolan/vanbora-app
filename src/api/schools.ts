/** Catálogo de escolas (busca paginada + cadastro por CEP). */
import { apiFetch } from './client';

export interface SchoolDto {
  id: number;
  name: string;
  address: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
}

/** Página do Spring Data (campos usados pelo scroll infinito). */
export interface SchoolPage {
  content: SchoolDto[];
  last: boolean;
  number: number;
}

/** Busca paginada por nome (query opcional). */
export function searchSchools(
  token: string,
  query: string,
  page = 0,
  size = 10,
): Promise<SchoolPage> {
  const q = query.trim() ? `&query=${encodeURIComponent(query.trim())}` : '';
  return apiFetch<SchoolPage>(`/api/schools?page=${page}&size=${size}${q}`, { token });
}

export interface CreateSchoolBody {
  name: string;
  cep?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  uf?: string;
}

/** [Transportador] Cadastra uma escola no catálogo (geocodificada pelo endereço). */
export function registerSchool(token: string, body: CreateSchoolBody): Promise<SchoolDto> {
  return apiFetch<SchoolDto>('/api/schools', { method: 'POST', body, token });
}
