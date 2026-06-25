import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, Button, Input, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { getMyProfile, updatePricing } from '@/api/transporter';
import { parseAmount } from './add-expense';
import { colors, spacing, typography } from '@/theme';

/** Configuração de preço do transportador: valor de tabela e aceitação de propostas. */
export default function EditPricingScreen() {
  const { token } = useAppState();
  const [fee, setFee] = useState('');
  const [acceptsProposals, setAcceptsProposals] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getMyProfile(token)
      .then((p) => {
        setFee(p.baseMonthlyFee ? String(p.baseMonthlyFee) : '');
        setAcceptsProposals(p.acceptsProposals);
      })
      .catch((err) => setError(err?.message ?? 'Falha ao carregar os dados.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSave() {
    const feeValue = parseAmount(fee);
    if (feeValue == null || feeValue < 0) {
      setError('Informe um valor de tabela válido.');
      return;
    }
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await updatePricing(token, { baseMonthlyFee: feeValue, acceptsProposals });
      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao salvar.');
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
    <Screen footer={<Button label="Salvar" onPress={handleSave} loading={saving} />}>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Preço e Propostas</Text>
      <Text style={styles.subtitle}>
        Defina o valor de tabela que os responsáveis veem no seu perfil.
      </Text>

      <Text style={styles.fieldLabel}>Valor de tabela (R$/mês)</Text>
      <Input
        icon="cash-outline"
        placeholder="Ex.: 380,00"
        value={fee}
        onChangeText={setFee}
        keyboardType="numeric"
        containerStyle={styles.field}
      />

      <View style={styles.toggleRow}>
        <View style={styles.flex1}>
          <Text style={styles.toggleLabel}>Aceitar propostas de valor</Text>
          <Text style={styles.toggleHint}>
            Se ativado, o responsável pode propor um valor diferente ao solicitar. Você decide aceitar ou não.
          </Text>
        </View>
        <Switch
          value={acceptsProposals}
          onValueChange={setAcceptsProposals}
          trackColor={{ true: colors.brand, false: colors.border }}
          thumbColor={colors.white}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxxl },
  title: { marginTop: spacing.md },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg, lineHeight: 19 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs },
  field: { marginBottom: spacing.sm },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  flex1: { flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  toggleHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.lg },
});
