import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, LeafletMap, MapPlaceholder, Screen } from '@/components';
import { MapPoint } from '@/components/ui/LeafletMap';
import { useAppState } from '@/context/AppState';
import { useLocationBroadcast } from '@/hooks/useLocationBroadcast';
import { getMyRoute, optimizeMyRoute } from '@/api/tracking';
import { ApiRouteStop } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

const stopBadge: Record<ApiRouteStop['status'], { label: string; tone: 'success' | 'danger' | 'neutral' }> = {
  GOING: { label: 'VAI', tone: 'success' },
  NOT_GOING: { label: 'NÃO VAI', tone: 'danger' },
  SCHOOL: { label: 'DESTINO', tone: 'neutral' },
};

function toMapPoint(stop: ApiRouteStop): MapPoint | null {
  if (stop.latitude == null || stop.longitude == null) return null;
  const kind: MapPoint['kind'] =
    stop.status === 'SCHOOL' ? 'school' : stop.status === 'NOT_GOING' ? 'inactive' : 'pickup';
  return {
    id: stop.id,
    latitude: stop.latitude,
    longitude: stop.longitude,
    label: stop.label,
    order: stop.status === 'SCHOOL' ? undefined : stop.position,
    kind,
  };
}

/** Rota do dia com mapa, posição ao vivo do transportador e otimização. */
export default function RoutesScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [stops, setStops] = useState<ApiRouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Envia a localização do aparelho do transportador para a API.
  const { current, permission } = useLocationBroadcast(token, true);

  const loadRoute = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const data = await getMyRoute(token);
      setStops(data);
    } catch (err: any) {
      setError(err?.message ?? 'Não foi possível carregar a rota.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRoute();
  }, [loadRoute]);

  async function handleOptimize() {
    if (!token) return;
    setOptimizing(true);
    try {
      setError(null);
      const data = await optimizeMyRoute(token);
      setStops(data);
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao otimizar a rota.');
    } finally {
      setOptimizing(false);
    }
  }

  const points = stops.map(toMapPoint).filter((p): p is MapPoint => p !== null);
  const hasGeo = points.length > 0;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={typography.screenTitle}>Rota do Dia</Text>
        <View style={styles.dateChip}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.dateText}>Hoje</Text>
        </View>
      </View>

      <View style={styles.mapWrap}>
        {hasGeo ? (
          <LeafletMap
            points={points}
            live={current ? { ...current, label: 'Você' } : null}
            drawPath
            height={200}
          />
        ) : (
          <MapPlaceholder label={loading ? 'Carregando mapa…' : 'Sem paradas com localização'} height={200} />
        )}
        <Button
          label="Otimizar Rota"
          icon="navigate"
          onPress={handleOptimize}
          loading={optimizing}
          style={styles.optimizeBtn}
        />
      </View>

      {permission === 'denied' ? (
        <Text style={styles.warn}>
          Localização desativada — ative para aparecer no mapa dos responsáveis.
        </Text>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : (
        <View style={styles.list}>
          {stops.map((stop, index) => {
            const badge = stopBadge[stop.status];
            const isSchool = stop.status === 'SCHOOL';
            return (
              <Card key={stop.id} style={styles.stopCard}>
                <View style={[styles.indexCircle, isSchool ? styles.indexSchool : styles.indexDefault]}>
                  {isSchool ? (
                    <Ionicons name="flag" size={14} color={colors.textOnBrand} />
                  ) : (
                    <Text style={styles.indexText}>{index + 1}</Text>
                  )}
                </View>
                <View style={styles.stopInfo}>
                  <Text style={styles.stopName}>{stop.label}</Text>
                  <Text style={styles.stopAddress}>{stop.address}</Text>
                </View>
                <Badge label={badge.label} tone={badge.tone} />
              </Card>
            );
          })}
        </View>
      )}

      <Text style={styles.footnote}>
        Rota otimizada a partir da sua posição atual (parada mais próxima primeiro), com a escola como destino final.
      </Text>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  dateText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  mapWrap: {
    position: 'relative',
    marginBottom: spacing.lg,
  },
  optimizeBtn: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    height: 40,
    paddingHorizontal: spacing.lg,
  },
  warn: {
    fontSize: 12,
    color: colors.warning,
    marginBottom: spacing.sm,
  },
  error: {
    fontSize: 12,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  loader: {
    marginVertical: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  stopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  indexCircle: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexDefault: {
    backgroundColor: colors.brandSoft,
  },
  indexSchool: {
    backgroundColor: colors.brand,
  },
  indexText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stopInfo: {
    flex: 1,
    gap: 2,
  },
  stopName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stopAddress: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  footnote: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 16,
  },
});
