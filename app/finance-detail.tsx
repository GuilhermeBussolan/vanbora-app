import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppHeader, Card, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import {
  BreakdownType,
  getFinanceBreakdown,
  listExpenses,
} from '@/api/finance';
import { formatCurrency } from '@/data/mockData';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

interface Item {
  title: string;
  subtitle: string;
  amount: number;
}

/** "2026-06" → "Junho 2026". */
function formatRefMonth(ym: string): string {
  if (!ym) return '';
  const [year, month] = ym.split('-');
  const names = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
  ];
  const idx = Number(month) - 1;
  return idx >= 0 && idx < 12 ? `${names[idx]}/${year}` : ym;
}

/** "2026-06-10" → "10/06". */
function formatDate(iso: string | null): string {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return d && m ? `${d}/${m}` : iso;
}

/** [Transportador] Detalhamento de um tile financeiro (pendente/vencido/recebido/despesas). */
export default function FinanceDetailScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const { type, label } = useLocalSearchParams<{ type: string; label?: string }>();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !type) return;
    const request =
      type === 'expenses'
        ? listExpenses(token).then((list) =>
            list.map((e) => ({
              title: e.category,
              subtitle: `${formatDate(e.date)}${e.description ? ` · ${e.description}` : ''}`,
              amount: e.amount,
            })),
          )
        : getFinanceBreakdown(token, type as BreakdownType).then((list) =>
            list.map((b) => ({
              title: b.student,
              subtitle: `${formatRefMonth(b.referenceMonth)}${b.date ? ` · ${formatDate(b.date)}` : ''}`,
              amount: b.amount,
            })),
          );
    request
      .then(setItems)
      .catch((e) => setError(e?.message ?? 'Falha ao carregar.'))
      .finally(() => setLoading(false));
  }, [token, type]);

  const total = items.reduce((sum, i) => sum + i.amount, 0);

  return (
    <Screen>
      <AppHeader title={label ?? 'Detalhes'} showBack />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : items.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyText}>Nenhum lançamento nesta categoria.</Text>
        </Card>
      ) : (
        <>
          <Card highlighted style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
          </Card>
          <Card padded={false} style={styles.list}>
            {items.map((item, index) => (
              <View
                key={`${item.title}-${index}`}
                style={[styles.row, index < items.length - 1 && styles.divider]}
              >
                <View style={styles.flex}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowSub}>{item.subtitle}</Text>
                </View>
                <Text style={styles.rowAmount}>{formatCurrency(item.amount)}</Text>
              </View>
            ))}
          </Card>
        </>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    center: { paddingTop: spacing.xxxl, alignItems: 'center' },
    error: { fontSize: 13, color: colors.danger, marginTop: spacing.lg },
    emptyCard: { alignItems: 'center', paddingVertical: spacing.xxl },
    emptyText: { fontSize: 14, color: colors.textSecondary },
    totalCard: { marginBottom: spacing.md },
    totalLabel: { fontSize: 13, fontWeight: '600', color: colors.textOnBrand },
    totalValue: { fontSize: 26, fontWeight: '800', color: colors.textOnBrand, marginTop: 4 },
    list: {},
    row: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    flex: { flex: 1 },
    rowTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    rowAmount: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  });
