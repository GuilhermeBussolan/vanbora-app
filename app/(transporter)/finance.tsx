import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import {
  deleteExpense,
  deleteFuel,
  ExpenseDto,
  FinanceSummary,
  FuelEntryDto,
  getFinanceSummary,
  getSuggestions,
  listExpenses,
  listFuel,
  markMaintenanceDone,
  SuggestionDto,
} from '@/api/finance';
import { formatCurrency } from '@/data/mockData';
import { colors, radius, spacing, typography } from '@/theme';

/** Painel financeiro do transportador: receitas, despesas, km, consumo, metas e sugestões. */
export default function FinanceScreen() {
  const { token } = useAppState();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionDto[]>([]);
  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [fuel, setFuel] = useState<FuelEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    Promise.all([
      getFinanceSummary(token),
      getSuggestions(token),
      listExpenses(token),
      listFuel(token),
    ])
      .then(([s, sug, exp, fu]) => {
        setSummary(s);
        setSuggestions(sug);
        setExpenses(exp);
        setFuel(fu);
      })
      .catch((err) => setError(err?.message ?? 'Falha ao carregar o painel financeiro.'))
      .finally(() => setLoading(false));
  }, [token]);

  useFocusEffect(load);

  function confirmDeleteExpense(item: ExpenseDto) {
    Alert.alert('Excluir gasto', `Remover "${item.category}" (${formatCurrency(item.amount)})?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          try {
            await deleteExpense(token, item.id);
            load();
          } catch (err: any) {
            Alert.alert('Erro', err?.message ?? 'Falha ao excluir.');
          }
        },
      },
    ]);
  }

  function confirmDeleteFuel(item: FuelEntryDto) {
    Alert.alert('Excluir abastecimento', `Remover ${item.liters} L (${formatCurrency(item.amount)})?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          try {
            await deleteFuel(token, item.id);
            load();
          } catch (err: any) {
            Alert.alert('Erro', err?.message ?? 'Falha ao excluir.');
          }
        },
      },
    ]);
  }

  async function handleMaintenanceDone() {
    if (!token) return;
    try {
      await markMaintenanceDone(token);
      load();
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Falha ao registrar a revisão.');
    }
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

  const { goal, maintenance, consumption } = summary;
  const maxRevenue = Math.max(1, ...summary.monthlyRevenue.map((m) => m.value));

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[typography.screenTitle, styles.title]}>Financeiro</Text>
        <Pressable onPress={() => router.push('/finance-settings')} hitSlop={8}>
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Recebido no mês */}
      <Card highlighted style={styles.receivedCard}>
        <Text style={styles.receivedLabel}>Recebido este mês</Text>
        <Text style={styles.receivedValue}>{formatCurrency(summary.received)}</Text>
        <Text style={styles.balanceHint}>
          Saldo (recebido − despesas): {formatCurrency(summary.balance)}
        </Text>
      </Card>

      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Pendente</Text>
          <Text style={[styles.summaryValue, { color: colors.warning }]}>
            {formatCurrency(summary.pending)}
          </Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Vencido</Text>
          <Text style={[styles.summaryValue, { color: colors.danger }]}>
            {formatCurrency(summary.overdue)}
          </Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Despesas</Text>
          <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
            {formatCurrency(summary.expenses)}
          </Text>
        </Card>
      </View>

      {/* Meta mensal */}
      {goal.monthlyGoal != null ? (
        <Card style={styles.block}>
          <View style={styles.rowBetween}>
            <Text style={typography.sectionTitle}>Meta do mês</Text>
            <Text style={styles.goalPct}>{Math.round(goal.progress * 100)}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, goal.progress * 100)}%` }]} />
          </View>
          <Text style={styles.goalText}>
            {formatCurrency(goal.monthRevenue)} de {formatCurrency(goal.monthlyGoal)}
          </Text>
        </Card>
      ) : null}

      {/* Quilometragem */}
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Km hoje</Text>
          <Text style={styles.kmValue}>{formatKm(summary.kmToday)}</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Km no mês</Text>
          <Text style={styles.kmValue}>{formatKm(summary.kmPeriod)}</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Km total</Text>
          <Text style={styles.kmValue}>{formatKm(summary.kmTotal)}</Text>
        </Card>
      </View>

      {/* Gráfico de receita */}
      <Text style={[typography.sectionTitle, styles.blockTitle]}>Receita por mês</Text>
      <Card style={styles.block}>
        {summary.monthlyRevenue.length > 0 ? (
          <View style={styles.chart}>
            {summary.monthlyRevenue.map((m, i) => {
              const isLast = i === summary.monthlyRevenue.length - 1;
              return (
                <View key={m.label} style={styles.barColumn}>
                  <Text style={styles.barValue}>{compactCurrency(m.value)}</Text>
                  <View
                    style={[
                      styles.bar,
                      { height: `${(m.value / maxRevenue) * 100}%` },
                      isLast ? styles.barActive : styles.barInactive,
                    ]}
                  />
                  <Text style={styles.barLabel}>{m.label}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={styles.emptyText}>Ainda não há receita registrada.</Text>
        )}
      </Card>

      {/* Consumo de combustível */}
      <Text style={[typography.sectionTitle, styles.blockTitle]}>Consumo de Combustível</Text>
      <Card style={styles.block}>
        <View style={styles.consumptionRow}>
          <Metric label="Litros (mês)" value={`${formatKm(consumption.liters)} L`} />
          <Metric
            label="Média"
            value={consumption.kmPerLiter != null ? `${consumption.kmPerLiter} km/L` : '—'}
          />
          <Metric
            label="Custo/km"
            value={consumption.costPerKm != null ? formatCurrency(consumption.costPerKm) : '—'}
          />
        </View>
      </Card>

      {/* Manutenção */}
      {maintenance.intervalKm != null ? (
        <Card style={styles.block}>
          <View style={styles.rowBetween}>
            <Text style={typography.sectionTitle}>Manutenção</Text>
            <Pressable onPress={handleMaintenanceDone} hitSlop={8}>
              <Text style={styles.linkText}>Revisão feita</Text>
            </Pressable>
          </View>
          <Text style={styles.maintText}>
            {maintenance.remainingKm != null && maintenance.remainingKm > 0
              ? `Faltam ${formatKm(maintenance.remainingKm)} km para a próxima revisão (a cada ${maintenance.intervalKm} km).`
              : `Revisão em atraso! Você já rodou ${formatKm(maintenance.kmSinceLast ?? 0)} km desde a última (intervalo: ${maintenance.intervalKm} km).`}
          </Text>
        </Card>
      ) : null}

      {/* Sugestões */}
      {suggestions.length > 0 ? (
        <>
          <Text style={[typography.sectionTitle, styles.blockTitle]}>Sugestões</Text>
          {suggestions.map((s, i) => (
            <Card key={`${s.title}-${i}`} style={styles.suggestionCard}>
              <Ionicons name="bulb-outline" size={20} color={colors.brandDark} style={styles.suggestionIcon} />
              <View style={styles.flex1}>
                <Text style={styles.suggestionTitle}>{s.title}</Text>
                <Text style={styles.suggestionDetail}>{s.detail}</Text>
              </View>
            </Card>
          ))}
        </>
      ) : null}

      {/* Gastos */}
      <View style={[styles.rowBetween, styles.blockTitle]}>
        <Text style={typography.sectionTitle}>Gastos</Text>
        <Pressable onPress={() => router.push('/add-expense')} style={styles.addBtn} hitSlop={8}>
          <Ionicons name="add" size={16} color={colors.textOnBrand} />
          <Text style={styles.addBtnText}>Adicionar</Text>
        </Pressable>
      </View>
      {expenses.length > 0 ? (
        expenses.map((e) => (
          <Card key={e.id} style={styles.listItem}>
            <View style={styles.flex1}>
              <Text style={styles.listTitle}>{e.category}</Text>
              <Text style={styles.listSub}>
                {formatDate(e.date)}
                {e.description ? ` · ${e.description}` : ''}
              </Text>
            </View>
            <Text style={styles.listAmount}>{formatCurrency(e.amount)}</Text>
            <Pressable onPress={() => confirmDeleteExpense(e)} hitSlop={8} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          </Card>
        ))
      ) : (
        <Text style={styles.emptyText}>Nenhum gasto registrado.</Text>
      )}

      {/* Abastecimentos */}
      <View style={[styles.rowBetween, styles.blockTitle]}>
        <Text style={typography.sectionTitle}>Abastecimentos</Text>
        <Pressable onPress={() => router.push('/add-fuel')} style={styles.addBtn} hitSlop={8}>
          <Ionicons name="add" size={16} color={colors.textOnBrand} />
          <Text style={styles.addBtnText}>Registrar</Text>
        </Pressable>
      </View>
      {fuel.length > 0 ? (
        fuel.map((f) => (
          <Card key={f.id} style={styles.listItem}>
            <View style={styles.flex1}>
              <Text style={styles.listTitle}>{f.liters} L</Text>
              <Text style={styles.listSub}>{formatDate(f.date)}</Text>
            </View>
            <Text style={styles.listAmount}>{formatCurrency(f.amount)}</Text>
            <Pressable onPress={() => confirmDeleteFuel(f)} hitSlop={8} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </Pressable>
          </Card>
        ))
      ) : (
        <Text style={styles.emptyText}>Nenhum abastecimento registrado.</Text>
      )}
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

/** "12,5" para km/litros (1 casa, sem zeros à toa). */
function formatKm(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

/** Valor compacto para o topo das barras (ex.: "R$ 1,2k"). */
function compactCurrency(value: number): string {
  if (value >= 1000) return `R$ ${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
  return `R$ ${value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

/** ISO "yyyy-MM-dd" → "dd/MM". */
function formatDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { marginBottom: spacing.lg },
  errorCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  errorText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  retry: { marginTop: spacing.sm },
  retryText: { fontSize: 14, fontWeight: '700', color: colors.brandDark },
  receivedCard: { backgroundColor: colors.brand, borderColor: colors.brand },
  receivedLabel: { fontSize: 13, fontWeight: '600', color: colors.textOnBrand },
  receivedValue: { fontSize: 30, fontWeight: '800', color: colors.textOnBrand, marginTop: 4 },
  balanceHint: { fontSize: 12, color: colors.textOnBrand, opacity: 0.8, marginTop: 6 },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  summaryCard: { flex: 1 },
  summaryLabel: { fontSize: 12, color: colors.textSecondary },
  summaryValue: { fontSize: 16, fontWeight: '800', marginTop: 4 },
  kmValue: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  block: { marginTop: spacing.md },
  blockTitle: { marginTop: spacing.xl },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  goalPct: { fontSize: 14, fontWeight: '800', color: colors.brandDark },
  progressTrack: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: radius.sm,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.brand, borderRadius: radius.sm },
  goalText: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 170 },
  barColumn: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: spacing.xs },
  bar: { width: 26, borderRadius: radius.sm, minHeight: 6 },
  barActive: { backgroundColor: colors.brand },
  barInactive: { backgroundColor: colors.border },
  barLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  barValue: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  consumptionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  maintText: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 19 },
  linkText: { fontSize: 13, fontWeight: '700', color: colors.brandDark },
  suggestionCard: { flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.sm },
  suggestionIcon: { marginRight: spacing.sm, marginTop: 2 },
  suggestionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  suggestionDetail: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.brand,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: colors.textOnBrand },
  listItem: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  listTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  listSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  listAmount: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginRight: spacing.md },
  deleteBtn: { padding: 2 },
  flex1: { flex: 1 },
  emptyText: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm },
});
