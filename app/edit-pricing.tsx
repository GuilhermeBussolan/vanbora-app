import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Card, Input, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { getMyProfile, updatePricing, PriceZoneInput } from '@/api/transporter';
import { getFees } from '@/api/config';
import { annualBreakdown, formatRate, monthlyBreakdown, type FeeBreakdown } from '@/lib/fees';
import { formatCurrency } from '@/data/mockData';
import { FeesDto } from '@/types';
import { parseAmount } from './add-expense';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

type PlanKind = 'monthly' | 'annual' | 'installment';

interface EditableZone {
  key: string;
  id?: number;
  name: string;
  school: string;
  neighborhoods: string[];
  monthly: string;
  annual: string;
  installment: string;
}

/** Configuração de preço: planos (mensal/anual/parcelado), zonas e propostas. */
export default function EditPricingScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const zoneCounter = useRef(0);

  const [fees, setFees] = useState<FeesDto | null>(null);
  const [monthly, setMonthly] = useState('');
  const [annual, setAnnual] = useState('');
  const [installment, setInstallment] = useState('');
  const [acceptsProposals, setAcceptsProposals] = useState(false);
  const [zones, setZones] = useState<EditableZone[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([getMyProfile(token), getFees(token)])
      .then(([p, f]) => {
        setFees(f);
        setMonthly(p.baseMonthlyFee ? String(p.baseMonthlyFee) : '');
        setAnnual(p.annualPlanFee != null ? String(p.annualPlanFee) : '');
        setInstallment(p.installmentMonthlyFee != null ? String(p.installmentMonthlyFee) : '');
        setAcceptsProposals(p.acceptsProposals);
        setZones(
          p.priceZones.map((z) => ({
            key: `z${(zoneCounter.current += 1)}`,
            id: z.id,
            name: z.name,
            school: z.school ?? '',
            neighborhoods: z.neighborhoods,
            monthly: String(z.monthlyFee),
            annual: z.annualFee != null ? String(z.annualFee) : '',
            installment: z.installmentMonthlyFee != null ? String(z.installmentMonthlyFee) : '',
          })),
        );
      })
      .catch((err) => setError(err?.message ?? 'Falha ao carregar os dados.'))
      .finally(() => setLoading(false));
  }, [token]);

  function addZone() {
    setZones((prev) => [
      ...prev,
      {
        key: `z${(zoneCounter.current += 1)}`,
        name: '',
        school: '',
        neighborhoods: [],
        monthly: '',
        annual: '',
        installment: '',
      },
    ]);
  }

  function updateZone(key: string, patch: Partial<EditableZone>) {
    setZones((prev) => prev.map((z) => (z.key === key ? { ...z, ...patch } : z)));
  }

  function removeZone(key: string) {
    setZones((prev) => prev.filter((z) => z.key !== key));
  }

  async function handleSave() {
    const monthlyValue = parseAmount(monthly);
    if (monthlyValue == null || monthlyValue <= 0) {
      setError('Informe o valor do plano mensal.');
      return;
    }
    const annualValue = annual.trim() ? parseAmount(annual) : null;
    const installmentValue = installment.trim() ? parseAmount(installment) : null;

    const zonePayload: PriceZoneInput[] = [];
    for (const z of zones) {
      if (!z.name.trim()) continue;
      const zMonthly = parseAmount(z.monthly);
      if (zMonthly == null || zMonthly <= 0) {
        setError(`Informe o valor mensal da zona "${z.name.trim()}".`);
        return;
      }
      zonePayload.push({
        id: z.id,
        name: z.name.trim(),
        school: z.school.trim() || null,
        neighborhoods: z.neighborhoods,
        monthlyFee: zMonthly,
        annualFee: z.annual.trim() ? parseAmount(z.annual) : null,
        installmentMonthlyFee: z.installment.trim() ? parseAmount(z.installment) : null,
      });
    }

    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await updatePricing(token, {
        monthlyFee: monthlyValue,
        annualFee: annualValue,
        installmentMonthlyFee: installmentValue,
        acceptsProposals,
        zones: zonePayload,
      });
      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader showBack />
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen footer={<Button label="Salvar preços" onPress={handleSave} loading={saving} />}>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Preços e Planos</Text>
      <Text style={styles.subtitle}>
        Defina o valor de cada plano. Mostramos ao lado quanto você recebe líquido, já descontadas
        a taxa do VanBora e a do pagamento.
      </Text>

      <Text style={[typography.sectionTitle, styles.section]}>Seus planos</Text>

      <PlanField
        kind="monthly"
        title="Mensal"
        hint="Mais caro, sem fidelidade — o responsável cancela quando quiser."
        value={monthly}
        onChange={setMonthly}
        placeholder="Ex.: 420,00"
        fees={fees}
        styles={styles}
        colors={colors}
      />
      <PlanField
        kind="installment"
        title="Parcelado (mensal)"
        hint={
          fees
            ? `Mais barato, com fidelidade de ${fees.fidelityMonths} meses. Cancelar antes gera multa de ${formatRate(
                fees.installmentFine,
              )} das mensalidades restantes.`
            : 'Mais barato, com fidelidade.'
        }
        value={installment}
        onChange={setInstallment}
        placeholder="Opcional — ex.: 360,00"
        fees={fees}
        styles={styles}
        colors={colors}
      />
      <PlanField
        kind="annual"
        title="Anual (total à vista)"
        hint="Pago de uma vez. No cancelamento, reembolso proporcional (o VanBora retém a taxa administrativa)."
        value={annual}
        onChange={setAnnual}
        placeholder="Opcional — ex.: 4.200,00"
        fees={fees}
        styles={styles}
        colors={colors}
      />

      <View style={styles.toggleRow}>
        <View style={styles.flex1}>
          <Text style={styles.toggleLabel}>Aceitar propostas de valor</Text>
          <Text style={styles.toggleHint}>
            Se ativado, o responsável pode propor um valor diferente ao solicitar. Você decide aceitar ou não.
          </Text>
        </View>
        <Switch
          value={acceptsProposals}
          onValueChange={setAcceptsProposals}
          trackColor={{ true: colors.brand, false: colors.border }}
          thumbColor={colors.white}
        />
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={typography.sectionTitle}>Preços por escola/bairro</Text>
      </View>
      <Text style={styles.subtitle}>
        Opcional. Crie zonas para cobrar valores diferentes por escola ou bairro. Sem zonas, valem os
        planos acima para todos.
      </Text>

      {zones.map((zone) => (
        <ZoneCard
          key={zone.key}
          zone={zone}
          fees={fees}
          onChange={(patch) => updateZone(zone.key, patch)}
          onRemove={() => removeZone(zone.key)}
          styles={styles}
          colors={colors}
        />
      ))}

      <Pressable onPress={addZone} style={styles.addZone}>
        <Ionicons name="add-circle-outline" size={20} color={colors.brandDark} />
        <Text style={styles.addZoneText}>Adicionar zona de preço</Text>
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

/** Campo de um plano com prévia ao vivo do líquido. */
function PlanField({
  kind,
  title,
  hint,
  value,
  onChange,
  placeholder,
  fees,
  styles,
  colors,
}: {
  kind: PlanKind;
  title: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  fees: FeesDto | null;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  const amount = parseAmount(value) ?? 0;
  const showBreakdown = fees != null && amount > 0;
  const breakdown = showBreakdown
    ? kind === 'annual'
      ? annualBreakdown(amount, fees)
      : monthlyBreakdown(amount, fees)
    : null;

  return (
    <Card style={styles.planCard}>
      <View style={styles.planHeader}>
        <Text style={styles.planTitle}>{title}</Text>
      </View>
      <Text style={styles.planHint}>{hint}</Text>
      <Input
        icon="cash-outline"
        placeholder={placeholder}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        containerStyle={styles.planInput}
      />
      {breakdown && fees ? (
        <Breakdown
          breakdown={breakdown}
          fees={fees}
          annual={kind === 'annual'}
          styles={styles}
          colors={colors}
        />
      ) : null}
    </Card>
  );
}

/** Linhas: bruto → −VanBora → −gateway → líquido. */
function Breakdown({
  breakdown,
  fees,
  annual,
  styles,
  colors,
}: {
  breakdown: FeeBreakdown;
  fees: FeesDto;
  annual: boolean;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  const adminRate = annual ? fees.adminAnnual : fees.adminMonthly;
  return (
    <View style={styles.breakdown}>
      <Row styles={styles} label="Você cobra" value={formatCurrency(breakdown.gross)} />
      <Row
        styles={styles}
        label={`− Taxa VanBora (${formatRate(adminRate)})`}
        value={`− ${formatCurrency(breakdown.adminFee)}`}
        muted
      />
      <Row
        styles={styles}
        label={`− Taxa do pagamento (${formatRate(fees.gatewayRate)})`}
        value={`− ${formatCurrency(breakdown.gatewayFee)}`}
        muted
      />
      <View style={styles.breakdownDivider} />
      <Row styles={styles} label="Você recebe" value={formatCurrency(breakdown.net)} strong />
      {annual ? (
        <Text style={styles.equivMonthly}>
          ≈ {formatCurrency(breakdown.net / 12)}/mês líquido
        </Text>
      ) : null}
    </View>
  );
}

function Row({
  label,
  value,
  strong,
  muted,
  styles,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={[styles.breakdownLabel, muted && styles.breakdownMuted]}>{label}</Text>
      <Text
        style={[styles.breakdownValue, strong && styles.breakdownStrong, muted && styles.breakdownMuted]}
      >
        {value}
      </Text>
    </View>
  );
}

/** Editor de uma zona de preço (escola/bairros + 3 valores). */
function ZoneCard({
  zone,
  fees,
  onChange,
  onRemove,
  styles,
  colors,
}: {
  zone: EditableZone;
  fees: FeesDto | null;
  onChange: (patch: Partial<EditableZone>) => void;
  onRemove: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  const [draft, setDraft] = useState('');

  function addNeighborhood() {
    const v = draft.trim();
    if (!v) return;
    if (!zone.neighborhoods.some((n) => n.toLowerCase() === v.toLowerCase())) {
      onChange({ neighborhoods: [...zone.neighborhoods, v] });
    }
    setDraft('');
  }

  const monthlyNum = parseAmount(zone.monthly) ?? 0;
  const breakdown = fees && monthlyNum > 0 ? monthlyBreakdown(monthlyNum, fees) : null;

  return (
    <Card style={styles.zoneCard}>
      <View style={styles.zoneTop}>
        <Text style={styles.zoneBadge}>Zona</Text>
        <Pressable onPress={onRemove} hitSlop={8} style={styles.zoneRemove}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
        </Pressable>
      </View>
      <Input
        icon="pricetag-outline"
        placeholder="Nome (ex.: Premium, Zona Sul)"
        value={zone.name}
        onChangeText={(v) => onChange({ name: v })}
        containerStyle={styles.zoneField}
      />
      <Input
        icon="school-outline"
        placeholder="Escola (opcional)"
        value={zone.school}
        onChangeText={(v) => onChange({ school: v })}
        containerStyle={styles.zoneField}
      />

      <Text style={styles.zoneFieldLabel}>Bairros</Text>
      <View style={styles.zoneAddRow}>
        <Input
          icon="location-outline"
          placeholder="Adicionar bairro"
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={addNeighborhood}
          returnKeyType="done"
          containerStyle={styles.flex1}
        />
        <Pressable onPress={addNeighborhood} style={styles.zoneAddBtn}>
          <Ionicons name="add" size={22} color={colors.textOnBrand} />
        </Pressable>
      </View>
      <View style={styles.chips}>
        {zone.neighborhoods.map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange({ neighborhoods: zone.neighborhoods.filter((x) => x !== n) })}
            style={styles.chip}
          >
            <Text style={styles.chipText}>{n}</Text>
            <Ionicons name="close" size={14} color={colors.textSecondary} />
          </Pressable>
        ))}
      </View>

      <View style={styles.zoneFees}>
        <Input
          placeholder="Mensal"
          value={zone.monthly}
          onChangeText={(v) => onChange({ monthly: v })}
          keyboardType="numeric"
          containerStyle={styles.flex1}
        />
        <Input
          placeholder="Parcelado"
          value={zone.installment}
          onChangeText={(v) => onChange({ installment: v })}
          keyboardType="numeric"
          containerStyle={styles.flex1}
        />
        <Input
          placeholder="Anual"
          value={zone.annual}
          onChangeText={(v) => onChange({ annual: v })}
          keyboardType="numeric"
          containerStyle={styles.flex1}
        />
      </View>
      {breakdown ? (
        <Text style={styles.zoneNet}>
          Mensal: você recebe {formatCurrency(breakdown.net)} líquido
        </Text>
      ) : null}
    </Card>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxxl },
    title: { marginTop: spacing.md },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      marginBottom: spacing.md,
      lineHeight: 19,
    },
    section: { marginTop: spacing.lg, marginBottom: spacing.sm },
    sectionHeaderRow: { marginTop: spacing.xl },
    planCard: { marginBottom: spacing.md, gap: spacing.xs },
    planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    planTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
    planHint: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
    planInput: { marginTop: spacing.sm },
    breakdown: {
      marginTop: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      gap: 4,
    },
    breakdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    breakdownLabel: { fontSize: 13, color: colors.textSecondary },
    breakdownValue: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
    breakdownMuted: { color: colors.textMuted },
    breakdownStrong: { fontSize: 16, fontWeight: '800', color: colors.success },
    breakdownDivider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
    equivMonthly: { fontSize: 11, color: colors.textSecondary, textAlign: 'right' },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
    flex1: { flex: 1 },
    toggleLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
    toggleHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
    zoneCard: { marginBottom: spacing.md, gap: spacing.sm },
    zoneTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    zoneBadge: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.brandDark,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    zoneRemove: { padding: 2 },
    zoneField: { marginTop: 0 },
    zoneFieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
    zoneAddRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    zoneAddBtn: {
      width: 50,
      height: 50,
      borderRadius: radius.md,
      backgroundColor: colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      backgroundColor: colors.brandSoft,
      borderWidth: 1,
      borderColor: colors.brand,
    },
    chipText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
    zoneFees: { flexDirection: 'row', gap: spacing.sm },
    zoneNet: { fontSize: 12, color: colors.success, fontWeight: '600' },
    addZone: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      justifyContent: 'center',
      paddingVertical: spacing.md,
    },
    addZoneText: { fontSize: 14, fontWeight: '600', color: colors.brandDark },
    error: { fontSize: 13, color: colors.danger, marginTop: spacing.lg },
  });
