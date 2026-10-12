import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Screen } from '@/components';
import { FinanceTabs } from '@/components/finance/FinanceTabs';
import { useAppState } from '@/context/AppState';
import { deleteExpense, ExpenseDto, FinanceSummary, getFinanceSummary, listExpenses } from '@/api/finance';
import { formatCurrency } from '@/data/mockData';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

/** Despesas: total do mês, categorias e lista completa de gastos. */
export default function FinanceExpensesScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    Promise.all([getFinanceSummary(token), listExpenses(token)])
      .then(([s, exp]) => {
        setSummary(s);
        setExpenses(exp);
      })
      .catch((err) => setError(err?.message ?? 'Falha ao carregar as despesas.'))
      .finally(() => setLoading(false));
  }, [token]);

  useFocusEffect(load);

  function confirmDelete(item: ExpenseDto) {
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

  if (loading) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      </Screen>
    );
  }

  const maxCategory = summary ? Math.max(1, ...summary.expensesByCategory.map((c) => c.total)) : 1;

  return (
    <Screen>
      <Text style={styles.title}>Financeiro</Text>
      <FinanceTabs active="expenses" />

      {error || !summary ? (
        <Card style={styles.errorCard}>
          <Text style={styles.empty}>{error ?? 'Sem dados.'}</Text>
        </Card>
      ) : (
        <>
          <Card style={styles.block}>
            <Text style={styles.totalLabel}>Gastos este mês</Text>
            <Text style={styles.totalValue}>{formatCurrency(summary.expenses)}</Text>
          </Card>

          {summary.expensesByCategory.length > 0 ? (
            <Card style={styles.block}>
              {summary.expensesByCategory.map((c, i) => (
                <View key={c.category} style={[styles.categoryRow, i === 0 && styles.categoryRowFirst]}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryName}>{c.category}</Text>
                    <Text style={styles.categoryValue}>{formatCurrency(c.total)}</Text>
                  </View>
                  <View style={styles.categoryTrack}>
                    <View style={[styles.categoryFill, { width: `${(c.total / maxCategory) * 100}%` }]} />
                  </View>
                </View>
              ))}
            </Card>
          ) : null}

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
                <Pressable onPress={() => confirmDelete(e)} hitSlop={8} style={styles.deleteBtn}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </Card>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhum gasto registrado.</Text>
          )}
        </>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxxl },
  title: { ...typography.screenTitle, marginBottom: spacing.md },
  errorCard: { alignItems: 'center', paddingVertical: spacing.xl },
  empty: { fontSize: 13, color: colors.textSecondary },
  block: { marginTop: spacing.md },
  blockTitle: { marginTop: spacing.xl },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 13, color: colors.textSecondary },
  totalValue: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  categoryRow: { marginTop: spacing.md },
  categoryRowFirst: { marginTop: 0 },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  categoryName: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  categoryValue: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  categoryTrack: { height: 8, backgroundColor: colors.border, borderRadius: radius.sm, overflow: 'hidden' },
  categoryFill: { height: '100%', backgroundColor: colors.brand, borderRadius: radius.sm },
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
