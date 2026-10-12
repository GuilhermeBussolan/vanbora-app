import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Card, Chip, Input, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { listMonitorStudents } from '@/api/monitor';
import { MonitorStudentDto } from '@/types';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

type Filter = 'all' | 'confirmed' | 'absent';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'confirmed', label: 'Vão hoje' },
  { key: 'absent', label: 'Ausentes' },
];

/**
 * Alunos dos percursos do monitor — mesmo padrão da lista do transportador, sem dados
 * financeiros. Só aparecem alunos dos percursos em que ele está escalado.
 */
export default function MonitorStudentsScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [students, setStudents] = useState<MonitorStudentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    listMonitorStudents(token)
      .then(setStudents)
      .catch((err) => setError(err?.message ?? 'Falha ao carregar os alunos.'))
      .finally(() => setLoading(false));
  }, [token]);

  useFocusEffect(load);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      const matchesQuery =
        !q || s.name.toLowerCase().includes(q) || s.guardianName.toLowerCase().includes(q);
      const matchesFilter =
        filter === 'all' || (filter === 'confirmed' && s.presentToday) || (filter === 'absent' && !s.presentToday);
      return matchesQuery && matchesFilter;
    });
  }, [students, filter, query]);

  return (
    <Screen>
      <Text style={[typography.screenTitle, styles.title]}>Meus Alunos</Text>

      <Input
        icon="search"
        placeholder="Buscar aluno ou responsável"
        value={query}
        onChangeText={setQuery}
        containerStyle={styles.search}
      />

      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Chip key={f.key} label={f.label} selected={filter === f.key} onPress={() => setFilter(f.key)} />
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : error ? (
        <Card>
          <Text style={styles.empty}>{error}</Text>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <Text style={styles.empty}>
            {students.length === 0
              ? 'Nenhum aluno ainda. Os alunos aparecem quando você é escalado em um percurso.'
              : 'Nenhum aluno nesta lista.'}
          </Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {filtered.map((student) => {
            const expanded = expandedId === student.id;
            return (
              <Card key={student.id}>
                <Pressable
                  style={styles.cardTop}
                  onPress={() => setExpandedId((prev) => (prev === student.id ? null : student.id))}
                >
                  <Avatar name={student.name} size={46} />
                  <View style={styles.cardInfo}>
                    <Text style={styles.name}>{student.name}</Text>
                    <View style={styles.schoolRow}>
                      <Ionicons name="school-outline" size={13} color={colors.textSecondary} />
                      <Text style={styles.school} numberOfLines={1}>
                        {student.school}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cardRight}>
                    <View
                      style={[styles.dot, { backgroundColor: student.presentToday ? colors.success : colors.danger }]}
                    />
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
                  </View>
                </Pressable>
                {expanded ? (
                  <View style={styles.details}>
                    <DetailRow icon="person-outline" text={`Resp.: ${student.guardianName}`} />
                    {student.neighborhood ? <DetailRow icon="location-outline" text={student.neighborhood} /> : null}
                    <DetailRow icon="git-branch-outline" text={`Percurso: ${student.trips.join(', ')}`} />
                    <DetailRow icon="bus-outline" text={student.presentToday ? 'Vai hoje' : 'Não vai hoje'} />
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

function DetailRow({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const { colors, styles } = useThemedScreen(createStyles);
  return (
    <View style={styles.detailRow}>
      <Ionicons name={icon} size={14} color={colors.textSecondary} />
      <Text style={styles.detailText}>{text}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  title: { marginBottom: spacing.lg },
  search: { marginBottom: spacing.lg },
  filters: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  center: { paddingTop: spacing.xxxl, alignItems: 'center' },
  list: { gap: spacing.md },
  empty: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  cardInfo: { flex: 1, marginLeft: spacing.md, gap: 3 },
  name: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  schoolRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  school: { fontSize: 13, color: colors.textSecondary, flexShrink: 1 },
  cardRight: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  details: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailText: { fontSize: 13, color: colors.textSecondary },
});
