import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader, Screen } from '@/components';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: '1. Controlador dos dados',
    body: 'O VanBora é o controlador dos dados pessoais tratados neste aplicativo, nos termos da Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD). Dúvidas ou solicitações sobre seus dados podem ser enviadas para vanbora2026@gmail.com.',
  },
  {
    title: '2. Dados que coletamos',
    body: 'Coletamos os dados que você fornece no cadastro e no uso do serviço: nome, e-mail, telefone, CPF e, no caso do transportador, CNH e placa do veículo; endereços de embarque e entrega; dados do(a) aluno(a) informados pelo responsável; localização do transporte durante as viagens; e um token seguro do meio de pagamento (nunca o número completo do cartão).',
  },
  {
    title: '3. Finalidade do tratamento',
    body: 'Usamos seus dados exclusivamente para operar o serviço: conectar responsáveis e transportadores, viabilizar a contratação e a assinatura do contrato, acompanhar as rotas em tempo real, processar as mensalidades e manter a comunicação entre as partes.',
  },
  {
    title: '4. Base legal',
    body: 'O tratamento se apoia no seu consentimento (art. 7º, I) e na execução do contrato de prestação do serviço de transporte (art. 7º, V). O consentimento dado no cadastro fica registrado com data e versão desta política.',
  },
  {
    title: '5. Compartilhamento',
    body: 'Seus dados são compartilhados apenas com o transportador vinculado (no estritamente necessário ao transporte) e com o provedor de pagamentos que processa as mensalidades. Não vendemos nem cedemos seus dados a terceiros para fins de marketing.',
  },
  {
    title: '6. Dados de crianças e adolescentes',
    body: 'Os dados do(a) aluno(a) são fornecidos pelo responsável legal, que declara ter autoridade para tanto. Tratamos esses dados sempre no melhor interesse da criança e apenas para a execução do transporte.',
  },
  {
    title: '7. Armazenamento e segurança',
    body: 'Os dados são armazenados de forma protegida e mantidos pelo tempo necessário à prestação do serviço e ao cumprimento de obrigações legais. Senhas são guardadas de forma criptografada e os dados de cartão são tokenizados no aparelho.',
  },
  {
    title: '8. Seus direitos (LGPD)',
    body: 'Você pode, a qualquer momento, solicitar acesso, correção, portabilidade ou exclusão dos seus dados, bem como revogar o consentimento. Para exercer esses direitos, entre em contato pelo e-mail vanbora2026@gmail.com.',
  },
  {
    title: '9. Atualizações desta política',
    body: 'Esta política pode ser atualizada. Quando o conteúdo mudar, registramos uma nova versão e solicitamos novamente o seu aceite quando aplicável.',
  },
];

/** Política de Privacidade e Proteção de Dados (LGPD) do VanBora. */
export default function PrivacyPolicyScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  return (
    <Screen>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Política de Privacidade</Text>
      <Text style={styles.updated}>Versão 2026-06-26 • Lei nº 13.709/2018 (LGPD)</Text>

      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.body}>{section.body}</Text>
        </View>
      ))}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    title: { marginTop: spacing.md },
    updated: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
    section: { marginBottom: spacing.lg },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
    body: { fontSize: 13, lineHeight: 20, color: colors.textSecondary },
  });
