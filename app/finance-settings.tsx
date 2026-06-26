import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, Button, Input, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { getFinanceSummary, updateFinanceSettings } from '@/api/finance';
import { parseAmount } from './add-expense';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Ajustes financeiros: meta de receita mensal e intervalo de manutenção (km). */
export default function FinanceSettingsScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [goal, setGoal] = useState('');
  const [intervalKm, setIntervalKm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getFinanceSummary(token)
      .then((s) => {
        if (s.goal.monthlyGoal != null) setGoal(String(s.goal.monthlyGoal));
        if (s.maintenance.intervalKm != null) setIntervalKm(String(s.maintenance.intervalKm));
      })
      .catch((err) => setError(err?.message ?? 'Falha ao carregar os ajustes.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSave() {
    const goalValue = goal.trim() ? parseAmount(goal) : null;
    const intervalValue = intervalKm.trim() ? Math.round(Number(intervalKm.trim())) : null;
    if (goal.trim() && (goalValue == null || goalValue < 0)) {
      setError('Meta de receita inválida.');
      return;
    }
    if (intervalKm.trim() && (intervalValue == null || Number.isNaN(intervalValue) || intervalValue < 0)) {
      setError('Intervalo de manutenção inválido.');
      return;
    }
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await updateFinanceSettings(token, {
        monthlyRevenueGoal: goalValue,
        maintenanceIntervalKm: intervalValue,
      });
      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao salvar os ajustes.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader showBack />
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen footer={<Button label="Salvar ajustes" onPress={handleSave} loading={saving} />}>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Ajustes Financeiros</Text>
      <Text style={styles.subtitle}>Defina sua meta e os lembretes de manutenção.</Text>

      <Text style={styles.fieldLabel}>Meta de receita mensal (R$)</Text>
      <Input
        icon="trophy-outline"
        placeholder="Ex.: 5000,00"
        value={goal}
        onChangeText={setGoal}
        keyboardType="numeric"
        containerStyle={styles.field}
      />
      <Text style={styles.hint}>Deixe em branco para não acompanhar uma meta.</Text>

      <Text style={styles.fieldLabel}>Intervalo de manutenção (km)</Text>
      <Input
        icon="construct-outline"
        placeholder="Ex.: 10000"
        value={intervalKm}
        onChangeText={setIntervalKm}
        keyboardType="numeric"
        containerStyle={styles.field}
      />
      <Text style={styles.hint}>
        Avisaremos quando você se aproximar do intervalo. Use "Revisão feita" no painel ao concluir.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxxl },
  title: { marginTop: spacing.md },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  field: { marginBottom: spacing.xs },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.sm },
});
