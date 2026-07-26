import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { AutocompleteInput, Avatar, Button, Card, Input, Screen, StarRating } from '@/components';
import { useAppState } from '@/context/AppState';
import { getSearchFilters, searchTransporters } from '@/api/transporter';
import { mediaUrl } from '@/api/client';
import { formatCep, lookupCep } from '@/lib/cepLookup';
import { formatCurrency } from '@/data/mockData';
import { TransporterSummaryDto } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

type SortKey = 'price' | 'rating';
type SortDir = 'asc' | 'desc';

/** Busca de transportadores: por escola/bairro, CEP ou localização atual. */
export default function SearchScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [school, setSchool] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [cep, setCep] = useState('');
  const [schoolOptions, setSchoolOptions] = useState<string[]>([]);
  const [neighborhoodOptions, setNeighborhoodOptions] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>('price');
  const [dir, setDir] = useState<SortDir>('asc');
  const [results, setResults] = useState<TransporterSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(
    (
      sortKey: SortKey,
      sortDir: SortDir,
      schoolArg = school,
      neighborhoodArg = neighborhood,
    ) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      searchTransporters(token, {
        school: schoolArg.trim() || undefined,
        neighborhood: neighborhoodArg.trim() || undefined,
        sort: sortKey,
        dir: sortDir,
      })
        .then(setResults)
        .catch((err) => setError(err?.message ?? 'Falha ao buscar transportadores.'))
        .finally(() => setLoading(false));
    },
    [token, school, neighborhood],
  );

  useFocusEffect(
    useCallback(() => {
      runSearch(sort, dir);
      if (token) {
        getSearchFilters(token)
          .then((f) => {
            setSchoolOptions(f.schools);
            setNeighborhoodOptions(f.neighborhoods);
          })
          .catch(() => undefined);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]),
  );

  // 1º clique numa métrica = asc; clicar de novo na mesma inverte para desc.
  function changeSort(next: SortKey) {
    const nextDir: SortDir = next === sort ? (dir === 'asc' ? 'desc' : 'asc') : 'asc';
    setSort(next);
    setDir(nextDir);
    runSearch(next, nextDir);
  }

  async function onCepChange(raw: string) {
    const masked = formatCep(raw);
    setCep(masked);
    if (masked.replace(/\D/g, '').length === 8) {
      const found = await lookupCep(masked);
      if (found?.neighborhood) {
        setNeighborhood(found.neighborhood);
        runSearch(sort, dir, school, found.neighborhood);
      }
    }
  }

  async function useMyLocation() {
    setLocating(true);
    setError(null);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Permissão necessária', 'Autorize a localização para buscar por perto.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [place] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const bairro = place?.district ?? place?.subregion ?? place?.city ?? '';
      if (bairro) {
        setNeighborhood(bairro);
        runSearch(sort, dir, school, bairro);
      } else {
        Alert.alert('Localização', 'Não foi possível identificar o bairro pela sua localização.');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Falha ao obter a localização.');
    } finally {
      setLocating(false);
    }
  }

  const nearby = results.filter((t) => t.nearby);
  const others = results.filter((t) => !t.nearby);
  const hasRef = school.trim() !== '' || neighborhood.trim() !== '';

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
          onSelect={(val) => runSearch(sort, dir, val, neighborhood)}
        />
        <AutocompleteInput
          icon="location-outline"
          placeholder="Bairro de atendimento"
          value={neighborhood}
          onChangeText={setNeighborhood}
          options={neighborhoodOptions}
          onSelect={(val) => runSearch(sort, dir, school, val)}
        />
        <View style={styles.cepRow}>
          <Input
            icon="map-outline"
            placeholder="CEP"
            keyboardType="numeric"
            value={cep}
            onChangeText={onCepChange}
            maxLength={9}
            containerStyle={styles.flex1}
          />
          <Pressable style={styles.locBtn} onPress={useMyLocation} disabled={locating}>
            {locating ? (
              <ActivityIndicator size="small" color={colors.textOnBrand} />
            ) : (
              <Ionicons name="navigate" size={18} color={colors.textOnBrand} />
            )}
          </Pressable>
        </View>
        <Button label="Buscar" icon="search" onPress={() => runSearch(sort, dir)} />
      </View>

      <View style={styles.resultsHeader}>
        <Text style={typography.sectionTitle}>Ordenar</Text>
        <View style={styles.sortRow}>
          <SortPill
            label="Preço"
            active={sort === 'price'}
            dir={dir}
            onPress={() => changeSort('price')}
          />
          <SortPill
            label="Avaliação"
            active={sort === 'rating'}
            dir={dir}
            onPress={() => changeSort('rating')}
          />
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
          <Text style={styles.empty}>Nenhum transportador encontrado.</Text>
        </Card>
      ) : (
        <>
          {hasRef && nearby.length > 0 ? (
            <>
              <View style={styles.groupHeader}>
                <Ionicons name="location" size={15} color={colors.brandDark} />
                <Text style={styles.groupTitle}>Perto de você</Text>
              </View>
              <View style={styles.list}>
                {nearby.map((t) => (
                  <ResultCard key={t.id} transporter={t} />
                ))}
              </View>
            </>
          ) : null}

          {others.length > 0 ? (
            <>
              <View style={styles.groupHeader}>
                <Ionicons name="apps-outline" size={15} color={colors.textSecondary} />
                <Text style={styles.groupTitle}>
                  {hasRef && nearby.length > 0 ? 'Outros no app' : 'Transportadores'}
                </Text>
              </View>
              <View style={styles.list}>
                {others.map((t) => (
                  <ResultCard key={t.id} transporter={t} />
                ))}
              </View>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function SortPill({
  label,
  active,
  dir,
  onPress,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onPress: () => void;
}) {
  const { colors, styles } = useThemedScreen(createStyles);
  return (
    <Pressable onPress={onPress} style={[styles.sortPill, active && styles.sortPillActive]}>
      <Text style={[styles.sortText, active && styles.sortTextActive]}>{label}</Text>
      <Ionicons
        name={active ? (dir === 'asc' ? 'arrow-up' : 'arrow-down') : 'swap-vertical'}
        size={13}
        color={active ? colors.textOnBrand : colors.textSecondary}
      />
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
            {transporter.schools.length > 0 ? transporter.schools.join(' • ') : 'Escolas a definir'}
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
    cepRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
    flex1: { flex: 1 },
    locBtn: {
      width: 50,
      height: 50,
      borderRadius: radius.md,
      backgroundColor: colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
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
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: spacing.md,
      marginTop: spacing.sm,
    },
    groupTitle: { fontSize: 13, fontWeight: '800', color: colors.textPrimary },
    center: { paddingTop: spacing.xxxl, alignItems: 'center' },
    empty: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
    list: { gap: spacing.md, marginBottom: spacing.lg },
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
