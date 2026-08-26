import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Button, Card, Chip, Input, Screen } from '@/components';
import { FinanceTabs } from '@/components/finance/FinanceTabs';
import { useAppState } from '@/context/AppState';
import { FinanceReport, getFinanceReport, ReportLine } from '@/api/finance';
import { formatCurrency } from '@/data/mockData';
import { buildFinanceReportHtml } from '@/lib/financeReportHtml';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

type Preset = 'thisMonth' | 'lastMonth' | 'last3' | 'custom';

const PRESETS: { key: Preset; label: string }[] = [
  { key: 'thisMonth', label: 'Este mês' },
  { key: 'lastMonth', label: 'Mês passado' },
  { key: 'last3', label: 'Últimos 3 meses' },
  { key: 'custom', label: 'Personalizado' },
];

function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Intervalo [from, to] em ISO para um preset (não usado quando preset === 'custom'). */
function presetRange(preset: Exclude<Preset, 'custom'>): { from: string; to: string } {
  const now = new Date();
  const today = toIso(now);
  if (preset === 'thisMonth') {
    return { from: toIso(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
  }
  if (preset === 'lastMonth') {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: toIso(first), to: toIso(last) };
  }
  return { from: toIso(new Date(now.getFullYear(), now.getMonth() - 2, 1)), to: today };
}

/** "dd/mm/aaaa" → "yyyy-MM-dd", ou null se inválida. */
function parseDateBr(text: string): string | null {
  const match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (date.getFullYear() !== Number(y) || date.getMonth() !== Number(m) - 1 || date.getDate() !== Number(d)) {
    return null;
  }
  return `${y}-${m}-${d}`;
}

function formatDateBr(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

function formatDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

/** Relatórios: período selecionável, resumo e exportação em PDF (reaproveita GET /finance/report). */
export default function FinanceReportsScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [preset, setPreset] = useState<Preset>('thisMonth');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (p: Preset, from?: string, to?: string) => {
      if (!token) return;
      let range: { from: string; to: string } | null = null;
      if (p === 'custom') {
        const fromIso = from ? parseDateBr(from) : null;
        const toIso_ = to ? parseDateBr(to) : null;
        if (!fromIso || !toIso_) {
          setReport(null);
          setLoading(false);
          return;
        }
        range = { from: fromIso, to: toIso_ };
      } else {
        range = presetRange(p);
      }
      setLoading(true);
      setError(null);
      getFinanceReport(token, range.from, range.to)
        .then(setReport)
        .catch((err) => setError(err?.message ?? 'Falha ao carregar o relatório.'))
        .finally(() => setLoading(false));
    },
    [token],
  );

  useEffect(() => {
    load('thisMonth');
  }, [load]);

  function selectPreset(p: Preset) {
    setPreset(p);
    if (p !== 'custom') load(p);
    else if (customFrom && customTo) load(p, customFrom, customTo);
  }

  function applyCustomRange() {
    load('custom', customFrom, customTo);
  }

  async function handleExportPdf() {
    if (!report) return;
    setExporting(true);
    try {
      const html = buildFinanceReportHtml(report);
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Relatório financeiro' });
      } else {
        Alert.alert('Indisponível', 'O compartilhamento não está disponível neste dispositivo.');
      }
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Falha ao gerar o PDF.');
    } finally {
      setExporting(false);
    }
  }

  return (
    <Screen>
      <Text style={styles.title}>Financeiro</Text>
      <FinanceTabs active="reports" />

      <View style={styles.presetRow}>
        {PRESETS.map((p) => (
          <Chip key={p.key} label={p.label} selected={preset === p.key} onPress={() => selectPreset(p.key)} />
        ))}
      </View>

      {preset === 'custom' ? (
        <View style={styles.customRow}>
          <Input
            placeholder="De: dd/mm/aaaa"
            keyboardType="number-pad"
            value={customFrom}
            onChangeText={(v) => setCustomFrom(formatDateBr(v))}
            maxLength={10}
            containerStyle={styles.customField}
          />
          <Input
            placeholder="Até: dd/mm/aaaa"
            keyboardType="number-pad"
            value={customTo}
            onChangeText={(v) => setCustomTo(formatDateBr(v))}
            maxLength={10}
            containerStyle={styles.customField}
          />
          <Button label="Aplicar" onPress={applyCustomRange} style={styles.applyBtn} />
        </View>
      ) : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : error ? (
        <Card>
          <Text style={styles.empty}>{error}</Text>
        </Card>
      ) : !report ? (
        <Card style={styles.errorCard}>
          <Text style={styles.empty}>Informe um período válido.</Text>
        </Card>
      ) : (
        <>
          <View style={styles.summaryRow}>
            <SummaryCard label="Recebido" value={report.totalReceived} color={colors.success} />
            <SummaryCard label="Despesas" value={report.totalExpenses} color={colors.danger} />
          </View>
          <View style={styles.summaryRow}>
            <SummaryCard label="Resultado" value={report.balance} color={colors.textPrimary} />
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Km rodados</Text>
              <Text style={styles.summaryValue}>{report.km}</Text>
            </View>
          </View>

          <Text style={[typography.sectionTitle, styles.blockTitle]}>Receitas</Text>
          <ReportList lines={report.income} emptyText="Nenhuma receita no período." />

          <Text style={[typography.sectionTitle, styles.blockTitle]}>Despesas</Text>
          <ReportList lines={report.expenses} emptyText="Nenhuma despesa no período." />

          <Button
            label="Exportar PDF"
            icon="download-outline"
            onPress={handleExportPdf}
            loading={exporting}
            style={styles.exportBtn}
          />
        </>
      )}
    </Screen>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: string }) {
  const { styles } = useThemedScreen(createStyles);
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, { color }]}>{formatCurrency(value)}</Text>
    </View>
  );
}

function ReportList({ lines, emptyText }: { lines: ReportLine[]; emptyText: string }) {
  const { styles } = useThemedScreen(createStyles);
  if (lines.length === 0) {
    return <Text style={styles.emptyText}>{emptyText}</Text>;
  }
  return (
    <Card style={styles.block}>
      {lines.map((l, i) => (
        <View key={`${l.date}-${i}`} style={[styles.lineRow, i === 0 && styles.lineRowFirst]}>
          <View style={styles.flex1}>
            <Text style={styles.lineDesc}>{l.description}</Text>
            <Text style={styles.lineDate}>{formatDate(l.date)}</Text>
          </View>
          <Text style={styles.lineAmount}>{formatCurrency(l.amount)}</Text>
        </View>
      ))}
    </Card>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  title: { ...typography.screenTitle, marginBottom: spacing.md },
  center: { paddingTop: spacing.xxxl, alignItems: 'center' },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.sm },
  customRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, marginBottom: spacing.md },
  customField: { flex: 1 },
  applyBtn: { marginBottom: 2 },
  errorCard: { alignItems: 'center', paddingVertical: spacing.xl },
  empty: { fontSize: 13, color: colors.textSecondary },
  summaryRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  summaryCard: { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: spacing.md, gap: 4 },
  summaryLabel: { fontSize: 11, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 },
  summaryValue: { fontSize: 16, fontWeight: '800' },
  blockTitle: { marginTop: spacing.lg, marginBottom: spacing.sm },
  block: {},
  lineRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm, marginTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  lineRowFirst: { marginTop: 0, paddingTop: 0, borderTopWidth: 0 },
  flex1: { flex: 1 },
  lineDesc: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  lineDate: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  lineAmount: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  emptyText: { fontSize: 13, color: colors.textSecondary },
  exportBtn: { marginTop: spacing.xl },
});
