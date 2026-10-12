/**
 * Anonimiza as respostas gravadas da API local antes de virarem dados do protótipo público
 * (portfólio). O banco de desenvolvimento mistura os dados do DataSeeder com testes manuais:
 * aqui trocamos nomes, escolas, endereços, coordenadas, telefones e fotos por valores
 * fictícios, e mensagens/avisos de teste por textos naturais.
 */

// As trocas citam os dados reais (nomes, escolas, endereços): ficam num arquivo LOCAL, fora do git.
import { existsSync } from 'node:fs'
const LOCAL = new URL('./demo-sanitize.local.mjs', import.meta.url)
if (!existsSync(LOCAL)) throw new Error('Falta scripts/demo-sanitize.local.mjs (regras locais de anonimização).')
const { SUBSTRING, EXACT } = await import(LOCAL.href)


// Retratos públicos de demonstração (mesmo serviço usado pelo DataSeeder).
const WOMEN = ['Mariana Costa', 'Fernanda Lima', 'Angelica Ribeiro', 'Carolina Dias', 'Juliana Silva', 'Ana Souza', 'Beatriz A.', 'Helena A.']
const portrait = (name, n) =>
  `https://randomuser.me/api/portraits/${WOMEN.includes(name) ? 'women' : 'men'}/${(n * 7 + 11) % 90}.jpg`

const JUNK = /teste|a{6,}|b{6,}|^o+i+[oi]*$|^tem$|^mensagem$|travou|maldito|um dois tres|^\s*$/i
const POOLS = {
  chat: [
    'Bom dia! Saindo agora, chego em 10 minutos.',
    'Perfeito, obrigada!',
    'Hoje ela sai mais cedo, às 11h. Tudo bem?',
    'Tudo certo, anotado!',
    'Chegamos na escola 😊',
    'Amanhã não tem aula por causa da reunião de professores.',
    'Obrigado pelo aviso!',
    'Combinado.',
    'Boa tarde! Já estamos voltando.',
    'Ok, até amanhã!',
  ],
  title: ['Reunião de pais na sexta', 'Feriado: sem transporte na segunda', 'Novo horário de saída', 'Passeio da escola'],
  // Mesma ordem dos títulos: o aviso fica com título e texto do mesmo assunto.
  body: [
    'Na sexta-feira a saída será às 11h30 por causa da reunião de pais. Ajustei a rota da volta.',
    'Segunda é feriado municipal, então não haverá transporte. Bom descanso a todos!',
    'A partir da próxima semana a van passa 10 minutos mais cedo no período da manhã.',
    'Na quarta a turma vai ao museu: a volta será às 13h, direto da escola.',
  ],
  comment: ['Obrigada pelo aviso!', 'Anotado, obrigado!', 'Perfeito 👍', 'Combinado!'],
  review: ['Ótimo atendimento.', 'Muito pontual e cuidadoso.', 'Recomendo!'],
}
const counters = {}
const pick = (pool) => {
  counters[pool] = (counters[pool] ?? 0) + 1
  return POOLS[pool][(counters[pool] - 1) % POOLS[pool].length]
}

function poolFor(key) {
  if (key === 'text' || key === 'lastMessage') return 'chat'
  if (key === 'title') return 'title'
  if (key === 'body' || key === 'content' || key === 'message') return 'body'
  if (key === 'comment') return 'review'
  return null
}

function text(value, key) {
  const pool = poolFor(key)
  if (pool && JUNK.test(value)) return pick(pool)
  if (value in EXACT) return EXACT[value]
  let v = value
  for (const [from, to] of SUBSTRING) v = v.split(from).join(to)
  return v
}

const photoCache = new Map()
function phone(v) {
  if (v === '(11) 90000-0000') return v
  let h = 0
  for (const c of v) h = (h * 31 + c.charCodeAt(0)) % 10000
  return `(11) 9${String(1000 + (h % 9000)).padStart(4, '0')}-${String(h).padStart(4, '0')}`
}

function walk(node, key, parent) {
  if (Array.isArray(node)) {
    // Mensagens de chat com mídia enviada por upload saem da demonstração.
    return node.filter((x) => !(x && typeof x === 'object' && x.mediaUrl)).map((x) => walk(x, key, parent))
  }
  if (node && typeof node === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(node)) out[k] = walk(v, k, node)
    return out
  }
  if (typeof node === 'number') {
    // Coordenadas: comprimidas e levadas para a região da Vila Mariana (São Paulo).
    // Traçados de rota são listas de [lat, lng] sem nome de campo: reconhecidos pela faixa.
    const inPath = /geometry|path|coordinates|polyline/i.test(key ?? '')
    if (key === 'latitude' || (inPath && node > -30 && node < -15)) return -23.588 + (node + 23.65) * 0.25
    if (key === 'longitude' || (inPath && node > -55 && node < -40)) return -46.635 + (node + 46.6) * 0.25
    return node
  }
  if (typeof node !== 'string') return node
  if (/phone/i.test(key)) return phone(node)
  if (key === 'number' && node === '42') return '120'
  if (node.startsWith('/uploads/') || node.startsWith('/api/media/')) {
    if (/\/uploads\/(transporters|helpers)\//.test(node)) {
      if (!photoCache.has(node)) photoCache.set(node, portrait(text(parent?.name ?? '', 'name'), photoCache.size))
      return photoCache.get(node)
    }
    return null // veículos, chat e checklist: fotos enviadas por upload ficam fora
  }
  return text(node, key)
}

// Financeiro do transportador: o banco local tem poucos lançamentos, então a demo usa um mês
// fictício completo (valores coerentes entre si) para as telas mostrarem o que fazem.
function demoFinance(now = new Date()) {
  const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ']
  const y = now.getFullYear()
  const m = now.getMonth()
  const ym = (back) => {
    const d = new Date(y, m - back, 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }
  const day = (d) => `${ym(0)}-${String(d).padStart(2, '0')}`
  const expenses = [
    { id: 101, date: day(2), category: 'Combustível', description: 'Abastecimento', amount: 320 },
    { id: 102, date: day(5), category: 'Manutenção', description: 'Troca de óleo e filtros', amount: 420 },
    { id: 103, date: day(6), category: 'Limpeza', description: 'Higienização dos bancos', amount: 140 },
    { id: 104, date: day(8), category: 'Combustível', description: 'Abastecimento', amount: 300 },
    { id: 105, date: day(9), category: 'Estacionamento', description: 'Mensal perto da escola', amount: 110 },
  ]
  const fuel = [
    { id: 201, date: day(2), liters: 52, amount: 320 },
    { id: 202, date: day(8), liters: 48, amount: 300 },
  ]
  const received = [
    ['Lucas Costa', 350, 3],
    ['Pedro Silva', 380, 3],
    ['Ana Souza', 380, 4],
    ['Sofia Ribeiro', 420, 5],
    ['Miguel Alves', 350, 5],
    ['Laura Mendes', 420, 6],
    ['Davi Rocha', 380, 7],
    ['Clara Nunes', 350, 8],
    ['Theo Martins', 420, 9],
    ['Alice Prado', 380, 10],
  ]
  const totalReceived = received.reduce((a, r) => a + r[1], 0)
  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0)
  const byCategory = Object.entries(
    expenses.reduce((acc, e) => ({ ...acc, [e.category]: (acc[e.category] ?? 0) + e.amount }), {}),
  ).map(([category, total]) => ({ category, total }))
  const trend = [5, 4, 3, 2, 1, 0].map((back, i) => ({
    label: MONTHS[new Date(y, m - back, 1).getMonth()],
    received: back === 0 ? totalReceived : [3480, 3650, 3650, 3800, 3950][i],
    expenses: back === 0 ? totalExpenses : [1180, 1420, 1090, 1350, 1240][i],
  }))
  const summary = {
    received: totalReceived,
    pending: 760,
    overdue: 350,
    expenses: totalExpenses,
    balance: totalReceived - totalExpenses,
    kmToday: 38,
    kmPeriod: 412,
    kmTotal: 18650,
    expensesByCategory: byCategory,
    consumption: { liters: 100, kmPerLiter: 4.1, costPerKm: 1.5 },
    goal: { monthlyGoal: 5200, monthRevenue: totalReceived, progress: totalReceived / 5200 },
    maintenance: { intervalKm: 10000, kmSinceLast: 7420, remainingKm: 2580 },
    monthlyRevenue: MONTHS.map((label, i) => {
      const t = trend.find((x) => x.label === label)
      return { label, value: t ? t.received : 0 }
    }),
    comparison: {
      previousReceived: 3950,
      receivedChangePct: Math.round(((totalReceived - 3950) / 3950) * 1000) / 10,
      previousExpenses: 1240,
      expensesChangePct: Math.round(((totalExpenses - 1240) / 1240) * 1000) / 10,
      previousKm: 396,
      kmChangePct: 4,
    },
    recurringMonthlyRevenue: 4910,
    monthlyTrend: trend,
  }
  const breakdown = (status, rows) =>
    rows.map(([student, amount, d]) => ({ student, referenceMonth: ym(0), amount, date: d ? day(d) : null, status }))
  return {
    '/api/transporters/me/finance': summary,
    '/api/transporters/me/finance/expenses': expenses,
    '/api/transporters/me/finance/fuel': fuel,
    '/api/transporters/me/finance/pending': [
      { paymentId: 301, dependentId: 21, studentName: 'Bruno Lima', guardianName: 'Paula Lima', guardianPhone: '(11) 94512-3380', amount: 380, dueDate: day(15) },
      { paymentId: 302, dependentId: 22, studentName: 'Júlia Castro', guardianName: 'Renato Castro', guardianPhone: '(11) 93877-1204', amount: 380, dueDate: day(15) },
    ],
    '/api/transporters/me/finance/breakdown?type=received': breakdown('PAID', received),
    '/api/transporters/me/finance/breakdown?type=pending': breakdown('PENDING', [['Bruno Lima', 380], ['Júlia Castro', 380]]),
    '/api/transporters/me/finance/breakdown?type=overdue': breakdown('OVERDUE', [['Lucas Costa', 350]]),
    '/api/transporters/me/finance/report': {
      from: day(1),
      to: day(10),
      transporterName: 'Roberto Almeida',
      totalReceived,
      totalExpenses,
      balance: totalReceived - totalExpenses,
      km: 412,
      income: received.map(([student, amount, d]) => ({ date: day(d), description: `Mensalidade — ${student}`, amount })),
      expenses: expenses.map((e) => ({ date: e.date, description: `${e.category} — ${e.description}`, amount: e.amount })),
    },
  }
}

// Ajustes de vitrine: os dados foram gravados num domingo; na demo o dia é de aula.
function curate(out) {
  Object.assign(out.transporter.responses, demoFinance())
  for (const k of ['EXPENSE', 'REVENUE']) delete out.transporter.responses[`/api/transporters/me/finance/breakdown?type=${k}`]
  // Avisos: o texto acompanha o título escolhido.
  const pairNotices = (node) => {
    if (Array.isArray(node)) return node.forEach(pairNotices)
    if (!node || typeof node !== 'object') return
    const i = POOLS.title.indexOf(node.title)
    if (i >= 0 && typeof node.message === 'string') node.message = POOLS.body[i]
    Object.values(node).forEach(pairNotices)
  }
  pairNotices(out)
  for (const [path, body] of Object.entries(out.guardian.responses)) {
    if (path.startsWith('/api/guardians/me/dashboard') && body && body.goingToday === null) body.goingToday = true
  }
  return out
}

export function sanitize(data) {
  const out = curate(walk(data, null, null))
  // Conferência final: nada da lista original pode sobrar.
  const s = JSON.stringify(out)
  for (const [from] of SUBSTRING) if (s.includes(from)) throw new Error(`Sobrou na demonstração: ${from}`)
  if (/\/uploads\//.test(s)) throw new Error('Sobrou caminho de upload na demonstração')
  return out
}
