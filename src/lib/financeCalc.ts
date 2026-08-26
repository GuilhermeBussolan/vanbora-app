/** Cálculos client-side da Visão Geral do Financeiro — espelham as regras já usadas no backend. */
import { SuggestionDto } from '@/api/finance';

/** Variação percentual; null quando o valor anterior é zero (evita divisão por zero / "+infinito%"). */
export function pctChange(previous: number, current: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100 * 10) / 10;
}

/** Saldo do período anterior — o backend não devolve isso pronto, só previousReceived/previousExpenses. */
export function previousBalance(previousReceived: number, previousExpenses: number): number {
  return previousReceived - previousExpenses;
}

/** Ordem de prioridade das sugestões na Visão Geral; título fora da lista fica por último. */
const SUGGESTION_PRIORITY: Record<string, number> = {
  'Revisão em atraso': 0,
  'Revisão próxima': 1,
  'Defina uma meta': 2,
  'Configure a manutenção': 3,
  'Combustível estimado do mês': 4,
};

/** Corta a lista de sugestões para no máximo `max`, na ordem de prioridade acima. */
export function pickTopSuggestions(suggestions: SuggestionDto[], max = 2): SuggestionDto[] {
  return [...suggestions]
    .sort((a, b) => (SUGGESTION_PRIORITY[a.title] ?? 99) - (SUGGESTION_PRIORITY[b.title] ?? 99))
    .slice(0, max);
}

export interface SuggestionRoute {
  pathname: string;
  params?: Record<string, string>;
  label: string;
}

/** Infere o destino de "Ver X →" a partir de suggestedCategory/título — só no cliente, sem mudança de backend. */
export function inferSuggestionRoute(s: SuggestionDto): SuggestionRoute | null {
  if (s.suggestedCategory === 'Combustível') {
    return { pathname: '/(transporter)/finance/operations', params: { section: 'fuel' }, label: 'Ver combustível' };
  }
  if (s.suggestedCategory === 'Manutenção' || s.title === 'Configure a manutenção') {
    return {
      pathname: '/(transporter)/finance/operations',
      params: { section: 'maintenance' },
      label: 'Ver manutenção',
    };
  }
  if (s.title === 'Defina uma meta') {
    return { pathname: '/finance-settings', label: 'Configurar' };
  }
  return null;
}
