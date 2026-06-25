import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppHeader, Screen } from '@/components';
import { colors, spacing, typography } from '@/theme';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: '1. Sobre o serviço',
    body: 'O VanBora é uma plataforma que conecta responsáveis e transportadores escolares, permitindo busca, contratação, acompanhamento de rotas em tempo real e pagamento das mensalidades.',
  },
  {
    title: '2. Contratação e pagamentos',
    body: 'A contratação ocorre pela plataforma. Os pagamentos são processados por um provedor externo de pagamentos; o VanBora não armazena os dados completos do seu cartão — apenas um token seguro, a bandeira e os últimos quatro dígitos.',
  },
  {
    title: '3. Localização',
    body: 'Durante as viagens, a localização do transportador é compartilhada com os responsáveis vinculados, exclusivamente para acompanhamento do trajeto. Cada responsável visualiza apenas a própria parada e a posição do transporte.',
  },
  {
    title: '4. Responsabilidades',
    body: 'Responsáveis e transportadores comprometem-se a manter seus dados atualizados e a utilizar a plataforma de boa-fé. O transportador é responsável pela prestação do serviço de transporte contratado.',
  },
  {
    title: '5. Privacidade',
    body: 'Seus dados são utilizados apenas para a operação do serviço e não são compartilhados com terceiros além do estritamente necessário para a prestação do transporte e o processamento dos pagamentos.',
  },
];

/** Termos de uso do VanBora (conteúdo estático). */
export default function TermsScreen() {
  return (
    <Screen>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Termos de Uso</Text>
      <Text style={styles.updated}>Última atualização: junho de 2026</Text>

      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.body}>{section.body}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.md },
  updated: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  body: { fontSize: 13, lineHeight: 20, color: colors.textSecondary },
});
