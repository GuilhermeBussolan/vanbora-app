import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Badge, Card, Chip, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { listChecklists } from '@/api/checklists';
import { formatDate, formatTime } from '@/lib/dateFormat';
import { ChecklistStatus, SafetyChecklistDto } from '@/types';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

const FILTERS: { key: ChecklistStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Todos' },
  { key: 'PENDING', label: 'Pendentes' },
  { key: 'COMPLETED', label: 'Concluídos' },
];

/** Histórico dos checklists de segurança dos percursos do usuário (motorista ou monitor). */
export default function SafetyChecklistsScreen() {
  const { colors, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [filter, setFilter] = useState<ChecklistStatus | 'ALL'>('ALL');
  const [items, setItems] = useState<SafetyChecklistDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    listChecklists(token, filter === 'ALL' ? undefined : filter)
      .then(setItems)
      .catch((err) => setError(err?.message ?? 'Falha ao carregar as verificações.'))
      .finally(() => setLoading(false));
  }, [token, filter]);

  useFocusEffect(load);

  return (
    <Screen>
      <AppHeader title="Verificações de segurança" showBack />

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : error ? (
        <Card>
          <Text style={styles.empty}>{error}</Text>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <Text style={styles.empty}>Nenhuma verificação nesta lista.</Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {items.map((c) => {
            const done = c.status === 'COMPLETED';
            return (
              <Pressable key={c.id} onPress={() => router.push(`/safety-checklist/${c.id}`)}>
                <Card style={styles.row}>
                  <Ionicons
                    name={done ? 'checkmark-circle' : 'warning-outline'}
                    size={22}
                    color={done ? colors.success : colors.warning}
                  />
                  <View style={styles.info}>
                    <Text style={styles.title}>{c.tripName}</Text>
                    <Text style={styles.meta}>
                      {done
                        ? `${c.completedByName} — ${c.completedByRole} • ${formatDate(c.completedAt)} às ${formatTime(c.completedAt)}`
                        : `Encerrado ${formatDate(c.tripFinishedAt)} às ${formatTime(c.tripFinishedAt)}`}
                    </Text>
                  </View>
                  <Badge label={done ? 'CONCLUÍDO' : 'PENDENTE'} tone={done ? 'success' : 'warning'} />
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  loader: { marginTop: spacing.xxxl },
  empty: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  info: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: 12, color: colors.textSecondary },
});
