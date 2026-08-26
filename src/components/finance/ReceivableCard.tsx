import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Card } from '@/components';
import { formatCurrency } from '@/data/mockData';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Linha unificada de "Recebimentos" — normaliza PaymentContact (pendente/vencido) e FinanceBreakdownItem (recebido). */
export interface ReceivableRow {
  key: string;
  studentName: string;
  amount: number;
  /** Ex.: "Vencimento: 10/07" ou "Recebido em 10/07". */
  dateLabel: string;
  badge: { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' };
  guardianName?: string;
  /** Só presente em pendente/vencido — recebido não tem contato associado nesse dado. */
  guardianPhone?: string;
}

/** Card de uma linha de recebimento — mesma UI/ação (ligar) que a antiga PaymentContactListScreen. */
export function ReceivableCard({ row }: { row: ReceivableRow }) {
  const { colors, styles } = useThemedScreen(createStyles);
  return (
    <Card style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.studentName}>{row.studentName}</Text>
        <Text style={styles.amount}>{formatCurrency(row.amount)}</Text>
      </View>

      {row.guardianName ? (
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.detailText}>{row.guardianName}</Text>
        </View>
      ) : null}

      <View style={styles.bottomRow}>
        <Badge label={row.badge.label} tone={row.badge.tone} />
        <Text style={styles.dueDate}>{row.dateLabel}</Text>
      </View>

      {row.guardianPhone ? (
        <Pressable style={styles.callBtn} onPress={() => Linking.openURL(`tel:${row.guardianPhone}`)}>
          <Ionicons name="call-outline" size={14} color={colors.brandDark} />
          <Text style={styles.callText}>{row.guardianPhone}</Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  card: { gap: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  studentName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  amount: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailText: { fontSize: 13, color: colors.textSecondary },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
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
