import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Card, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { listTrips } from '@/api/trips';
import { TripDto } from '@/types';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** [Transportador] Lista dos percursos para cadastro/edição da escala de monitores e alunos. */
export default function TripsScreen() {
  const { colors, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [trips, setTrips] = useState<TripDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    listTrips(token)
      .then((list) => {
        setTrips(list);
        setError(null);
      })
      .catch((err) => setError(err?.message ?? 'Falha ao carregar os percursos.'))
      .finally(() => setLoading(false));
  }, [token]);

  useFocusEffect(load);

  return (
    <Screen
      footer={<Button label="Novo percurso" icon="add" onPress={() => router.push('/edit-trip')} />}
    >
      <AppHeader title="Percursos" showBack />

      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : error ? (
        <Card>
          <Text style={styles.empty}>{error}</Text>
        </Card>
      ) : trips.length === 0 ? (
        <Card>
          <Text style={styles.empty}>Nenhum percurso cadastrado ainda.</Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {trips.map((trip) => (
            <Pressable
              key={trip.id}
              onPress={() => router.push({ pathname: '/edit-trip', params: { id: String(trip.id) } })}
            >
              <Card style={styles.row}>
                <Ionicons name="git-branch-outline" size={20} color={colors.brandDark} />
                <View style={styles.info}>
                  <Text style={styles.name}>{trip.name}</Text>
                  <Text style={styles.meta}>
                    {trip.allStudents ? 'Todos os alunos' : `${trip.studentCount} aluno(s)`} •{' '}
                    {trip.monitors.length > 0 ? trip.monitors.map((m) => m.name).join(', ') : 'Sem monitor'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  loader: { marginTop: spacing.xxxl },
  empty: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  list: { gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: 12, color: colors.textSecondary },
});
