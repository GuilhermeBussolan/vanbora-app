import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, MapPlaceholder, Screen, VanboraMap } from '@/components';
import { MapPoint } from '@/components/ui/VanboraMap';
import { useAppState } from '@/context/AppState';
import { useLocationBroadcast } from '@/hooks/useLocationBroadcast';
import { getLocationSharing, getMyRoute, optimizeMyRoute } from '@/api/tracking';
import { describeNextWindow } from '@/lib/locationSchedule';
import { openRouteInMaps, openStopInMaps } from '@/lib/navigation';
import { ApiRouteStop, LocationSharingDto } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

const stopBadge: Record<ApiRouteStop['status'], { label: string; tone: 'success' | 'danger' | 'neutral' }> = {
  GOING: { label: 'VAI', tone: 'success' },
  NOT_GOING: { label: 'NÃO VAI', tone: 'danger' },
  SCHOOL: { label: 'DESTINO', tone: 'neutral' },
};

/** `activePickups` já traz só quem vai hoje, na ordem ativa — o índice nessa lista
 *  (não `stop.position`, que é a posição base/permanente) é o número exibido. */
function toMapPoint(stop: ApiRouteStop, activePickups: ApiRouteStop[]): MapPoint | null {
  if (stop.latitude == null || stop.longitude == null) return null;
  const kind: MapPoint['kind'] =
    stop.status === 'SCHOOL' ? 'school' : stop.status === 'NOT_GOING' ? 'inactive' : 'pickup';
  const activeIdx = kind === 'pickup' ? activePickups.findIndex((s) => s.id === stop.id) : -1;
  return {
    id: stop.id,
    latitude: stop.latitude,
    longitude: stop.longitude,
    label: stop.label,
    order: activeIdx >= 0 ? activeIdx + 1 : undefined,
    kind,
  };
}

/** Rota do dia com mapa, posição ao vivo do transportador e otimização. */
export default function RoutesScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [stops, setStops] = useState<ApiRouteStop[]>([]);
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharing, setSharing] = useState<LocationSharingDto | null>(null);

  // Compartilha a localização respeitando o interruptor mestre + a agenda.
  const { current, permission, active } = useLocationBroadcast(token, sharing);

  // Recarrega a config de compartilhamento ao focar (reflete mudanças na tela de agenda).
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      if (token) {
        getLocationSharing(token)
          .then((s) => alive && setSharing(s))
          .catch(() => undefined);
      }
      return () => {
        alive = false;
      };
    }, [token]),
  );

  const loadRoute = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const data = await getMyRoute(token);
      setStops(data.stops);
      setRouteGeometry(data.routeGeometry);
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
      setStops(data.stops);
      setRouteGeometry(data.routeGeometry);
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao otimizar a rota.');
    } finally {
      setOptimizing(false);
    }
  }

  async function navigateRoute() {
    const ok = await openRouteInMaps(stops, current);
    if (!ok) setError('Não foi possível abrir o app de mapas para navegar.');
  }

  const activePickups = stops.filter((s) => s.status === 'GOING');
  const points = stops
    .map((s) => toMapPoint(s, activePickups))
    .filter((p): p is MapPoint => p !== null);
  const hasGeo = points.length > 0;
  const schoolStop = stops.find((s) => s.status === 'SCHOOL');
  const totalKm = schoolStop?.cumulativeKm ?? null;
  const schoolEta = schoolStop?.etaClock ?? null;

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
          <VanboraMap
            points={points}
            live={current ? { ...current, label: 'Você' } : null}
            drawPath
            routeGeometry={routeGeometry}
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

      {hasGeo ? (
        <Card style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Ionicons name="flag-outline" size={16} color={colors.brandDark} />
            <View>
              <Text style={styles.summaryLabel}>Chegada na escola</Text>
              <Text style={styles.summaryValue}>{schoolEta ? `~${schoolEta}` : '—'}</Text>
            </View>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Ionicons name="speedometer-outline" size={16} color={colors.brandDark} />
            <View>
              <Text style={styles.summaryLabel}>Distância total</Text>
              <Text style={styles.summaryValue}>{totalKm != null ? `${totalKm} km` : '—'}</Text>
            </View>
          </View>
        </Card>
      ) : null}

      {hasGeo ? (
        <Button
          label="Navegar rota (Maps)"
          icon="navigate-circle-outline"
          onPress={navigateRoute}
          style={styles.navigateBtn}
        />
      ) : null}

      <Pressable onPress={() => router.push('/location-sharing')}>
        <Card style={styles.shareCard}>
          <Ionicons
            name={active ? 'radio' : sharing?.enabled ? 'time-outline' : 'location-outline'}
            size={20}
            color={active ? colors.success : sharing?.enabled ? colors.warning : colors.textMuted}
          />
          <View style={styles.shareInfo}>
            <Text style={styles.shareTitle}>Compartilhamento de localização</Text>
            <Text
              style={[
                styles.shareStatus,
                { color: active ? colors.success : sharing?.enabled ? colors.warning : colors.textMuted },
              ]}
            >
              {active
                ? 'Compartilhando ao vivo'
                : sharing?.enabled
                  ? `Agendado${describeNextWindow(sharing) ? ` • próxima ${describeNextWindow(sharing)}` : ''}`
                  : 'Desligado — toque para configurar'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Card>
      </Pressable>

      {permission === 'denied' && active ? (
        <Text style={styles.warn}>
          Localização negada — permita o acesso para aparecer no mapa dos responsáveis.
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
            const isSkipped = stop.status === 'NOT_GOING';
            // Numeração só entre quem vai hoje — quem avisou falta não ocupa posição.
            const activeIdx = !isSchool && !isSkipped ? activePickups.findIndex((s) => s.id === stop.id) + 1 : null;
            return (
              <Card key={stop.id} style={isSkipped ? styles.stopCardSkipped : styles.stopCard}>
                <View
                  style={[
                    styles.indexCircle,
                    isSchool ? styles.indexSchool : isSkipped ? styles.indexSkipped : styles.indexDefault,
                  ]}
                >
                  {isSchool ? (
                    <Ionicons name="flag" size={14} color={colors.textOnBrand} />
                  ) : isSkipped ? (
                    <Ionicons name="close" size={14} color={colors.textMuted} />
                  ) : (
                    <Text style={styles.indexText}>{activeIdx}</Text>
                  )}
                </View>
                <View style={styles.stopInfo}>
                  <Text style={styles.stopName}>{stop.label}</Text>
                  <Text style={styles.stopAddress}>{stop.address}</Text>
                  {activeIdx != null && activePickups.length > 0 ? (
                    <Text style={styles.orderCaption}>
                      {activeIdx}º de {activePickups.length} hoje
                    </Text>
                  ) : null}
                  {stop.etaClock ? (
                    <View style={styles.etaRow}>
                      <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
                      <Text style={styles.etaText}>
                        chegada ~{stop.etaClock}
                        {stop.legDistanceKm != null && index > 0 ? ` • +${stop.legDistanceKm} km` : ''}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.stopRight}>
                  <Badge label={badge.label} tone={badge.tone} />
                  {stop.latitude != null && stop.longitude != null ? (
                    <Pressable
                      onPress={() => openStopInMaps(stop)}
                      hitSlop={8}
                      style={styles.stopNavBtn}
                      accessibilityLabel={`Navegar até ${stop.label}`}
                    >
                      <Ionicons name="navigate-outline" size={16} color={colors.brandDark} />
                    </Pressable>
                  ) : null}
                </View>
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
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  summaryLabel: { fontSize: 11, color: colors.textSecondary },
  summaryValue: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  navigateBtn: { marginBottom: spacing.lg },
  etaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  etaText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  stopRight: { alignItems: 'flex-end', gap: spacing.sm },
  stopNavBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  shareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  shareInfo: { flex: 1 },
  shareTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  shareStatus: { fontSize: 12, fontWeight: '600', marginTop: 2 },
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
  stopCardSkipped: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    opacity: 0.6,
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
  indexSkipped: {
    backgroundColor: colors.border,
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
  orderCaption: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
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
