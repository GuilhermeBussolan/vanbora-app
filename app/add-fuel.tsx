import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, Button, Input, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { addFuel } from '@/api/finance';
import { parseAmount } from './add-expense';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Registro de um abastecimento (litros + valor). */
export default function AddFuelScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [liters, setLiters] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const litersValue = parseAmount(liters);
    const amountValue = parseAmount(amount);
    if (litersValue == null || litersValue <= 0) {
      setError('Informe a quantidade de litros.');
      return;
    }
    if (amountValue == null || amountValue <= 0) {
      setError('Informe o valor pago.');
      return;
    }
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await addFuel(token, { date: null, liters: litersValue, amount: amountValue });
      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao registrar o abastecimento.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen footer={<Button label="Registrar abastecimento" onPress={handleSave} loading={loading} />}>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Registrar Abastecimento</Text>
      <Text style={styles.subtitle}>Acompanhe seu consumo de combustível.</Text>

      <Text style={styles.fieldLabel}>Litros</Text>
      <Input
        icon="water-outline"
        placeholder="Ex.: 40"
        value={liters}
        onChangeText={setLiters}
        keyboardType="numeric"
        containerStyle={styles.field}
      />

      <Text style={styles.fieldLabel}>Valor pago (R$)</Text>
      <Input
        icon="cash-outline"
        placeholder="0,00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        containerStyle={styles.field}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  title: { marginTop: spacing.md },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  field: { marginBottom: spacing.sm },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.sm },
});
