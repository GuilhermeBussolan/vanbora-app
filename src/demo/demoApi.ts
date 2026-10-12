/**
 * "Backend" do modo demonstração: responde às chamadas da API com as respostas gravadas do
 * perfil atual. Leituras vêm do arquivo; mensagens de chat enviadas ficam em memória; as
 * demais ações respondem com um aviso de que não estão disponíveis na demonstração.
 *
 * As respostas (src/demo/fixtures.json) não entram no pacote do app: o build de demonstração
 * copia o arquivo para a raiz do site e ele é buscado na primeira chamada.
 */
import Constants from 'expo-constants';
import { demoRole } from './demoMode';

type Responses = Record<string, unknown>;
interface Profile {
  login: { token: string; user: { name: string } };
  responses: Responses;
}
interface Fixtures {
  capturedAt: string;
  guardian: Profile;
  transporter: Profile;
}

const DAY = 86_400_000;

/**
 * Os dados foram gravados num dia fixo. Para "hoje" continuar fazendo sentido, todas as datas
 * andam o mesmo número de semanas inteiras até a semana atual (mantém o dia da semana).
 */
function shiftDates(data: Responses, capturedAt: string): Responses {
  const captured = new Date(capturedAt).getTime();
  const weeks = Math.max(0, Math.floor((Date.now() - captured) / (7 * DAY)));
  if (weeks === 0) return data;
  const json = JSON.stringify(data).replace(/\b(\d{4})-(\d{2})-(\d{2})(?=[T"&\/])/g, (m, y, mo, d) => {
    const t = Date.UTC(Number(y), Number(mo) - 1, Number(d)) + weeks * 7 * DAY;
    return new Date(t).toISOString().slice(0, 10);
  });
  return JSON.parse(json) as Responses;
}

let loaded: Promise<{ login: Profile['login']; responses: Responses }> | null = null;

function load() {
  if (!loaded) {
    const base = (Constants.expoConfig?.experiments as { baseUrl?: string } | undefined)?.baseUrl ?? '';
    loaded = fetch(`${base}/demo-fixtures.json`)
      .then((r) => r.json() as Promise<Fixtures>)
      .then((f) => ({ login: f[demoRole].login, responses: shiftDates(f[demoRole].responses, f.capturedAt) }));
  }
  return loaded;
}

let nextId = 10_000;

function find(responses: Responses, path: string): unknown {
  if (path in responses) return responses[path];
  // Mesma rota com outros filtros: usa a versão gravada sem filtros e aplica os filtros que
  // forem campos dos itens (ex.: ?status=PENDING); datas e períodos são ignorados.
  const [base, query] = path.split('?');
  if (base in responses) {
    const data = responses[base];
    if (!Array.isArray(data) || !query) return data;
    const filters = [...new URLSearchParams(query)];
    return data.filter((item) =>
      filters.every(([k, v]) => !(item && typeof item === 'object' && k in item) || String((item as Record<string, unknown>)[k]) === v),
    );
  }
  // Data no caminho (ex.: /attendance/2026-10-12): usa qualquer data gravada da mesma rota.
  const pattern = base.replace(/\d{4}-\d{2}-\d{2}/g, '\\d{4}-\\d{2}-\\d{2}');
  if (pattern !== base) {
    const re = new RegExp(`^${pattern}(\\?|$)`);
    const key = Object.keys(responses).find((k) => re.test(k));
    if (key) return responses[key];
  }
  return undefined;
}

/** Sessão já "logada" do perfil, para o visitante cair direto na home. */
export async function demoSession(): Promise<string> {
  const { login } = await load();
  return JSON.stringify({ token: login.token, user: login.user });
}

export async function demoRequest<T>(path: string, method: string, body?: unknown): Promise<T> {
  const [{ login, responses }] = await Promise.all([load(), new Promise((r) => setTimeout(r, 120))]);

  if (path === '/api/auth/login' || path === '/api/auth/social') return structuredClone(login) as T;

  if (method === 'GET') {
    const data = find(responses, path);
    if (data === undefined) throw new Error('Conteúdo indisponível na demonstração.');
    const copy = structuredClone(data) as Record<string, unknown>;
    // Posição da van "ao vivo": sempre atualizada há instantes.
    if (/tracking|\/route$/.test(path) && copy && typeof copy === 'object' && 'updatedAt' in copy) {
      copy.updatedAt = new Date(Date.now() - 40_000).toISOString();
    }
    return copy as T;
  }

  // Chat: a mensagem enviada aparece na conversa (só nesta sessão do navegador).
  const chat = path.match(/^\/api\/conversations\/(\d+)\/messages$/);
  if (chat && method === 'POST') {
    const text = (body as { text?: string } | undefined)?.text ?? '';
    const now = new Date();
    const message = {
      id: nextId++,
      text,
      time: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`,
      fromMe: true,
      type: 'TEXT',
      mediaUrl: null,
      senderName: login.user.name,
      senderRole: demoRole === 'transporter' ? 'Transportador' : 'Responsável',
    };
    const key = `/api/conversations/${chat[1]}/messages`;
    responses[key] = [...((responses[key] as unknown[]) ?? []), message];
    return structuredClone(message) as T;
  }

  // Ações de bastidor (leitura de conversa, token de push, onboarding): finge sucesso.
  if (/\/read$|push-token|onboarding|\/logout$/.test(path)) return undefined as T;

  throw new Error('Esta ação não está disponível na demonstração — aqui é só para navegar.');
}
