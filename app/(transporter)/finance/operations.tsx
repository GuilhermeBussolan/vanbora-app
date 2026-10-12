import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, LayoutChangeEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Screen } from '@/components';
import { FinanceTabs } from '@/components/finance/FinanceTabs';
import { useAppState } from '@/context/AppState';
import {
  deleteFuel,
  FinanceSummary,
  FuelEntryDto,
  getFinanceSummary,
  listFuel,
  markMaintenanceDone,
} from '@/api/finance';
import { formatCurrency } from '@/data/mockData';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

/** "12,5" para km/litros (1 casa, sem zeros à toa). */
function formatKm(value: number): string {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
}

type Section = 'fuel' | 'km' | 'maintenance';

/** Operação: combustível, quilometragem e manutenção. */
export default function FinanceOperationsScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const { section } = useLocalSearchParams<{ section?: Section }>();
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [fuel, setFuel] = useState<FuelEntryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const offsets = useRef<Record<Section, number>>({ fuel: 0, km: 0, maintenance: 0 });

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    Promise.all([getFinanceSummary(token), listFuel(token)])
      .then(([s, fu]) => {
        setSummary(s);
        setFuel(fu);
      })
      .catch((err) => setError(err?.message ?? 'Falha ao carregar a operação.'))
      .finally(() => setLoading(false));
  }, [token]);

  useFocusEffect(load);

  useEffect(() => {
    if (!section || loading) return;
    const id = requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({ y: Math.max(0, offsets.current[section] - spacing.lg), animated: true }),
    );
    return () => cancelAnimationFrame(id);
  }, [section, loading]);

  function onSectionLayout(key: Section) {
    return (e: LayoutChangeEvent) => {
      offsets.current[key] = e.nativeEvent.layout.y;
    };
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

  return (
    <Screen scroll={false}>
      <Text style={styles.title}>Financeiro</Text>
      <FinanceTabs active="operations" />

      {error || !summary ? (
        <Card style={styles.errorCard}>
          <Text style={styles.empty}>{error ?? 'Sem dados.'}</Text>
        </Card>
      ) : (
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Combustível */}
          <View onLayout={onSectionLayout('fuel')}>
            <Text style={[typography.sectionTitle, styles.blockTitle]}>Combustível</Text>
            <Card style={styles.block}>
              <View style={styles.consumptionRow}>
                <Metric label="Litros (mês)" value={`${formatKm(summary.consumption.liters)} L`} />
                <Metric
                  label="Média"
                  value={summary.consumption.kmPerLiter != null ? `${summary.consumption.kmPerLiter} km/L` : '—'}
                />
                <Metric
                  label="Custo/km"
                  value={summary.consumption.costPerKm != null ? formatCurrency(summary.consumption.costPerKm) : '—'}
                />
              </View>
            </Card>

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
          </View>

          {/* Quilometragem */}
          <View onLayout={onSectionLayout('km')}>
            <Text style={[typography.sectionTitle, styles.blockTitle]}>Quilometragem</Text>
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
          </View>

          {/* Manutenção */}
          <View onLayout={onSectionLayout('maintenance')}>
            <Text style={[typography.sectionTitle, styles.blockTitle]}>Manutenção</Text>
            {summary.maintenance.intervalKm != null ? (
              <Card style={styles.block}>
                <View style={styles.rowBetween}>
                  <Text style={styles.maintCaption}>
                    Intervalo: a cada {summary.maintenance.intervalKm} km
                  </Text>
                  <Pressable onPress={handleMaintenanceDone} hitSlop={8}>
                    <Text style={styles.linkText}>Revisão feita</Text>
                  </Pressable>
                </View>
                <Text style={styles.maintText}>
                  {summary.maintenance.remainingKm != null && summary.maintenance.remainingKm > 0
                    ? `Faltam ${formatKm(summary.maintenance.remainingKm)} km para a próxima revisão.`
                    : `Revisão em atraso! Você já rodou ${formatKm(summary.maintenance.kmSinceLast ?? 0)} km desde a última.`}
                </Text>
              </Card>
            ) : (
              <Card style={styles.block}>
                <Text style={styles.maintText}>
                  Configure o intervalo de manutenção em Financeiro → Visão geral → engrenagem de configurações.
                </Text>
              </Card>
            )}
          </View>
        </ScrollView>
      )}
    </Screen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const { styles } = useThemedScreen(createStyles);
  return (
    <View style={styles.metric}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxxl },
  title: { ...typography.screenTitle, marginBottom: spacing.md },
  errorCard: { alignItems: 'center', paddingVertical: spacing.xl },
  empty: { fontSize: 13, color: colors.textSecondary },
  scrollContent: { paddingBottom: spacing.xxl },
  block: { marginTop: spacing.md },
  blockTitle: { marginTop: spacing.xl, marginBottom: spacing.sm },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  consumptionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.brand,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
  },
  addBtnText: { fontSize: 13, fontWeight: '700', color: colors.textOnBrand },
  listItem: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  listTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  listSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  listAmount: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginRight: spacing.md },
  deleteBtn: { padding: 2 },
  flex1: { flex: 1 },
  emptyText: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm },
  summaryRow: { flexDirection: 'row', gap: spacing.sm },
  summaryCard: { flex: 1, gap: 4 },
  summaryLabel: { fontSize: 12, color: colors.textSecondary },
  kmValue: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginTop: 4 },
  maintCaption: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  maintText: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 19 },
  linkText: { fontSize: 13, fontWeight: '700', color: colors.brandDark },
});
