import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Screen } from '@/components';
import { FinanceTabs } from '@/components/finance/FinanceTabs';
import { useAppState } from '@/context/AppState';
import { FinanceSummary, getFinanceSummary, getSuggestions, SuggestionDto } from '@/api/finance';
import { formatCurrency } from '@/data/mockData';
import { defaultFinancePrefs, FinancePrefs, loadFinancePrefs, saveFinancePrefs } from '@/lib/financePrefs';
import { inferSuggestionRoute, pctChange, pickTopSuggestions, previousBalance } from '@/lib/financeCalc';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Altura fixa (px) da "trilha" das barras do gráfico. */
const BAR_TRACK_HEIGHT = 90;

/** Visão geral do Financeiro: "quanto entrou, quanto gastei, quanto sobrou". */
export default function FinanceOverviewScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [financePrefs, setFinancePrefs] = useState<FinancePrefs>(defaultFinancePrefs);

  useFocusEffect(
    useCallback(() => {
      loadFinancePrefs().then(setFinancePrefs);
    }, []),
  );

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    Promise.all([getFinanceSummary(token), getSuggestions(token)])
      .then(([s, sug]) => {
        setSummary(s);
        setSuggestions(sug);
      })
      .catch((err) => setError(err?.message ?? 'Falha ao carregar o painel financeiro.'))
      .finally(() => setLoading(false));
  }, [token]);

  useFocusEffect(load);

  function hideSuggestions() {
    const next = { ...financePrefs, showSuggestions: false };
    setFinancePrefs(next);
    saveFinancePrefs(next);
  }

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      </Screen>
    );
  }

  if (error || !summary) {
    return (
      <Screen>
        <Text style={[typography.screenTitle, styles.title]}>Financeiro</Text>
        <FinanceTabs active="overview" />
        <Card style={styles.errorCard}>
          <Ionicons name="cloud-offline-outline" size={28} color={colors.danger} />
          <Text style={styles.errorText}>{error ?? 'Sem dados.'}</Text>
          <Pressable onPress={load} style={styles.retry}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </Pressable>
        </Card>
      </Screen>
    );
  }

  const { goal, comparison } = summary;
  const prevBalance = previousBalance(comparison.previousReceived, comparison.previousExpenses);
  const balanceChangePct = pctChange(prevBalance, summary.balance);
  const maxTrend = Math.max(1, ...summary.monthlyTrend.flatMap((m) => [m.received, m.expenses]));
  const topSuggestions = financePrefs.showSuggestions ? pickTopSuggestions(suggestions, 2) : [];

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[typography.screenTitle, styles.title]}>Financeiro</Text>
        <Pressable onPress={() => router.push('/finance-settings')} hitSlop={8}>
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>
      <FinanceTabs active="overview" />

      {/* Saldo do mês */}
      <Card highlighted style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo do mês</Text>
        <Text style={styles.balanceValue}>{formatCurrency(summary.balance)}</Text>
        {prevBalance !== 0 ? (
          <Text style={styles.balanceHint}>{comparisonText(balanceChangePct)}</Text>
        ) : null}
      </Card>

      {/* Receitas / Despesas / Resultado */}
      <Card style={styles.block}>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Receitas recebidas</Text>
          <Text style={styles.breakdownValue}>{formatCurrency(summary.received)}</Text>
        </View>
        <Pressable
          style={[styles.breakdownRow, styles.breakdownRowPressable]}
          onPress={() => router.push('/(transporter)/finance/expenses')}
        >
          <View style={styles.breakdownLabelRow}>
            <Text style={styles.breakdownLabel}>Despesas</Text>
            <Ionicons name="chevron-forward" size={13} color={colors.textMuted} />
          </View>
          <Text style={styles.breakdownValue}>{formatCurrency(summary.expenses)}</Text>
        </Pressable>
        <View style={[styles.breakdownRow, styles.breakdownRowLast]}>
          <Text style={styles.resultLabel}>Resultado</Text>
          <Text style={styles.resultValue}>{formatCurrency(summary.balance)}</Text>
        </View>
      </Card>

      {/* Receita x Despesas — últimos 6 meses */}
      <Text style={[typography.sectionTitle, styles.blockTitle]}>Receita x Despesas</Text>
      <Card style={styles.block}>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.brand }]} />
            <Text style={styles.legendText}>Receita</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
            <Text style={styles.legendText}>Despesas</Text>
          </View>
        </View>
        <View style={styles.chart}>
          {summary.monthlyTrend.map((m) => (
            <View key={m.label} style={styles.barColumn}>
              <View style={styles.barTrack}>
                <View style={styles.barPair}>
                  <View
                    style={[
                      styles.bar,
                      styles.barReceived,
                      { height: Math.max(4, (m.received / maxTrend) * BAR_TRACK_HEIGHT) },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      styles.barExpenses,
                      { height: Math.max(4, (m.expenses / maxTrend) * BAR_TRACK_HEIGHT) },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.barLabel}>{m.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Mensalidades */}
      <Text style={[typography.sectionTitle, styles.blockTitle]}>Mensalidades</Text>
      <Card style={styles.block}>
        <MensalidadeRow label="Previsto" value={summary.recurringMonthlyRevenue} dotColor={colors.textMuted} />
        <MensalidadeRow label="Recebido" value={summary.received} dotColor={colors.success} />
        <MensalidadeRow label="Pendente" value={summary.pending} dotColor={colors.warning} />
        <MensalidadeRow label="Vencido" value={summary.overdue} dotColor={colors.danger} last />
        <Pressable
          style={styles.linkRow}
          onPress={() => router.push('/(transporter)/finance/receivables')}
        >
          <Text style={styles.linkText}>Ver recebimentos</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.brandDark} />
        </Pressable>
      </Card>

      {/* Meta */}
      {goal.monthlyGoal == null ? (
        <Pressable style={styles.goalCallout} onPress={() => router.push('/finance-settings')}>
          <Ionicons name="flag-outline" size={16} color={colors.brandDark} />
          <Text style={styles.goalCalloutText}>Defina uma meta mensal</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
        </Pressable>
      ) : (
        <Card style={styles.block}>
          <View style={styles.rowBetween}>
            <Text style={styles.goalTitle}>Meta do mês</Text>
            <Text style={styles.goalPct}>{Math.round(goal.progress * 100)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, goal.progress * 100)}%` }]} />
          </View>
          <Text style={styles.goalText}>
            {formatCurrency(goal.monthRevenue)} / {formatCurrency(goal.monthlyGoal)}
          </Text>
        </Card>
      )}

      {/* Sugestões — só as mais relevantes, some se vazio */}
      {topSuggestions.length > 0 ? (
        <>
          <View style={[styles.rowBetween, styles.blockTitle]}>
            <Text style={typography.sectionTitle}>Sugestões</Text>
            <Pressable onPress={hideSuggestions} hitSlop={8}>
              <Text style={styles.linkTextSmall}>Ocultar</Text>
            </Pressable>
          </View>
          {topSuggestions.map((s, i) => {
            const route = inferSuggestionRoute(s);
            return (
              <Card key={`${s.title}-${i}`} style={styles.suggestionCard}>
                <Ionicons name="bulb-outline" size={20} color={colors.brandDark} style={styles.suggestionIcon} />
                <View style={styles.flex1}>
                  <Text style={styles.suggestionTitle}>{s.title}</Text>
                  <Text style={styles.suggestionDetail}>{s.detail}</Text>
                  {route ? (
                    <Pressable
                      style={styles.suggestionLink}
                      onPress={() => router.push({ pathname: route.pathname as any, params: route.params })}
                    >
                      <Text style={styles.linkTextSmall}>{route.label}</Text>
                      <Ionicons name="arrow-forward" size={12} color={colors.brandDark} />
                    </Pressable>
                  ) : null}
                </View>
              </Card>
            );
          })}
        </>
      ) : null}
    </Screen>
  );
}

function MensalidadeRow({
  label,
  value,
  dotColor,
  last,
}: {
  label: string;
  value: number;
  dotColor: string;
  last?: boolean;
}) {
  const { styles } = useThemedScreen(createStyles);
  return (
    <View style={[styles.mensalidadeRow, last && styles.mensalidadeRowLast]}>
      <View style={styles.mensalidadeLabelRow}>
        <View style={[styles.mensalidadeDot, { backgroundColor: dotColor }]} />
        <Text style={styles.mensalidadeLabel}>{label}</Text>
      </View>
      <Text style={styles.mensalidadeValue}>{formatCurrency(value)}</Text>
    </View>
  );
}

/** Texto do comparativo com o mês anterior (ex.: "+12% vs mês passado"). */
function comparisonText(pct: number | null): string {
  if (pct == null) return 'Sem dados do período anterior para comparar.';
  const sign = pct >= 0 ? '↑ ' : '↓ ';
  return `${sign}${Math.abs(pct).toFixed(0)}% em relação ao mês anterior`;
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { marginBottom: spacing.md },
  errorCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl, marginTop: spacing.md },
  errorText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  retry: { marginTop: spacing.sm },
  retryText: { fontSize: 14, fontWeight: '700', color: colors.brandDark },
  balanceCard: { backgroundColor: colors.brand, borderColor: colors.brand, alignItems: 'center', paddingVertical: spacing.lg },
  balanceLabel: { fontSize: 13, fontWeight: '600', color: colors.textOnBrand },
  balanceValue: { fontSize: 34, fontWeight: '800', color: colors.textOnBrand, marginTop: 6 },
  balanceHint: { fontSize: 13, color: colors.textOnBrand, opacity: 0.85, marginTop: spacing.sm, fontWeight: '600' },
  block: { marginTop: spacing.md },
  blockTitle: { marginTop: spacing.xl, marginBottom: 0 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  breakdownRowPressable: { borderTopWidth: 1, borderTopColor: colors.border, borderBottomWidth: 1, borderBottomColor: colors.border },
  breakdownRowLast: { paddingTop: spacing.md },
  breakdownLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  breakdownLabel: { fontSize: 13, color: colors.textSecondary },
  breakdownValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  resultLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  resultValue: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  legend: { flexDirection: 'row', gap: spacing.lg, marginBottom: spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  barColumn: { flex: 1, alignItems: 'center', gap: spacing.xs },
  barTrack: { height: BAR_TRACK_HEIGHT, width: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  barPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 9, borderRadius: 3 },
  barReceived: { backgroundColor: colors.brand },
  barExpenses: { backgroundColor: colors.danger },
  barLabel: { fontSize: 10, color: colors.textSecondary, fontWeight: '600' },
  mensalidadeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  mensalidadeRowLast: { marginBottom: spacing.sm },
  mensalidadeLabelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  mensalidadeDot: { width: 8, height: 8, borderRadius: 4 },
  mensalidadeLabel: { fontSize: 13, color: colors.textSecondary },
  mensalidadeValue: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  linkText: { fontSize: 13, fontWeight: '700', color: colors.brandDark },
  linkTextSmall: { fontSize: 12, fontWeight: '700', color: colors.brandDark },
  goalCallout: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  goalCalloutText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  goalTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  goalPct: { fontSize: 14, fontWeight: '800', color: colors.brandDark },
  progressTrack: { height: 8, backgroundColor: colors.border, borderRadius: radius.sm, marginTop: spacing.sm, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.brand, borderRadius: radius.sm },
  goalText: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  suggestionCard: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.sm },
  suggestionIcon: { marginRight: spacing.sm, marginTop: 2 },
  suggestionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  suggestionDetail: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
  suggestionLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.xs },
  flex1: { flex: 1 },
});
