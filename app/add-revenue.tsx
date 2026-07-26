import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, Button, Input, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { setManualRevenue } from '@/api/finance';
import { parseAmount } from './add-expense';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/** [Transportador] Lança a receita de um mês anterior (backfill do gráfico). */
export default function AddRevenueScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const now = new Date();
  const [year, setYear] = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(now.getMonth()); // 0-based
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const value = parseAmount(amount);
    if (value == null || value < 0) {
      setError('Informe um valor válido.');
      return;
    }
    const y = Number(year);
    if (!Number.isInteger(y) || y < 2000 || y > 2100) {
      setError('Informe um ano válido.');
      return;
    }
    if (!token) return;
    const referenceMonth = `${y}-${String(month + 1).padStart(2, '0')}`;
    setSaving(true);
    setError(null);
    try {
      await setManualRevenue(token, referenceMonth, value);
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen footer={<Button label="Salvar receita" onPress={handleSave} loading={saving} />}>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Receita de mês anterior</Text>
      <Text style={styles.subtitle}>
        Lance a receita de um mês para completar o gráfico — inclusive de antes de você entrar no app.
      </Text>

      <Text style={styles.label}>Ano</Text>
      <Input
        icon="calendar-outline"
        placeholder="2026"
        keyboardType="number-pad"
        maxLength={4}
        value={year}
        onChangeText={(v) => setYear(v.replace(/\D/g, ''))}
        containerStyle={styles.field}
      />

      <Text style={styles.label}>Mês</Text>
      <View style={styles.months}>
        {MONTHS.map((m, i) => {
          const sel = i === month;
          return (
            <Pressable key={m} onPress={() => setMonth(i)} style={[styles.monthChip, sel && styles.monthChipSel]}>
              <Text style={[styles.monthText, sel && styles.monthTextSel]}>{m}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Receita do mês (R$)</Text>
      <Input
        icon="cash-outline"
        placeholder="Ex.: 3.200,00"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        containerStyle={styles.field}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    title: { marginTop: spacing.md },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
      lineHeight: 19,
    },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.sm },
    field: { marginBottom: spacing.sm },
    months: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
    monthChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      minWidth: 52,
      alignItems: 'center',
    },
    monthChipSel: { backgroundColor: colors.brand, borderColor: colors.brand },
    monthText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    monthTextSel: { color: colors.textOnBrand },
    error: { fontSize: 13, color: colors.danger, marginTop: spacing.lg },
  });
