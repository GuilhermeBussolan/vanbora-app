/**
 * Consulta de CEP via ViaCEP (gratuito, sem chave). Devolve os dados do endereço
 * para autopreencher rua/bairro/cidade; null se o CEP for inválido ou indisponível.
 */
export interface CepResult {
  street: string;
  neighborhood: string;
  city: string;
  uf: string;
}

export async function lookupCep(cep: string): Promise<CepResult | null> {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!response.ok) return null;
    const data = await response.json();
    if (data?.erro) return null;
    return {
      street: data.logradouro ?? '',
      neighborhood: data.bairro ?? '',
      city: data.localidade ?? '',
      uf: data.uf ?? '',
    };
  } catch {
    return null;
  }
}

/** Formata o CEP como 00000-000 enquanto o usuário digita. */
export function formatCep(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}
