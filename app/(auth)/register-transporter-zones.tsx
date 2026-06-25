import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Input, Screen, StepProgress } from '@/components';
import { useAppState } from '@/context/AppState';
import { registerTransporter } from '@/api/auth';
import { parseAmount } from '../add-expense';
import { colors, radius, spacing, typography } from '@/theme';

/** Cadastro do transportador — Etapa 2: área de atendimento e valor de tabela. */
export default function RegisterTransporterZonesScreen() {
  const { applySession } = useAppState();
  const step1 = useLocalSearchParams<{
    name: string;
    email: string;
    phone: string;
    document?: string;
    cnh?: string;
    plate?: string;
    capacity?: string;
    password: string;
  }>();

  const [schools, setSchools] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [fee, setFee] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinish() {
    if (schools.length === 0 || neighborhoods.length === 0) {
      setError('Adicione ao menos uma escola e um bairro de atendimento.');
      return;
    }
    const feeValue = fee.trim() ? parseAmount(fee) : 0;
    if (feeValue == null || feeValue < 0) {
      setError('Informe um valor de tabela válido.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const capacity = step1.capacity ? Number(step1.capacity) : null;
      const session = await registerTransporter({
        name: step1.name,
        email: step1.email,
        password: step1.password,
        phone: step1.phone,
        document: step1.document || undefined,
        cnh: step1.cnh || undefined,
        plate: step1.plate || undefined,
        capacity: capacity != null && !Number.isNaN(capacity) ? capacity : null,
        schools,
        neighborhoods,
        baseMonthlyFee: feeValue,
      });
      await applySession(session);
      router.replace('/(transporter)/home');
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao concluir o cadastro.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen footer={<Button label="Concluir Cadastro" onPress={handleFinish} loading={loading} />}>
      <AppHeader title="Criar Conta" showBack />
      <StepProgress steps={2} current={2} />

      <Text style={[typography.sectionTitle, styles.section]}>Área de Atendimento e Preço</Text>
      <Text style={styles.subtitle}>
        Os responsáveis encontram você na busca por estas escolas e bairros.
      </Text>

      <EditableList
        label="Escolas atendidas"
        icon="school-outline"
        placeholder="Adicionar escola"
        items={schools}
        onChange={setSchools}
      />
      <EditableList
        label="Bairros atendidos"
        icon="location-outline"
        placeholder="Adicionar bairro"
        items={neighborhoods}
        onChange={setNeighborhoods}
      />

      <Text style={[styles.fieldLabel, styles.spacedTop]}>Valor de tabela (R$/mês)</Text>
      <Input
        icon="cash-outline"
        placeholder="Ex.: 380,00"
        keyboardType="numeric"
        value={fee}
        onChangeText={setFee}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

function EditableList({
  label,
  icon,
  placeholder,
  items,
  onChange,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  items: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  function add() {
    const value = draft.trim();
    if (!value) return;
    if (!items.some((i) => i.toLowerCase() === value.toLowerCase())) {
      onChange([...items, value]);
    }
    setDraft('');
  }

  return (
    <View style={styles.listBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.addRow}>
        <Input
          icon={icon}
          placeholder={placeholder}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          returnKeyType="done"
          containerStyle={styles.flex1}
        />
        <Pressable onPress={add} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={colors.textOnBrand} />
        </Pressable>
      </View>
      <View style={styles.chips}>
        {items.map((item) => (
          <Pressable key={item} onPress={() => onChange(items.filter((i) => i !== item))} style={styles.chip}>
            <Text style={styles.chipText}>{item}</Text>
            <Ionicons name="close" size={14} color={colors.textSecondary} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xs },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.lg, lineHeight: 19 },
  listBlock: { marginBottom: spacing.lg },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  spacedTop: { marginTop: spacing.xs },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex1: { flex: 1 },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
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
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.lg },
});
