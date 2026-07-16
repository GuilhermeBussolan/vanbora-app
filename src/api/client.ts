import Constants from 'expo-constants';

/**
 * Cliente HTTP mínimo para a API VanBora (Spring Boot).
 *
 * Resolução da base URL (nesta ordem):
 *   1) `EXPO_PUBLIC_API_URL`, se definida (override manual);
 *   2) o IP da máquina de desenvolvimento, descoberto a partir do host do Metro
 *      (faz o app no Expo Go alcançar o backend na mesma rede automaticamente);
 *   3) `http://localhost:8080` (web / fallback).
 *
 * Porta do backend pode ser ajustada via `EXPO_PUBLIC_API_PORT` (padrão 8080).
 */
function resolveBaseUrl(): string {
  const override = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (override) return override;

  const port = process.env.EXPO_PUBLIC_API_PORT ?? '8080';
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost ??
    '';
  const host = hostUri.split(':')[0];

  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:${port}`;
  }
  return `http://localhost:${port}`;
}

export const API_BASE_URL = resolveBaseUrl();

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
}

/** Faz uma requisição à API e devolve o JSON tipado (ou `undefined` em 204). */
export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Não foi possível conectar à API. Verifique se o backend está no ar e a URL configurada.');
  }

  if (!response.ok) {
    const message = await extractError(response);
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function extractError(response: Response): Promise<string> {
  try {
    const data = await response.json();
    return data?.message ?? data?.error ?? `Erro ${response.status}`;
  } catch {
    return `Erro ${response.status}`;
  }
}

/** Imagem local (expo-image-picker) para envio multipart. */
export interface UploadFile {
  uri: string;
  name: string;
  type: string;
}

/** Envia um arquivo (campo `file`) via multipart e devolve o JSON tipado. */
export async function apiUpload<T>(path: string, file: UploadFile, token?: string | null): Promise<T> {
  const form = new FormData();
  // O cast é necessário: o FormData do React Native aceita { uri, name, type }.
  form.append('file', file as unknown as Blob);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  // Não definir Content-Type: o fetch adiciona o boundary do multipart sozinho.

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { method: 'POST', headers, body: form });
  } catch {
    throw new ApiError(0, 'Não foi possível enviar a imagem. Verifique a conexão com a API.');
  }

  if (!response.ok) {
    throw new ApiError(response.status, await extractError(response));
  }
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/** Converte um caminho de mídia do backend (ex.: "/uploads/..") em URL absoluta. */
export function mediaUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_BASE_URL}${path}`;
}
