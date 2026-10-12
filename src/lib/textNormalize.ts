/** Padronização de nomes livres (escola, bairro) — espelha `TextNormalization` do backend. */

/** Remove acentos e caixa, para comparar "São Paulo" com "sao paulo" (dedup, busca). */
export function foldForCompare(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/** "VILA MARIANA" / "vila mariana" → "Vila Mariana". Preserva acentos, colapsa espaços extras. */
export function titleCase(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed) return trimmed;
  return trimmed
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
