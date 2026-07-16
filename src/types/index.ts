/**
 * Tipos de domínio do VanBora.
 * Mapeiam as entidades que futuramente virão do backend (Java/Spring + MySQL).
 */

export type UserRole = 'guardian' | 'transporter';

export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export type StudentFinanceStatus = 'em_dia' | 'pendente' | 'atrasado';

export type RouteStopStatus = 'going' | 'not_going' | 'school';

export type TripStepStatus = 'done' | 'in_progress' | 'waiting';

export interface Dependent {
  id: string;
  name: string;
  school: string;
}

export interface PaymentRecord {
  id: string;
  referenceMonth: string; // ex.: "Abril 2026"
  amount: number;
  status: PaymentStatus;
  dueDate?: string;
}

export interface Transporter {
  id: string;
  name: string;
  rating: number;
  reviewsCount: number;
  yearsExperience: number;
  schools: string[];
  neighborhoods: string[];
  monthlyFee: number; // mensalidade estimada para o bairro buscado
  vehiclePlate?: string;
}

export interface Review {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
}

export interface TripStep {
  id: string;
  label: string;
  time?: string;
  status: TripStepStatus;
}

export interface WeekAttendance {
  /** SEG..SEX */
  day: string;
  present: boolean | null;
}

export interface Notice {
  id: string;
  message: string;
  date: string;
  recipients: number;
}

export interface HireRequest {
  id: string;
  guardianName: string;
  studentName: string;
  school: string;
  neighborhood: string;
}

export interface Student {
  id: string;
  name: string;
  guardianName: string;
  school: string;
  neighborhood: string;
  financeStatus: StudentFinanceStatus;
}

export interface RouteStop {
  id: string;
  studentName: string;
  address: string;
  status: RouteStopStatus;
}

// ----- Integração com a API (mapa em tempo real) -----

/** Papel do usuário como serializado pelo backend (enum em maiúsculas). */
export type ApiUserRole = 'GUARDIAN' | 'TRANSPORTER';

/** Usuário autenticado retornado pela API. */
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: ApiUserRole;
}

/** Parada da rota vinda do backend (com coordenadas para o mapa). */
export interface ApiRouteStop {
  id: number;
  label: string;
  address: string;
  status: 'GOING' | 'NOT_GOING' | 'SCHOOL';
  position: number;
  latitude: number | null;
  longitude: number | null;
  /** Distância (km) do ponto anterior da rota; null quando não há coordenada. */
  legDistanceKm?: number | null;
  /** Distância (km) acumulada desde a partida. */
  cumulativeKm?: number | null;
  /** Minutos previstos desde a partida até esta parada. */
  etaMinutes?: number | null;
  /** Horário previsto de chegada ("HH:mm"). */
  etaClock?: string | null;
}

// ----- Avisos -----

/** Conjunto fixo de emojis de reação. */
export const NOTICE_EMOJIS = ['👍', '❤️', '😊', '😮', '😢', '🙏'] as const;

export type NoticePriority = 'URGENT' | 'INFO';

/** Reações agrupadas por emoji, com os nomes de quem reagiu. */
export interface ReactionGroup {
  emoji: string;
  count: number;
  names: string[];
}

/** Comentário em um aviso. `mine` = é do próprio usuário (pode excluir). */
export interface NoticeCommentDto {
  id: number;
  authorName: string;
  text: string;
  createdAt: string;
  mine: boolean;
}

/** Possível destinatário de um aviso (para segmentar). */
export interface AudienceRecipient {
  guardianId: number;
  guardianName: string;
  studentName: string;
  school: string;
  neighborhood: string;
}

/** Aviso visto pelo transportador (agendamento, prioridade, engajamento). */
export interface TransporterNoticeDto {
  id: number;
  title: string | null;
  message: string;
  createdAt: string;
  publishAt: string;
  scheduled: boolean;
  priority: NoticePriority;
  allowComments: boolean;
  audienceAll: boolean;
  recipients: number;
  viewedCount: number;
  commentsCount: number;
  reactions: ReactionGroup[];
}

/** Aviso visto pelo responsável (própria reação, quem reagiu, comentários). */
export interface GuardianNoticeDto {
  id: number;
  title: string | null;
  message: string;
  createdAt: string;
  publishAt: string;
  transporterName: string;
  priority: NoticePriority;
  allowComments: boolean;
  myReaction: string | null;
  commentsCount: number;
  reactions: ReactionGroup[];
  /** "Lido": o responsável já abriu, reagiu ou comentou — sai da home. */
  acknowledged: boolean;
}

// ----- Chat (integração real) -----

/** Resumo de conversa para a lista (vindo da API). */
export interface ConversationDto {
  id: number;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
}

/** Mensagem do histórico (REST) — `fromMe` já calculado pelo backend. */
export interface MessageDto {
  id: number;
  text: string;
  time: string;
  fromMe: boolean;
}

/** Mensagem difundida pelo WebSocket — neutra; o cliente calcula `fromMe`. */
export interface ChatBroadcastDto {
  conversationId: number;
  id: number;
  text: string;
  time: string;
  senderUserId: number;
  senderName: string;
}

// ----- Perfil -----

/** Dependente (aluno) do responsável. */
export interface DependentDto {
  id: number;
  name: string;
  school: string;
}

/** Ajudante/monitor do transportador. */
export interface HelperDto {
  id: number;
  name: string;
  role: string;
  /** Caminho relativo da foto no backend (use mediaUrl()); null se sem foto. */
  photoUrl: string | null;
  /** Ativo no perfil público. */
  active: boolean;
}

/** Perfil próprio do transportador (tela "Meu Perfil"). */
/** Zona de preço por escola/bairro (visão de edição, vinda da API). */
export interface PriceZoneDto {
  id: number;
  name: string;
  school: string | null;
  neighborhoods: string[];
  monthlyFee: number;
  annualFee: number | null;
  installmentMonthlyFee: number | null;
}

export interface TransporterProfileDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  photoUrl: string | null;
  cnh: string | null;
  plate: string | null;
  /** Plano mensal (valor de tabela). */
  baseMonthlyFee: number;
  /** Plano anual (total à vista); null = não oferecido. */
  annualPlanFee: number | null;
  /** Plano parcelado (mensalidade com fidelidade); null = não oferecido. */
  installmentMonthlyFee: number | null;
  acceptsProposals: boolean;
  schools: string[];
  neighborhoods: string[];
  priceZones: PriceZoneDto[];
  helpers: HelperDto[];
  /** Modelo de contrato (texto) do transportador; null usa o texto padrão. */
  contractTemplate: string | null;
}

/** Janela agendada de compartilhamento (dayOfWeek ISO 1=seg…7=dom; horas "HH:mm"). */
export interface LocationWindowDto {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

/** Config de compartilhamento de localização do transportador. */
export interface LocationSharingDto {
  enabled: boolean;
  windows: LocationWindowDto[];
}

/** Taxas do VanBora (frações; ex.: 0.05 = 5%), de GET /api/config/fees. */
export interface FeesDto {
  adminMonthly: number;
  adminAnnual: number;
  gatewayRate: number;
  gatewayFixed: number;
  fidelityMonths: number;
  installmentFine: number;
}

/** Situação do consentimento (LGPD) do usuário. */
export interface ConsentStatusDto {
  /** true = consentimento vigente (aceito e não revogado). */
  granted: boolean;
  version: string | null;
  acceptedAt: string | null;
  revokedAt: string | null;
}

/** Opções dos filtros de busca (escolas/bairros já cadastrados, em ordem alfabética). */
export interface SearchFiltersDto {
  schools: string[];
  neighborhoods: string[];
}

/** Resumo do transportador nos resultados de busca. */
export interface TransporterSummaryDto {
  id: number;
  name: string;
  photoUrl: string | null;
  rating: number;
  reviewsCount: number;
  schools: string[];
  neighborhoods: string[];
  monthlyFee: number;
}

/** Avaliação exibida no perfil público. */
export interface TransporterReviewDto {
  id: number;
  authorName: string;
  rating: number;
  comment: string;
}

/** Perfil público do transportador, visto pelo responsável. */
export interface TransporterDetailDto {
  id: number;
  name: string;
  photoUrl: string | null;
  phone: string;
  rating: number;
  reviewsCount: number;
  yearsExperience: number;
  schools: string[];
  neighborhoods: string[];
  monthlyFee: number;
  acceptsProposals: boolean;
  helpers: HelperDto[];
  reviews: TransporterReviewDto[];
}

// ----- Contratação pela plataforma -----

export type PaymentMethodType = 'CREDIT_CARD' | 'AUTO_DEBIT';

export type ContractStatus = 'PENDING_SIGNATURE' | 'ACTIVE' | 'CANCELLED';

/** Meio de pagamento salvo (sem dados sensíveis). */
export interface PaymentMethodDto {
  id: number;
  type: PaymentMethodType;
  brand: string;
  last4: string;
}

/** Contrato exibido ao responsável. */
/** Plano de contratação. */
export type PlanType = 'MONTHLY' | 'ANNUAL' | 'INSTALLMENT';

export interface ContractDto {
  id: number;
  status: ContractStatus;
  transporterId: number;
  transporterName: string;
  dependentId: number;
  studentName: string;
  school: string;
  /** Plano mensal (valor de tabela). */
  monthlyFee: number;
  /** Plano anual total à vista; null = não ofertado. */
  annualPlanFee: number | null;
  /** Plano parcelado (mensalidade); null = não ofertado. */
  installmentMonthlyFee: number | null;
  /** Plano escolhido na assinatura (MONTHLY enquanto pendente). */
  planType: PlanType;
  /** Meses de fidelidade do plano assinado (0 = sem fidelidade). */
  fidelityMonths: number | null;
  /** Multa cobrada na rescisão (se houve). */
  cancellationFine: number | null;
  /** Reembolso devolvido na rescisão (se houve). */
  refundAmount: number | null;
  signedAt: string | null;
  /** Texto do contrato a ser lido e assinado (congelado na liberação). */
  contractText: string | null;
}

/** Prévia da rescisão de um contrato (multa ou reembolso). */
export interface CancellationPreviewDto {
  planType: PlanType;
  monthsElapsed: number;
  fidelityActive: boolean;
  fineAmount: number;
  refundAmount: number;
  requiresPayment: boolean;
  message: string;
}

/** Solicitação de contratação exibida ao transportador, com dados do responsável. */
export interface HireRequestDto {
  id: number;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  studentName: string;
  school: string;
  neighborhood: string;
  /** Valor de tabela do transportador. */
  baseFee: number;
  /** Valor proposto pelo responsável (null = sem proposta). */
  proposedFee: number | null;
}

/**
 * Resposta do acompanhamento em tempo real do responsável.
 * Por privacidade, expõe só a parada do próprio dependente, a escola e a ordem
 * de embarque — nunca dados de outros responsáveis.
 */
export interface GuardianTracking {
  hasTransporter: boolean;
  transporterName: string | null;
  studentName: string | null;
  latitude: number | null;
  longitude: number | null;
  updatedAt: string | null;
  myStop: ApiRouteStop | null;
  schoolStop: ApiRouteStop | null;
  myOrder: number | null;
  totalStops: number | null;
  goingToday: boolean;
}

export interface Helper {
  id: string;
  name: string;
  role: string;
}

export interface ChatPreview {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  time: string;
  fromMe: boolean;
}

export interface PriceZone {
  id: string;
  name: string;
  neighborhoods: string[];
  monthlyFee: string;
}
