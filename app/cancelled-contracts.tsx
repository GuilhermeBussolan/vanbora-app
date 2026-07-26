import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Card, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { listContracts } from '@/api/contracts';
import { formatCurrency } from '@/data/mockData';
import { ContractDto } from '@/types';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

const PLAN_LABEL: Record<string, string> = {
  MONTHLY: 'Mensal',
  ANNUAL: 'Anual',
  INSTALLMENT: 'Parcelado',
};

/** [Responsável] Histórico de contratos cancelados (rescisões). */
export default function CancelledContractsScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [contracts, setContracts] = useState<ContractDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (token) {
        setLoading(true);
        listContracts(token, 'CANCELLED')
          .then((list) => active && setContracts(list))
          .catch((e) => active && setError(e?.message ?? 'Falha ao carregar.'))
          .finally(() => active && setLoading(false));
      }
      return () => {
        active = false;
      };
    }, [token]),
  );

  return (
    <Screen>
      <AppHeader title="Contratos cancelados" showBack />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : contracts.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="document-outline" size={30} color={colors.textMuted} />
          <Text style={styles.emptyText}>Você não tem contratos cancelados.</Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {contracts.map((c) => (
            <Card key={c.id}>
              <View style={styles.rowTop}>
                <Text style={styles.transporter}>{c.transporterName}</Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{PLAN_LABEL[c.planType] ?? c.planType}</Text>
                </View>
              </View>
              <Text style={styles.student}>Aluno(a): {c.studentName}</Text>
              {c.cancellationFine != null && c.cancellationFine > 0 ? (
                <Text style={styles.fine}>Multa paga: {formatCurrency(c.cancellationFine)}</Text>
              ) : null}
              {c.refundAmount != null && c.refundAmount > 0 ? (
                <Text style={styles.refund}>Reembolso: {formatCurrency(c.refundAmount)}</Text>
              ) : null}
              {(c.cancellationFine == null || c.cancellationFine === 0) &&
              (c.refundAmount == null || c.refundAmount === 0) ? (
                <Text style={styles.neutral}>Sem multa ou reembolso.</Text>
              ) : null}
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    center: { paddingTop: spacing.xxxl, alignItems: 'center' },
    error: { fontSize: 13, color: colors.danger, marginTop: spacing.lg },
    emptyCard: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
    emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
    list: { gap: spacing.md },
    rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    transporter: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: colors.surface,
    },
    badgeText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
    student: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
    fine: { fontSize: 13, color: colors.danger, fontWeight: '600', marginTop: spacing.sm },
    refund: { fontSize: 13, color: colors.success, fontWeight: '600', marginTop: spacing.sm },
    neutral: { fontSize: 13, color: colors.textMuted, marginTop: spacing.sm },
  });
