/**
 * Tokenização SIMULADA do cartão, no cliente.
 *
 * O ponto central de segurança (offload de PCI): o número do cartão e o CVV
 * NUNCA são enviados ao backend do VanBora. Aqui geramos um token opaco e
 * derivamos só a bandeira e os últimos 4 dígitos — é isso (e somente isso) que
 * trafega para a API. Em produção, esta função seria substituída pelo SDK do
 * gateway real (ex.: Mercado Pago), que tokeniza de verdade no dispositivo.
 */

export interface CardInput {
  number: string;
  holder: string;
  expiry: string; // MM/AA
  cvv: string;
}

export interface TokenizedCard {
  token: string;
  brand: string;
  last4: string;
}

/** Detecta a bandeira pelo prefixo do número (heurística simples de protótipo). */
export function detectBrand(rawNumber: string): string {
  const n = rawNumber.replace(/\D/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'Amex';
  if (/^(6011|65|64[4-9])/.test(n)) return 'Discover';
  if (/^(606282|3841)/.test(n)) return 'Hipercard';
  if (/^(38|60)/.test(n)) return 'Elo';
  return 'Cartão';
}

/** Formata a validade como MM/AA enquanto o usuário digita só números (insere a "/"). */
export function formatExpiry(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

/** Agrupa o número do cartão em blocos de 4 dígitos (apenas visual). */
export function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

/** Validação mínima do formulário (não substitui validação real do gateway). */
export function validateCard(input: CardInput): string | null {
  const number = input.number.replace(/\D/g, '');
  if (number.length < 13 || number.length > 19) return 'Número do cartão inválido.';
  if (!input.holder.trim()) return 'Informe o nome impresso no cartão.';
  if (!/^\d{2}\/\d{2}$/.test(input.expiry)) return 'Validade inválida (use MM/AA).';
  if (!/^\d{3,4}$/.test(input.cvv)) return 'CVV inválido.';
  return null;
}

/** Gera um token simulado a partir do cartão, descartando os dados sensíveis. */
export function tokenizeCard(input: CardInput): TokenizedCard {
  const digits = input.number.replace(/\D/g, '');
  const rand = Math.random().toString(36).slice(2, 12);
  return {
    token: `sim_tok_${rand}${Date.now().toString(36)}`,
    brand: detectBrand(digits),
    last4: digits.slice(-4),
  };
}
