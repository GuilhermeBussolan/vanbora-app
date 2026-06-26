/**
 * Dados mockados para o protótipo de telas.
 * Substituídos futuramente pelas chamadas à API (Java/Spring + MySQL).
 */
import {
  ChatMessage,
  ChatPreview,
  Dependent,
  Helper,
  HireRequest,
  Notice,
  PaymentRecord,
  Review,
  RouteStop,
  Student,
  Transporter,
  TripStep,
  WeekAttendance,
} from '@/types';

export const currentGuardianName = 'Mariana';
export const currentTransporterName = 'Roberto';

export const weekAttendance: WeekAttendance[] = [
  { day: 'SEG', present: true },
  { day: 'TER', present: true },
  { day: 'QUA', present: false },
  { day: 'QUI', present: false },
  { day: 'SEX', present: true },
];

export const guardianNotice = {
  title: 'Avisos do Transportador',
  message:
    'Amanhã o veículo sairá 10 min mais cedo devido a obras na avenida principal. Por favor, estejam prontos.',
};

export const nextPayment: PaymentRecord = {
  id: 'pay-next',
  referenceMonth: 'Maio 2026',
  amount: 350,
  status: 'pending',
  dueDate: '10 de Maio',
};

export const paymentHistory: PaymentRecord[] = [
  { id: 'p1', referenceMonth: 'Abril 2026', amount: 350, status: 'paid' },
  { id: 'p2', referenceMonth: 'Março 2026', amount: 350, status: 'paid' },
  { id: 'p3', referenceMonth: 'Fevereiro 2026', amount: 350, status: 'paid' },
  { id: 'p4', referenceMonth: 'Janeiro 2026', amount: 175, status: 'paid' },
  { id: 'p5', referenceMonth: 'Dezembro 2025', amount: 350, status: 'paid' },
];

export const trackingTrip = {
  studentName: 'Lucas',
  transporterName: 'Roberto Almeida',
  badge: 'A caminho da escola',
  steps: [
    { id: 's1', label: 'Embarque confirmado', time: '07h15', status: 'done' },
    { id: 's2', label: 'Chegada prevista', time: '07h42', status: 'in_progress' },
    { id: 's3', label: 'Desembarque na escola', status: 'waiting' },
  ] as TripStep[],
};

export const dependents: Dependent[] = [
  { id: 'd1', name: 'Lucas Costa', school: 'Colégio Objetivo' },
];

// ----- Transportador -----

export const transporterDashboard = {
  totalStudents: 15,
  confirmed: 12,
  absent: 3,
};

export const hireRequests: HireRequest[] = [
  {
    id: 'h1',
    guardianName: 'Juliana Silva',
    studentName: 'Pedro Silva',
    school: 'Colégio Objetivo',
    neighborhood: 'Vila Mariana',
  },
];

export const notices: Notice[] = [
  {
    id: 'n1',
    message:
      'Amanhã o veículo sairá 10 min mais cedo devido a obras na avenida principal. Por favor, estejam prontos.',
    date: '08 Mai 2026',
    recipients: 15,
  },
  {
    id: 'n2',
    message:
      'A mensalidade de Maio já está disponível para pagamento no aplicativo. Evite juros e pague até o dia 10.',
    date: '01 Mai 2026',
    recipients: 15,
  },
  {
    id: 'n3',
    message:
      'Não haverá transporte na próxima sexta-feira (feriado nacional).',
    date: '15 Abr 2026',
    recipients: 15,
  },
];

export const routeStops: RouteStop[] = [
  {
    id: 'rs1',
    studentName: 'Lucas Costa',
    address: 'Rua das Flores, 123 - Centro',
    status: 'going',
  },
  {
    id: 'rs2',
    studentName: 'Pedro Silva',
    address: 'Av. Brasil, 456 - Vila Mariana',
    status: 'not_going',
  },
  {
    id: 'rs3',
    studentName: 'Colégio Objetivo',
    address: 'Rua do Parque, 789 - Centro',
    status: 'school',
  },
];

export const financeSummary = {
  receivedThisMonth: 4250,
  pending: 1050,
  overdue: 350,
  monthlyRevenue: [
    { label: 'JAN', value: 2200 },
    { label: 'FEV', value: 3100 },
    { label: 'MAR', value: 3600 },
    { label: 'ABR', value: 3900 },
    { label: 'MAI', value: 4250 },
  ],
};

export const transporterProfile = {
  name: 'Roberto Almeida',
  cnh: '••• ••• 1234',
  plate: 'ABC-1D34',
  neighborhoods: ['Centro', 'Vila Nova', 'Jd. América'],
  schools: ['Colégio Objetivo', 'Escola Adventista'],
};

export const helpers: Helper[] = [
  { id: 'a1', name: 'Carlos Mendes', role: 'Monitor' },
];

export const students: Student[] = [
  {
    id: 'st1',
    name: 'Lucas Costa',
    guardianName: 'Mariana Costa',
    school: 'Colégio Objetivo',
    neighborhood: 'Centro',
    financeStatus: 'em_dia',
  },
  {
    id: 'st2',
    name: 'Pedro Silva',
    guardianName: 'Juliana Silva',
    school: 'Escola Adventista',
    neighborhood: 'Vila Mariana',
    financeStatus: 'pendente',
  },
  {
    id: 'st3',
    name: 'Ana Souza',
    guardianName: 'Marcos Souza',
    school: 'COC',
    neighborhood: 'Jd. América',
    financeStatus: 'atrasado',
  },
];

// ----- Chat (compartilhado) -----

export const chatPreviews: ChatPreview[] = [
  {
    id: 'c1',
    name: 'Roberto Almeida',
    lastMessage: 'Já estamos a caminho da escola!',
    time: '07h35',
    unread: 1,
  },
  {
    id: 'c2',
    name: 'Cláudia Mendes',
    lastMessage: 'Obrigada!',
    time: 'Ontem',
    unread: 0,
  },
];

export const chatMessages: ChatMessage[] = [
  {
    id: 'm1',
    text: 'Bom dia! O Lucas (Teal) precisa? Chego em 5 minutos.',
    time: '07h10',
    fromMe: false,
  },
  {
    id: 'm2',
    text: 'Bom dia, Roberto, está sim. Já estamos descendo.',
    time: '07h11',
    fromMe: true,
  },
  {
    id: 'm3',
    text: 'Já estamos a caminho da escola!',
    time: '07h35',
    fromMe: false,
  },
];

/** Formata um valor numérico em Reais (R$ 1.234,00). */
export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  });
}
