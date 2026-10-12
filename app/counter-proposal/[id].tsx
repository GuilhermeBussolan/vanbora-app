import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppHeader, Button, Card, Input, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { counterProposeHireRequest } from '@/api/hire';
import { formatCurrency } from '@/data/mockData';
import { parseAmount } from '../add-expense';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** [Transportador] Contraproposta de valor em resposta à proposta do responsável. */
export default function CounterProposalScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    studentName?: string;
    baseFee?: string;
    proposedFee?: string;
  }>();
  const hireRequestId = Number(params.id);
  const guardianName = params.name ?? 'o responsável';
  const baseFee = params.baseFee ? Number(params.baseFee) : 0;
  const proposedFee = params.proposedFee ? Number(params.proposedFee) : 0;

  const [counterFee, setCounterFee] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSend() {
    const value = parseAmount(counterFee);
    if (value == null || value <= 0) {
      setError('Informe um valor de contraproposta válido.');
      return;
    }
    if (!token) return;
    setSending(true);
    setError(null);
    try {
      await counterProposeHireRequest(token, hireRequestId, value);
      Alert.alert(
        'Contraproposta enviada!',
        `${guardianName} vai receber seu novo valor e decidir se aceita.`,
        [{ text: 'OK', onPress: () => router.replace('/(transporter)/home') }],
      );
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao enviar a contraproposta.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen footer={<Button label="Enviar contraproposta" onPress={handleSend} loading={sending} />}>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Contrapropor</Text>
      <Text style={styles.subtitle}>
        Solicitação de {guardianName}
        {params.studentName ? ` para ${params.studentName}` : ''}.
      </Text>

      <Card style={styles.summaryCard}>
        <Text style={styles.summaryLine}>
          Valor de tabela: <Text style={styles.summaryValue}>{formatCurrency(baseFee)}/mês</Text>
        </Text>
        <Text style={styles.summaryLine}>
          Proposta do responsável:{' '}
          <Text style={styles.summaryValue}>{formatCurrency(proposedFee)}/mês</Text>
        </Text>
      </Card>

      <Text style={styles.fieldLabel}>Seu novo valor</Text>
      <Input
        icon="cash-outline"
        placeholder="Valor da contraproposta (R$/mês)"
        value={counterFee}
        onChangeText={setCounterFee}
        keyboardType="numeric"
      />
      <Text style={styles.hint}>
        O responsável vai ver os dois valores e decidir se aceita, recusa ou busca outro transportador.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  title: { marginTop: spacing.md },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  summaryCard: { gap: spacing.xs, marginBottom: spacing.lg },
  summaryLine: { fontSize: 13, color: colors.textSecondary },
  summaryValue: { fontWeight: '800', color: colors.textPrimary },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  hint: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 17 },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.lg },
});
