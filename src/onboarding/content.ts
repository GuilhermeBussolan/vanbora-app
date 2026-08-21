import { Ionicons } from '@expo/vector-icons';

/**
 * Catálogo versionado do guia de funcionalidades (onboarding), por perfil.
 *
 * Como adicionar uma novidade no futuro:
 * 1. Adicione um novo objeto `OnboardingStep` no array do(s) perfil(is) afetado(s).
 * 2. Dê a ele `sinceVersion` igual ao próximo número da versão daquele perfil
 *    (a versão "atual" de um perfil é sempre a maior `sinceVersion` entre seus steps —
 *    não precisa atualizar nenhum contador em outro lugar).
 * 3. Pronto: no próximo acesso, quem já viu uma versão anterior recebe automaticamente
 *    só os steps novos (card "Novidades no Vanbora"); quem nunca viu nada recebe o
 *    catálogo completo (guia inicial). Nenhuma outra lógica precisa mudar.
 *
 * O progresso de cada usuário (qual versão ele já viu) fica no backend
 * (`user.onboardingLastSeenVersion`, ver `useOnboardingGate`) — este arquivo só
 * descreve o CONTEÚDO, nunca o estado de quem já viu o quê.
 */

export type OnboardingRole = 'guardian' | 'transporter';

export interface OnboardingStep {
  /** Estável — não reutilize/renomeie ids depois de publicados. */
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Rota de atalho opcional ("Ver agora"), quando fizer sentido levar a algum lugar. */
  targetScreen?: string;
  /** Versão do guia em que este step foi introduzido. */
  sinceVersion: number;
}

export const ONBOARDING_CATALOG: Record<OnboardingRole, OnboardingStep[]> = {
  guardian: [
    {
      id: 'guardian.children-school',
      title: 'Seus filhos e a escola deles',
      description:
        'Cadastre cada filho, edite os dados quando precisar e escolha a escola no catálogo — isso garante que o ponto de embarque no mapa fique certinho.',
      icon: 'people-outline',
      targetScreen: '/(guardian)/profile',
      sinceVersion: 1,
    },
    {
      id: 'guardian.hire',
      title: 'Buscar e contratar um transportador',
      description:
        'Busque por escola ou bairro, veja perfil e avaliações, envie a solicitação (com proposta de valor, se o transportador aceitar negociar) e assine o contrato quando ele aceitar.',
      icon: 'search-outline',
      targetScreen: '/(guardian)/search',
      sinceVersion: 1,
    },
    {
      id: 'guardian.payments',
      title: 'Pagamentos e mensalidades',
      description:
        'Acompanhe o cronograma completo: o que já foi pago, o que está pendente e a projeção dos próximos meses.',
      icon: 'cash-outline',
      targetScreen: '/payments',
      sinceVersion: 1,
    },
    {
      id: 'guardian.attendance-tracking',
      title: 'Avisar falta e rastrear o trajeto',
      description:
        'Seu filho é presente por padrão — avise só quando ele não for. E acompanhe a van em tempo real no dia, com a ordem de embarque e o horário previsto.',
      icon: 'location-outline',
      targetScreen: '/(guardian)/tracking',
      sinceVersion: 1,
    },
    {
      id: 'guardian.chat-notices',
      title: 'Chat e mural de avisos',
      description:
        'Fale direto com o transportador pelo chat e acompanhe os avisos que ele publica (recados do dia, mudanças de horário e mais).',
      icon: 'chatbubbles-outline',
      targetScreen: '/(guardian)/chats',
      sinceVersion: 1,
    },
    {
      id: 'guardian.review',
      title: 'Avalie o transportador',
      description:
        'Ao assinar, a cada 3 meses de uso ou ao cancelar, você pode avaliar o serviço — isso ajuda outras famílias a escolherem melhor.',
      icon: 'star-outline',
      sinceVersion: 1,
    },
  ],
  transporter: [
    {
      id: 'transporter.profile-vehicle',
      title: 'Perfil público e veículo',
      description:
        'Capriche na foto, dados do veículo e placa — é o que as famílias veem antes de te contratar.',
      icon: 'car-outline',
      targetScreen: '/(transporter)/profile',
      sinceVersion: 1,
    },
    {
      id: 'transporter.area-helpers',
      title: 'Área de atendimento e ajudantes',
      description:
        'Cadastre as escolas (por CEP, pro mapa ficar preciso) e bairros que você atende, e adicione seus ajudantes com foto e função.',
      icon: 'map-outline',
      targetScreen: '/edit-service-area',
      sinceVersion: 1,
    },
    {
      id: 'transporter.pricing',
      title: 'Preço e propostas',
      description:
        'Defina o valor mensal de tabela e escolha se aceita receber propostas de valor diferentes dos responsáveis.',
      icon: 'cash-outline',
      targetScreen: '/edit-pricing',
      sinceVersion: 1,
    },
    {
      id: 'transporter.hire-requests',
      title: 'Solicitações e negociação',
      description:
        'Aceite, recuse ou contraproponha um valor diferente para cada solicitação de contratação recebida.',
      icon: 'document-text-outline',
      targetScreen: '/(transporter)/home',
      sinceVersion: 1,
    },
    {
      id: 'transporter.students-attendance',
      title: 'Alunos e presença do dia',
      description:
        'Veja todos os alunos vinculados e quem confirmou presença ou avisou falta hoje.',
      icon: 'people-outline',
      targetScreen: '/students',
      sinceVersion: 1,
    },
    {
      id: 'transporter.route-location',
      title: 'Rota e localização',
      description:
        'Otimize a ordem das paradas do dia (quem faltou sai da rota automaticamente) e compartilhe sua localização ao vivo com as famílias.',
      icon: 'navigate-outline',
      targetScreen: '/(transporter)/routes',
      sinceVersion: 1,
    },
    {
      id: 'transporter.chat-notices-reviews',
      title: 'Chat, avisos e avaliações',
      description:
        'Converse com os responsáveis, publique avisos no mural (geral ou só pra alguns) e acompanhe as avaliações recebidas.',
      icon: 'chatbubbles-outline',
      targetScreen: '/(transporter)/chats',
      sinceVersion: 1,
    },
  ],
};

/** Versão atual do guia para o perfil (maior `sinceVersion` entre os steps dele). */
export function currentOnboardingVersion(role: OnboardingRole): number {
  return ONBOARDING_CATALOG[role].reduce((max, step) => Math.max(max, step.sinceVersion), 0);
}
