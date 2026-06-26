import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AppHeader, Badge, Button, Card, Screen, SectionTitle } from '@/components';
import { useAppState } from '@/context/AppState';
import { getPaymentSchedule, PaymentScheduleItem } from '@/api/guardian';
import { formatCurrency } from '@/data/mockData';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

const STATUS: Record<string, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  PAID: { label: 'PAGO', tone: 'success' },
  PENDING: { label: 'PENDENTE', tone: 'warning' },
  OVERDUE: { label: 'ATRASADO', tone: 'danger' },
  SCHEDULED: { label: 'PREVISTO', tone: 'neutral' },
};

/** Cronograma de pagamentos: próxima em destaque + futuras + histórico (dados reais). */
export default function PaymentsScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token, selectedDependentId } = useAppState();
  const [items, setItems] = useState<PaymentScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (token) {
        setLoading(true);
        getPaymentSchedule(token, selectedDependentId)
          .then((list) => active && setItems(list))
          .catch((e) => active && setError(e?.message ?? 'Falha ao carregar os pagamentos.'))
          .finally(() => active && setLoading(false));
      }
      return () => {
        active = false;
      };
    }, [token, selectedDependentId]),
  );

  const open = items.filter((i) => i.status !== 'PAID');
  const paid = items.filter((i) => i.status === 'PAID').reverse();
  const highlight = open.find((i) => i.status === 'OVERDUE' || i.status === 'PENDING') ?? open[0];
  const upcoming = open.filter((i) => i !== highlight);

  function pay() {
    Alert.alert('Pagamento', 'O pagamento pelo app estará disponível em breve.');
  }

  return (
    <Screen>
      <AppHeader title="Pagamentos" showBack />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <>
          {highlight ? (
            <Card highlighted>
              <View style={styles.pendingHeader}>
                <Text style={styles.pendingTitle}>
                  {formatRefMonth(highlight.referenceMonth)} — {STATUS[highlight.status]?.label}
                </Text>
                <Badge
                  label={STATUS[highlight.status]?.label ?? highlight.status}
                  tone={STATUS[highlight.status]?.tone ?? 'neutral'}
                />
              </View>
              <Text style={styles.pendingLabel}>Valor da mensalidade</Text>
              <Text style={styles.pendingValue}>{formatCurrency(highlight.amount)}</Text>
              {highlight.dueDate ? (
                <Text style={styles.pendingDue}>Vence em {formatDate(highlight.dueDate)}</Text>
              ) : null}
              {highlight.status === 'PENDING' || highlight.status === 'OVERDUE' ? (
                <Button label="Pagar agora" style={styles.payBtn} onPress={pay} />
              ) : (
                <Text style={styles.scheduledNote}>
                  Mensalidade futura — ainda não disponível para pagamento.
                </Text>
              )}
            </Card>
          ) : null}

          {upcoming.length > 0 ? (
            <>
              <SectionTitle title="Próximas" style={styles.sectionTitle} />
              <Card padded={false}>
                {upcoming.map((item, index) => (
                  <Row
                    key={item.referenceMonth}
                    item={item}
                    last={index === upcoming.length - 1}
                    styles={styles}
                  />
                ))}
              </Card>
            </>
          ) : null}

          <SectionTitle title="Histórico" style={styles.sectionTitle} />
          <Card padded={false}>
            {paid.length === 0 ? (
              <View style={styles.emptyRow}>
                <Text style={styles.empty}>Nenhum pagamento ainda.</Text>
              </View>
            ) : (
              paid.map((item, index) => (
                <Row
                  key={item.referenceMonth}
                  item={item}
                  last={index === paid.length - 1}
                  styles={styles}
                />
              ))
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}

function Row({
  item,
  last,
  styles,
}: {
  item: PaymentScheduleItem;
  last: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  const badge = STATUS[item.status] ?? { label: item.status, tone: 'neutral' as const };
  return (
    <View style={[styles.historyRow, !last && styles.divider]}>
      <View>
        <Text style={styles.historyMonth}>{formatRefMonth(item.referenceMonth)}</Text>
        <Text style={styles.historyAmount}>
          {formatCurrency(item.amount)}
          {item.dueDate ? ` • vence ${formatDate(item.dueDate)}` : ''}
        </Text>
      </View>
      <Badge label={badge.label} tone={badge.tone} />
    </View>
  );
}

/** "2026-06" → "Junho 2026". */
function formatRefMonth(ym: string): string {
  const [year, month] = ym.split('-');
  const names = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  const idx = Number(month) - 1;
  return idx >= 0 && idx < 12 ? `${names[idx]} ${year}` : ym;
}

/** "2026-06-10" → "10/06". */
function formatDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return d && m ? `${d}/${m}` : iso;
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    center: { paddingTop: spacing.xxxl, alignItems: 'center' },
    error: { fontSize: 13, color: colors.danger, marginTop: spacing.lg },
    pendingHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    pendingTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.textPrimary,
      flex: 1,
    },
    pendingLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: spacing.md,
    },
    pendingValue: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.textPrimary,
      marginTop: 2,
    },
    pendingDue: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    payBtn: {
      marginTop: spacing.lg,
    },
    scheduledNote: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: spacing.md,
    },
    sectionTitle: {
      marginTop: spacing.xl,
      marginBottom: spacing.md,
    },
    historyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
    },
    divider: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    historyMonth: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    historyAmount: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    emptyRow: { padding: spacing.lg },
    empty: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  });
