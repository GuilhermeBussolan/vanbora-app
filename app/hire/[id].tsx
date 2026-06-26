import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Card, Input, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { createHireRequest } from '@/api/hire';
import { listDependents } from '@/api/dependents';
import { formatCurrency } from '@/data/mockData';
import { DependentDto } from '@/types';
import { parseAmount } from '../add-expense';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Envio de solicitação de contratação: escolha do aluno + proposta de valor opcional. */
export default function HireScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const params = useLocalSearchParams<{ id: string; name?: string; fee?: string; proposals?: string }>();
  const transporterId = Number(params.id);
  const transporterName = params.name ?? 'o transportador';
  const baseFee = params.fee ? Number(params.fee) : 0;
  const acceptsProposals = params.proposals === '1';

  const [dependents, setDependents] = useState<DependentDto[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [proposing, setProposing] = useState(false);
  const [proposedFee, setProposedFee] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    listDependents(token)
      .then((list) => {
        setDependents(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch((err) => setError(err?.message ?? 'Falha ao carregar seus dependentes.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSend() {
    if (selectedId == null) {
      setError('Selecione o aluno.');
      return;
    }
    let proposedValue: number | null = null;
    if (acceptsProposals && proposing) {
      const value = parseAmount(proposedFee);
      if (value == null || value <= 0) {
        setError('Informe um valor de proposta válido.');
        return;
      }
      proposedValue = value;
    }
    if (!token) return;
    setSending(true);
    setError(null);
    try {
      await createHireRequest(token, {
        transporterId,
        dependentId: selectedId,
        proposedFee: proposedValue,
      });
      Alert.alert(
        'Solicitação enviada!',
        `${transporterName} vai receber seu pedido e poderá liberar o contrato.`,
        [{ text: 'OK', onPress: () => router.replace('/(guardian)/home') }],
      );
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao enviar a solicitação.');
    } finally {
      setSending(false);
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
    <Screen footer={<Button label="Enviar solicitação" onPress={handleSend} loading={sending} />}>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Contratar {transporterName}</Text>
      <Text style={styles.subtitle}>
        Valor de tabela: <Text style={styles.fee}>{formatCurrency(baseFee)}/mês</Text>
      </Text>

      <Text style={styles.fieldLabel}>Para qual aluno?</Text>
      {dependents.length === 0 ? (
        <Card>
          <Text style={styles.empty}>
            Você ainda não tem alunos cadastrados. Cadastre um dependente primeiro.
          </Text>
          <Button
            label="Adicionar Dependente"
            variant="outline"
            icon="add"
            onPress={() => router.push('/add-dependent')}
            style={styles.addBtn}
          />
        </Card>
      ) : (
        <View style={styles.deps}>
          {dependents.map((d) => {
            const selected = d.id === selectedId;
            return (
              <Pressable
                key={d.id}
                onPress={() => setSelectedId(d.id)}
                style={[styles.depCard, selected && styles.depCardSelected]}
              >
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selected ? colors.brandDark : colors.textMuted}
                />
                <View style={styles.depInfo}>
                  <Text style={styles.depName}>{d.name}</Text>
                  <Text style={styles.depSchool}>{d.school}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}

      {acceptsProposals ? (
        <View style={styles.proposalBox}>
          <View style={styles.proposalHeader}>
            <Ionicons name="pricetag-outline" size={18} color={colors.brandDark} />
            <Text style={styles.proposalTitle}>Este transportador aceita propostas</Text>
          </View>
          <Pressable style={styles.toggleRow} onPress={() => setProposing((v) => !v)}>
            <Ionicons
              name={proposing ? 'checkbox' : 'square-outline'}
              size={20}
              color={proposing ? colors.brandDark : colors.textMuted}
            />
            <Text style={styles.toggleText}>Quero propor um valor diferente</Text>
          </Pressable>
          {proposing ? (
            <Input
              icon="cash-outline"
              placeholder="Valor proposto (R$/mês)"
              value={proposedFee}
              onChangeText={setProposedFee}
              keyboardType="numeric"
              containerStyle={styles.proposalInput}
            />
          ) : null}
          <Text style={styles.proposalHint}>
            A proposta vai junto com o pedido. O transportador decide aceitar ou recusar.
          </Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxxl },
  title: { marginTop: spacing.md },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  fee: { fontWeight: '800', color: colors.textPrimary },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  empty: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  addBtn: { marginTop: spacing.md },
  deps: { gap: spacing.sm },
  depCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  depCardSelected: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  depInfo: { flex: 1 },
  depName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  depSchool: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  proposalBox: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  proposalHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  proposalTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  toggleText: { fontSize: 14, color: colors.textPrimary },
  proposalInput: { marginTop: spacing.md, backgroundColor: colors.white },
  proposalHint: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 17 },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.lg },
});
