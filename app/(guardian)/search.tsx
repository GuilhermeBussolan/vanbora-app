import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AutocompleteInput, Avatar, Button, Card, Screen, StarRating } from '@/components';
import { useAppState } from '@/context/AppState';
import { getSearchFilters, searchTransporters } from '@/api/transporter';
import { mediaUrl } from '@/api/client';
import { formatCurrency } from '@/data/mockData';
import { TransporterSummaryDto } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

type SortKey = 'price' | 'rating';

/** Busca de transportadores por escola e bairro. */
export default function SearchScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [school, setSchool] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [schoolOptions, setSchoolOptions] = useState<string[]>([]);
  const [neighborhoodOptions, setNeighborhoodOptions] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>('price');
  const [results, setResults] = useState<TransporterSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Busca com os filtros atuais; aceita overrides para rodar com o valor recém-selecionado
  // (o state ainda não atualizou no mesmo ciclo de render).
  const runSearch = useCallback(
    (sortKey: SortKey, schoolArg = school, neighborhoodArg = neighborhood) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      searchTransporters(token, {
        school: schoolArg.trim() || undefined,
        neighborhood: neighborhoodArg.trim() || undefined,
        sort: sortKey,
      })
        .then(setResults)
        .catch((err) => setError(err?.message ?? 'Falha ao buscar transportadores.'))
        .finally(() => setLoading(false));
    },
    [token, school, neighborhood],
  );

  // Carrega a lista inicial e as opções dos filtros ao focar a tela.
  useFocusEffect(
    useCallback(() => {
      runSearch(sort);
      if (token) {
        getSearchFilters(token)
          .then((f) => {
            setSchoolOptions(f.schools);
            setNeighborhoodOptions(f.neighborhoods);
          })
          .catch(() => {
            /* silencioso: filtros são um auxílio, não bloqueiam a busca */
          });
      }
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
        <AutocompleteInput
          icon="school-outline"
          placeholder="Escola do seu filho"
          value={school}
          onChangeText={setSchool}
          options={schoolOptions}
          onSelect={(val) => runSearch(sort, val, neighborhood)}
        />
        <AutocompleteInput
          icon="location-outline"
          placeholder="Bairro de atendimento"
          value={neighborhood}
          onChangeText={setNeighborhood}
          options={neighborhoodOptions}
          onSelect={(val) => runSearch(sort, school, val)}
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
  const { colors, typography, styles } = useThemedScreen(createStyles);
  return (
    <Pressable onPress={onPress} style={[styles.sortPill, active && styles.sortPillActive]}>
      <Ionicons name="swap-vertical" size={13} color={active ? colors.textOnBrand : colors.textSecondary} />
      <Text style={[styles.sortText, active && styles.sortTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ResultCard({ transporter }: { transporter: TransporterSummaryDto }) {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  return (
    <Card>
      <View style={styles.cardTop}>
        <Avatar name={transporter.name} size={44} uri={mediaUrl(transporter.photoUrl)} />
        <View style={styles.cardInfo}>
          <Text style={typography.cardTitle}>{transporter.name}</Text>
          <StarRating rating={transporter.rating} size={13} />
        </View>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Ionicons name="school-outline" size={14} color={colors.textSecondary} style={styles.summaryIcon} />
          <Text style={styles.summaryText}>
            {transporter.schools.length > 0
              ? transporter.schools.join(' • ')
              : 'Escolas a definir'}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} style={styles.summaryIcon} />
          <Text style={styles.summaryText}>
            {transporter.neighborhoods.length > 0
              ? transporter.neighborhoods.join(' • ')
              : 'Bairros a definir'}
          </Text>
        </View>
      </View>

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

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
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
  summary: { marginTop: spacing.md, gap: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start' },
  summaryIcon: { marginTop: 1, marginRight: 6 },
  summaryText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
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
