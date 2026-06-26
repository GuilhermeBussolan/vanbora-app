/**
 * Validação e máscaras de campos de cadastro (telefone, CPF, e-mail, CNH, placa).
 * As máscaras são aplicadas no `onChangeText`; a validação roda antes de enviar.
 */

/** Remove tudo que não for dígito. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

// ----- Telefone: (DDD) 9 1234-5678 -----

/** Formata progressivamente como (DDD) 9 1234-5678 (celular, 11 dígitos). */
export function formatPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length === 3) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7, 11)}`;
}

/** Válido = 11 dígitos (DDD + 9 do celular). */
export function isValidPhone(value: string): boolean {
  return onlyDigits(value).length === 11;
}

// ----- CPF: 123.456.789-10 -----

/** Formata progressivamente como 123.456.789-10. */
export function formatCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Valida CPF (11 dígitos + dígitos verificadores). */
export function isValidCpf(value: string): boolean {
  const c = onlyDigits(value);
  if (c.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(c)) return false; // todos iguais
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(c[i], 10) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(c[9], 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(c[i], 10) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(c[10], 10);
}

// ----- E-mail -----

/** Válido = contém "@", domínio e terminação (.com, .com.br, .net, etc.). */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

// ----- CNH: 11 dígitos (padrão oficial) -----

/** Mantém só dígitos, máx. 11. */
export function formatCnh(value: string): string {
  return onlyDigits(value).slice(0, 11);
}

/** Valida CNH no padrão oficial: 9 dígitos base + 2 verificadores (11 no total). */
export function isValidCnh(value: string): boolean {
  const c = onlyDigits(value);
  if (c.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(c)) return false; // todos iguais
  let dsc = 0;
  let sum = 0;
  for (let i = 0, j = 9; i < 9; i++, j--) sum += parseInt(c[i], 10) * j;
  let d1 = sum % 11;
  if (d1 >= 10) {
    d1 = 0;
    dsc = 2;
  }
  sum = 0;
  for (let i = 0, j = 1; i < 9; i++, j++) sum += parseInt(c[i], 10) * j;
  const r = sum % 11;
  let d2 = r >= 10 ? 0 : r - dsc;
  if (d2 < 0) d2 += 11;
  return d1 === parseInt(c[9], 10) && d2 === parseInt(c[10], 10);
}

// ----- Placa: até 7 caracteres (letras e números) -----

/** Maiúsculas, só letras/números, máx. 7. */
export function formatPlate(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
}

/** Válido = 1 a 7 caracteres alfanuméricos. */
export function isValidPlate(value: string): boolean {
  const p = formatPlate(value);
  return p.length >= 1 && p.length <= 7;
}
