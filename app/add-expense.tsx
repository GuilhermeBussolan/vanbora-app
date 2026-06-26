import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, Button, Input, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { addExpense } from '@/api/finance';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Categorias comuns para preenchimento rápido. */
const QUICK_CATEGORIES = ['Manutenção', 'Pedágio', 'Seguro', 'Lavagem', 'Documentação', 'Outros'];

/** Cadastro de um gasto livre do transportador. */
export default function AddExpenseScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const value = parseAmount(amount);
    if (!category.trim()) {
      setError('Informe a categoria do gasto.');
      return;
    }
    if (value == null || value <= 0) {
      setError('Informe um valor válido.');
      return;
    }
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await addExpense(token, {
        date: null,
        category: category.trim(),
        description: description.trim() || null,
        amount: value,
      });
      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao salvar o gasto.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen footer={<Button label="Salvar gasto" onPress={handleSave} loading={loading} />}>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Adicionar Gasto</Text>
      <Text style={styles.subtitle}>Registre uma despesa do seu transporte.</Text>

      <Text style={styles.fieldLabel}>Categoria</Text>
      <View style={styles.chips}>
        {QUICK_CATEGORIES.map((c) => {
          const active = c === category;
          return (
            <Pressable
              key={c}
              onPress={() => setCategory(c)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
            </Pressable>
          );
        })}
      </View>
      <Input
        icon="pricetag-outline"
        placeholder="Categoria (ex.: Manutenção)"
        value={category}
        onChangeText={setCategory}
        containerStyle={styles.field}
      />

      <Text style={styles.fieldLabel}>Valor (R$)</Text>
      <Input
        icon="cash-outline"
        placeholder="0,00"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        containerStyle={styles.field}
      />

      <Text style={styles.fieldLabel}>Descrição (opcional)</Text>
      <Input
        icon="document-text-outline"
        placeholder="Detalhes do gasto"
        value={description}
        onChangeText={setDescription}
        containerStyle={styles.field}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

/** Aceita "50", "50,90" ou "50.90" e devolve número (ou null se inválido). */
export function parseAmount(text: string): number | null {
  const normalized = text.trim().replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  title: { marginTop: spacing.md },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  field: { marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.textOnBrand },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.sm },
});
