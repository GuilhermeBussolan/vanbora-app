import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Chip } from '@/components';
import { spacing } from '@/theme';

export type FinanceTabKey = 'overview' | 'receivables' | 'expenses' | 'operations' | 'reports';

const TABS: { key: FinanceTabKey; label: string; path: string }[] = [
  { key: 'overview', label: 'Visão geral', path: '/finance' },
  { key: 'receivables', label: 'Recebimentos', path: '/finance/receivables' },
  { key: 'expenses', label: 'Despesas', path: '/finance/expenses' },
  { key: 'operations', label: 'Operação', path: '/finance/operations' },
  { key: 'reports', label: 'Relatórios', path: '/finance/reports' },
];

/** Navegação interna da aba Financeiro (não é uma aba do rodapé — troca via replace, sem empilhar). */
export function FinanceTabs({ active }: { active: FinanceTabKey }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={styles.content}
    >
      {TABS.map((t) => (
        <Chip
          key={t.key}
          label={t.label}
          selected={t.key === active}
          onPress={() => t.key !== active && router.replace(t.path as any)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: spacing.md, flexGrow: 0 },
  content: { paddingRight: spacing.md },
});
