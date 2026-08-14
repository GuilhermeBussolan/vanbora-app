import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Card, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { listTransporterContracts } from '@/api/contracts';
import { formatCurrency } from '@/data/mockData';
import { ContractDto } from '@/types';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/** Histórico de contratos cancelados do transportador, com todos os dados de cada um. */
export default function CancelledContractsScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [contracts, setContracts] = useState<ContractDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    listTransporterContracts(token, 'CANCELLED')
      .then(setContracts)
      .catch((err) => setError(err?.message ?? 'Falha ao carregar os contratos cancelados.'))
      .finally(() => setLoading(false));
  }, [token]);

  useFocusEffect(load);

  return (
    <Screen>
      <AppHeader title="Contratos Cancelados" showBack />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : error ? (
        <Card>
          <Text style={styles.empty}>{error}</Text>
        </Card>
      ) : contracts.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="checkmark-done-circle-outline" size={30} color={colors.textMuted} />
          <Text style={styles.empty}>Nenhum contrato cancelado até agora.</Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {contracts.map((contract) => (
            <Card key={contract.id} style={styles.card}>
              <View style={styles.topRow}>
                <Text style={styles.studentName}>{contract.studentName}</Text>
                <Text style={styles.fee}>{formatCurrency(contract.monthlyFee)}/mês</Text>
              </View>

              <DetailRow icon="person-outline" text={`Responsável: ${contract.guardianName}`} />
              <DetailRow icon="school-outline" text={contract.school} />
              <DetailRow
                icon="create-outline"
                text={
                  contract.signedAt
                    ? `Assinado em ${formatDate(contract.signedAt)}`
                    : 'Cancelado antes de ser assinado'
                }
              />
              <DetailRow
                icon="close-circle-outline"
                text={`Cancelado em ${formatDate(contract.cancelledAt)}`}
              />
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

function DetailRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const { colors, styles } = useThemedScreen(createStyles);
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={14} color={colors.textSecondary} />
      <Text style={styles.detailText}>{text}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  center: { paddingTop: spacing.xxxl, alignItems: 'center' },
  list: { gap: spacing.md },
  empty: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  card: { gap: spacing.sm },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  fee: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailText: { fontSize: 13, color: colors.textSecondary },
});
