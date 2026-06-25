import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Button, Card, Input, Screen, StarRating } from '@/components';
import { useAppState } from '@/context/AppState';
import { searchTransporters } from '@/api/transporter';
import { mediaUrl } from '@/api/client';
import { formatCurrency } from '@/data/mockData';
import { TransporterSummaryDto } from '@/types';
import { colors, radius, spacing, typography } from '@/theme';

type SortKey = 'price' | 'rating';

/** Busca de transportadores por escola e bairro. */
export default function SearchScreen() {
  const { token } = useAppState();
  const [school, setSchool] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [sort, setSort] = useState<SortKey>('price');
  const [results, setResults] = useState<TransporterSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(
    (sortKey: SortKey) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      searchTransporters(token, {
        school: school.trim() || undefined,
        neighborhood: neighborhood.trim() || undefined,
        sort: sortKey,
      })
        .then(setResults)
        .catch((err) => setError(err?.message ?? 'Falha ao buscar transportadores.'))
        .finally(() => setLoading(false));
    },
    [token, school, neighborhood],
  );

  // Carrega a lista inicial ao focar a tela.
  useFocusEffect(
    useCallback(() => {
      runSearch(sort);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]),
  );

  function changeSort(next: SortKey) {
    setSort(next);
    runSearch(next);
  }

  return (
    <Screen>
      <Text style={[typography.screenTitle, styles.title]}>Encontrar Transportador</Text>

      <View style={styles.form}>
        <Input
          icon="school-outline"
          placeholder="Escola do seu filho"
          value={school}
          onChangeText={setSchool}
        />
        <Input
          icon="location-outline"
          placeholder="Bairro de atendimento"
          value={neighborhood}
          onChangeText={setNeighborhood}
        />
        <Button label="Buscar" icon="search" onPress={() => runSearch(sort)} />
      </View>

      <View style={styles.resultsHeader}>
        <Text style={typography.sectionTitle}>Resultados</Text>
        <View style={styles.sortRow}>
          <SortPill label="Preço" active={sort === 'price'} onPress={() => changeSort('price')} />
          <SortPill label="Avaliação" active={sort === 'rating'} onPress={() => changeSort('rating')} />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : error ? (
        <Card>
          <Text style={styles.empty}>{error}</Text>
        </Card>
      ) : results.length === 0 ? (
        <Card>
          <Text style={styles.empty}>Nenhum transportador encontrado para esses filtros.</Text>
        </Card>
      ) : (
        <View style={styles.list}>
          {results.map((t) => (
            <ResultCard key={t.id} transporter={t} />
          ))}
        </View>
      )}
    </Screen>
  );
}

function SortPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.sortPill, active && styles.sortPillActive]}>
      <Ionicons name="swap-vertical" size={13} color={active ? colors.textOnBrand : colors.textSecondary} />
      <Text style={[styles.sortText, active && styles.sortTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ResultCard({ transporter }: { transporter: TransporterSummaryDto }) {
  return (
    <Card>
      <View style={styles.cardTop}>
        <Avatar name={transporter.name} size={44} uri={mediaUrl(transporter.photoUrl)} />
        <View style={styles.cardInfo}>
          <Text style={typography.cardTitle}>{transporter.name}</Text>
          <StarRating rating={transporter.rating} size={13} />
        </View>
      </View>

      <Text style={styles.meta}>
        {(transporter.schools[0] ?? 'Escolas a definir')} •{' '}
        {(transporter.neighborhoods[0] ?? 'Bairros a definir')} • {transporter.availableSeats} vagas
      </Text>

      <View style={styles.cardBottom}>
        <View>
          <Text style={styles.feeLabel}>Mensalidade base</Text>
          <Text style={styles.fee}>
            {formatCurrency(transporter.monthlyFee)}
            <Text style={styles.feePeriod}> /mês</Text>
          </Text>
        </View>
        <Button
          label="Ver Perfil"
          variant="secondary"
          onPress={() => router.push(`/transporter/${transporter.id}`)}
          style={styles.profileBtn}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.lg },
  form: { gap: spacing.md, marginBottom: spacing.xl },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sortRow: { flexDirection: 'row', gap: spacing.sm },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortPillActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  sortText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  sortTextActive: { color: colors.textOnBrand },
  center: { paddingTop: spacing.xxxl, alignItems: 'center' },
  empty: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  list: { gap: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardInfo: { flex: 1, gap: 4 },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.md },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  feeLabel: { fontSize: 11, color: colors.textSecondary },
  fee: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginTop: 2 },
  feePeriod: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  profileBtn: { height: 40, paddingHorizontal: spacing.lg },
});
