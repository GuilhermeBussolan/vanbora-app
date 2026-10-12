import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Button, Card, Chip, Screen } from '@/components';
import { FinanceTabs } from '@/components/finance/FinanceTabs';
import { ReceivableCard, ReceivableRow } from '@/components/finance/ReceivableCard';
import { useAppState } from '@/context/AppState';
import {
  FinanceSummary,
  getFinanceBreakdown,
  getFinanceSummary,
  listOverduePayments,
  listPendingPayments,
  PaymentContact,
} from '@/api/finance';
import { formatCurrency } from '@/data/mockData';
import { daysBetween } from '@/lib/dateDiff';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

type Filter = 'all' | 'pending' | 'overdue' | 'received';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'overdue', label: 'Vencidos' },
  { key: 'received', label: 'Recebidos' },
];

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

function fromContact(p: PaymentContact, kind: 'pending' | 'overdue'): { row: ReceivableRow; sortDate: string } {
  const badge =
    kind === 'overdue'
      ? { label: `${daysBetween(p.dueDate)} dia${daysBetween(p.dueDate) === 1 ? '' : 's'} em atraso`, tone: 'danger' as const }
      : (() => {
          const daysUntil = -daysBetween(p.dueDate);
          return {
            label: daysUntil === 0 ? 'Vence hoje' : `Vence em ${daysUntil} dia${daysUntil === 1 ? '' : 's'}`,
            tone: 'warning' as const,
          };
        })();
  return {
    sortDate: p.dueDate,
    row: {
      key: `${kind}-${p.paymentId}`,
      studentName: p.studentName,
      amount: p.amount,
      dateLabel: `Vencimento: ${formatDate(p.dueDate)}`,
      badge,
      guardianName: p.guardianName,
      guardianPhone: p.guardianPhone,
    },
  };
}

function fromBreakdown(b: {
  student: string;
  referenceMonth: string;
  amount: number;
  date: string | null;
}): { row: ReceivableRow; sortDate: string } {
  const date = b.date ?? '';
  return {
    sortDate: date,
    row: {
      key: `received-${b.student}-${b.referenceMonth}`,
      studentName: b.student,
      amount: b.amount,
      dateLabel: date ? `Recebido em ${formatDate(date)}` : 'Recebido',
      badge: { label: 'Recebido', tone: 'success' },
    },
  };
}

/** Recebimentos: resumo de mensalidades + lista filtrável (Todos/Pendentes/Vencidos/Recebidos). */
export default function FinanceReceivablesScreen() {
  const { colors, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const params = useLocalSearchParams<{ filter?: Filter }>();
  const [filter, setFilter] = useState<Filter>(params.filter ?? 'all');
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [rows, setRows] = useState<ReceivableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    const wantsPending = filter === 'all' || filter === 'pending';
    const wantsOverdue = filter === 'all' || filter === 'overdue';
    const wantsReceived = filter === 'all' || filter === 'received';
    Promise.all([
      getFinanceSummary(token),
      wantsPending ? listPendingPayments(token) : Promise.resolve<PaymentContact[]>([]),
      wantsOverdue ? listOverduePayments(token) : Promise.resolve<PaymentContact[]>([]),
      wantsReceived ? getFinanceBreakdown(token, 'received') : Promise.resolve([]),
    ])
      .then(([s, pending, overdue, received]) => {
        setSummary(s);
        const combined = [
          ...pending.map((p) => fromContact(p, 'pending')),
          ...overdue.map((p) => fromContact(p, 'overdue')),
          ...received.map(fromBreakdown),
        ].sort((a, b) => b.sortDate.localeCompare(a.sortDate));
        setRows(combined.map((c) => c.row));
      })
      .catch((err) => setError(err?.message ?? 'Falha ao carregar os recebimentos.'))
      .finally(() => setLoading(false));
  }, [token, filter]);

  useFocusEffect(load);

  const emptyText =
    filter === 'pending'
      ? 'Nenhum pagamento pendente no momento.'
      : filter === 'overdue'
        ? 'Nenhum pagamento vencido no momento.'
        : filter === 'received'
          ? 'Nenhum recebimento no período.'
          : 'Nada por aqui ainda.';

  return (
    <Screen>
      <Text style={styles.title}>Financeiro</Text>
      <FinanceTabs active="receivables" />

      {summary ? (
        <Card style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <SummaryStat label="Previsto" value={summary.recurringMonthlyRevenue} color={colors.textMuted} />
            <SummaryStat label="Recebido" value={summary.received} color={colors.success} />
            <SummaryStat label="Pendente" value={summary.pending} color={colors.warning} />
            <SummaryStat label="Vencido" value={summary.overdue} color={colors.danger} />
          </View>
        </Card>
      ) : null}

      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : error ? (
        <Card>
          <Text style={styles.empty}>{error}</Text>
        </Card>
      ) : rows.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.empty}>{emptyText}</Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {rows.map((row) => (
            <ReceivableCard key={row.key} row={row} />
          ))}
        </View>
      )}

      <Button
        label="Adicionar receita retroativa"
        variant="outline"
        icon="add"
        onPress={() => router.push('/add-revenue')}
        style={styles.addRevenueBtn}
      />
    </Screen>
  );
}

function SummaryStat({ label, value, color }: { label: string; value: number; color: string }) {
  const { styles } = useThemedScreen(createStyles);
  return (
    <View style={styles.statBlock}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{formatCurrency(value)}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  title: { ...typography.screenTitle, marginBottom: spacing.md },
  center: { paddingTop: spacing.xxxl, alignItems: 'center' },
  summaryCard: { marginBottom: spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statBlock: { flex: 1, alignItems: 'center', gap: 4 },
  statLabel: { fontSize: 11, color: colors.textSecondary },
  statValue: { fontSize: 13, fontWeight: '800' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  list: { gap: spacing.md },
  empty: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  emptyCard: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  addRevenueBtn: { marginTop: spacing.lg },
});
