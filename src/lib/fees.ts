/**
 * Cálculo financeiro do lado do app — espelho do FeeCalculator do backend. Usa as
 * taxas de GET /api/config/fees para mostrar, ao vivo, quanto o transportador
 * recebe líquido em cada plano (descontadas as taxas VanBora e do gateway).
 */
import { FeesDto } from '@/types';

export interface FeeBreakdown {
  /** Valor bruto cobrado do responsável. */
  gross: number;
  /** Taxa administrativa retida pelo VanBora. */
  adminFee: number;
  /** Taxa retida pelo gateway de pagamento. */
  gatewayFee: number;
  /** Valor líquido que sobra para o transportador. */
  net: number;
}

const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

function breakdown(gross: number, adminRate: number, fees: FeesDto): FeeBreakdown {
  const value = Number.isFinite(gross) && gross > 0 ? gross : 0;
  const adminFee = round2(value * adminRate);
  const gatewayFee = round2(value * fees.gatewayRate + fees.gatewayFixed);
  const net = round2(value - adminFee - gatewayFee);
  return { gross: round2(value), adminFee, gatewayFee, net };
}

/** Detalha um valor mensal (planos mensal e parcelado). */
export function monthlyBreakdown(gross: number, fees: FeesDto): FeeBreakdown {
  return breakdown(gross, fees.adminMonthly, fees);
}

/** Detalha o valor total do plano anual pago à vista. */
export function annualBreakdown(total: number, fees: FeesDto): FeeBreakdown {
  return breakdown(total, fees.adminAnnual, fees);
}

/** Multa de rescisão do parcelado: 50% da soma das mensalidades restantes. */
export function installmentFine(installmentMonthly: number, monthsElapsed: number, fees: FeesDto): number {
  const remaining = Math.max(0, fees.fidelityMonths - Math.max(0, monthsElapsed));
  return round2(installmentMonthly * remaining * fees.installmentFine);
}

/** Reembolso proporcional do anual, retendo a taxa administrativa já cobrada. */
export function annualRefund(total: number, monthsUsed: number, fees: FeesDto): number {
  const months = fees.fidelityMonths;
  const used = Math.min(Math.max(0, monthsUsed), months);
  const unused = months - used;
  if (unused <= 0) return 0;
  const netOfAdmin = total - total * fees.adminAnnual;
  return round2((netOfAdmin * unused) / months);
}

/** "0.05" → "5%". */
export function formatRate(rate: number): string {
  const pct = rate * 100;
  const str = Number.isInteger(pct) ? String(pct) : pct.toFixed(2).replace('.', ',');
  return `${str}%`;
}
