import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Badge, Card, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { PaymentContact } from '@/api/finance';
import { formatCurrency } from '@/data/mockData';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

export interface PaymentContactBadge {
  label: string;
  tone: 'success' | 'warning' | 'danger' | 'neutral';
}

interface Props {
  title: string;
  emptyIcon: keyof typeof Ionicons.glyphMap;
  emptyText: string;
  fetcher: (token: string) => Promise<PaymentContact[]>;
  /** Selo por item (ex.: "3 dias em atraso" / "vence em 5 dias"), calculado a partir do dueDate. */
  badgeFor: (dueDate: string) => PaymentContactBadge;
}

/** Lista de pagamentos (vencidos ou pendentes) com dados do responsável, com atalho de ligação. */
export function PaymentContactListScreen({ title, emptyIcon, emptyText, fetcher, badgeFor }: Props) {
  const { colors, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [payments, setPayments] = useState<PaymentContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    fetcher(token)
      .then(setPayments)
      .catch((err) => setError(err?.message ?? 'Falha ao carregar os pagamentos.'))
      .finally(() => setLoading(false));
  }, [token, fetcher]);

  useFocusEffect(load);

  return (
    <Screen>
      <AppHeader title={title} showBack />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : error ? (
        <Card>
          <Text style={styles.empty}>{error}</Text>
        </Card>
      ) : payments.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Ionicons name={emptyIcon} size={30} color={colors.textMuted} />
          <Text style={styles.empty}>{emptyText}</Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {payments.map((p) => {
            const badge = badgeFor(p.dueDate);
            return (
              <Card key={p.paymentId} style={styles.card}>
                <View style={styles.topRow}>
                  <Text style={styles.studentName}>{p.studentName}</Text>
                  <Text style={styles.amount}>{formatCurrency(p.amount)}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.detailText}>{p.guardianName}</Text>
                </View>

                <View style={styles.bottomRow}>
                  <Badge label={badge.label} tone={badge.tone} />
                  <Text style={styles.dueDate}>Vencimento: {formatDate(p.dueDate)}</Text>
                </View>

                {p.guardianPhone ? (
                  <Pressable
                    style={styles.callBtn}
                    onPress={() => Linking.openURL(`tel:${p.guardianPhone}`)}
                  >
                    <Ionicons name="call-outline" size={14} color={colors.brandDark} />
                    <Text style={styles.callText}>{p.guardianPhone}</Text>
                  </Pressable>
                ) : null}
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
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
  },
  studentName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  amount: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailText: { fontSize: 13, color: colors.textSecondary },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  dueDate: { fontSize: 12, color: colors.textMuted },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  callText: { fontSize: 13, fontWeight: '700', color: colors.brandDark },
});
