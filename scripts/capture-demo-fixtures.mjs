/**
 * Grava as respostas da API local (contas de demonstração do DataSeeder) para o build de
 * demonstração do portfólio. Só leituras (GET). Rode com a API em localhost:8080:
 *
 *   node scripts/capture-demo-fixtures.mjs
 *
 * Saída: src/demo/fixtures.json — { capturedAt, guardian: {...}, transporter: {...} }, já anonimizado
 * (demo-sanitize.mjs): os dados crus da API nunca são gravados em disco.
 */
import { writeFileSync } from 'node:fs';
import { sanitize } from './demo-sanitize.mjs';

const API = process.env.API_URL ?? 'http://localhost:8080';
const PASSWORD = '123456';

async function call(token, path) {
  const res = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
  if (!res.ok) return undefined;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

async function capture(email, paths, expand) {
  const login = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: PASSWORD }),
  }).then((r) => r.json());
  const token = login.token;
  const out = { login: { ...login, token: 'demo-token' }, responses: {} };
  const get = async (path) => {
    if (path in out.responses) return out.responses[path];
    const body = await call(token, path);
    if (body !== undefined) out.responses[path] = body;
    return body;
  };
  for (const p of paths) await get(p);
  await expand(get, out.responses);
  console.log(`${email}: ${Object.keys(out.responses).length} respostas`);
  return out;
}

const today = new Date().toISOString().slice(0, 10);
const ids = (list) => (Array.isArray(list) ? list.map((x) => x.id).filter((x) => x != null) : []);

const guardian = await capture(
  'mariana@vanbora.com',
  [
    '/api/account/consents',
    '/api/config/fees',
    '/api/conversations',
    '/api/guardians/me',
    '/api/guardians/me/dependents',
    '/api/guardians/me/contracts',
    '/api/guardians/me/notices',
    '/api/guardians/me/payment-methods',
    '/api/transporters/filters',
    '/api/transporters',
    `/api/schools?page=0&size=10`,
  ],
  async (get, r) => {
    for (const dep of [null, ...ids(r['/api/guardians/me/dependents'])]) {
      const q = dep == null ? '' : `?dependentId=${dep}`;
      const amp = dep == null ? '' : `&dependentId=${dep}`;
      await get(`/api/guardians/me/dashboard${q}`);
      await get(`/api/guardians/me/attendance${q}`);
      await get(`/api/guardians/me/attendance/week?date=${today}${amp}`);
      await get(`/api/guardians/me/attendance/${today}${q}`);
      await get(`/api/guardians/me/payments/schedule${q}`);
      await get(`/api/guardians/me/tracking${q}`);
      await get(`/api/guardians/me/safety-checks${q}`);
    }
    for (const id of ids(r['/api/guardians/me/contracts'])) {
      await get(`/api/guardians/me/contracts/${id}`);
      await get(`/api/guardians/me/contracts/${id}/cancellation-preview`);
    }
    for (const id of ids(r['/api/guardians/me/notices'])) {
      await get(`/api/guardians/me/notices/${id}`);
      await get(`/api/guardians/me/notices/${id}/comments`);
    }
    for (const id of ids(r['/api/conversations'])) await get(`/api/conversations/${id}/messages`);
    const list = r['/api/transporters'];
    const transporters = Array.isArray(list) ? list : (list?.content ?? []);
    for (const id of ids(transporters)) await get(`/api/transporters/${id}`);
  },
);

const transporter = await capture(
  'roberto@vanbora.com',
  [
    '/api/account/consents',
    '/api/config/fees',
    '/api/conversations',
    '/api/transporters/me',
    '/api/transporters/me/dashboard',
    '/api/transporters/me/students',
    '/api/transporters/me/contracts',
    '/api/transporters/me/hire-requests',
    '/api/transporters/me/helpers',
    '/api/transporters/me/notices',
    '/api/transporters/me/audience',
    '/api/transporters/me/route',
    '/api/transporters/me/location/sharing',
    '/api/transporters/me/finance',
    '/api/transporters/me/finance/report',
    '/api/transporters/me/finance/expenses',
    '/api/transporters/me/finance/fuel',
    '/api/transporters/me/finance/overdue',
    '/api/transporters/me/finance/pending',
    '/api/transporters/me/finance/suggestions',
    '/api/transporters/me/finance/settings',
    '/api/transporters/me/finance/revenue',
    '/api/transporters/me/contract-template',
    '/api/trips',
    '/api/safety-checklists',
    `/api/schools?page=0&size=10`,
  ],
  async (get, r) => {
    for (const id of ids(r['/api/transporters/me/notices'])) {
      await get(`/api/transporters/me/notices/${id}`);
      await get(`/api/transporters/me/notices/${id}/comments`);
    }
    for (const id of ids(r['/api/conversations'])) await get(`/api/conversations/${id}/messages`);
    for (const id of ids(r['/api/safety-checklists'])) await get(`/api/safety-checklists/${id}`);
    for (const id of ids(r['/api/transporters/me/hire-requests'])) await get(`/api/hire-requests/${id}/guardian`);
  },
);

writeFileSync(
  new URL('../src/demo/fixtures.json', import.meta.url),
  JSON.stringify(sanitize({ capturedAt: new Date().toISOString(), guardian, transporter }), null, 1) + '\n',
);
console.log('src/demo/fixtures.json gravado.');
