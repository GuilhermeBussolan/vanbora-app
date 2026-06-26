import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Card, LeafletMap, MapPlaceholder, Screen } from '@/components';
import { MapPoint } from '@/components/ui/LeafletMap';
import { useAppState } from '@/context/AppState';
import { getGuardianTracking } from '@/api/tracking';
import { ApiRouteStop, GuardianTracking } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

const POLL_MS = 5000;

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

/** Formata "atualizado há Xs/min" a partir de um ISO timestamp. */
function timeAgo(iso: string | null): string {
  if (!iso) return 'sem dados de posição';
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `atualizado há ${seconds}s`;
  const minutes = Math.round(seconds / 60);
  return `atualizado há ${minutes} min`;
}

/** Rastreamento em tempo real: posição do transportador no mapa (polling). */
export default function TrackingScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token, selectedDependentId } = useAppState();
  const [tracking, setTracking] = useState<GuardianTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function poll() {
      try {
        const data = await getGuardianTracking(token!, selectedDependentId);
        if (!cancelled) {
          setTracking(data);
          setError(null);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? 'Falha ao atualizar posição.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_MS);
    // Atualiza o texto "há Xs" a cada segundo, mesmo entre polls.
    const ticker = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
      clearInterval(ticker);
    };
  }, [token, selectedDependentId]);

  // Apenas a parada do próprio dependente + a escola (privacidade).
  const ownStops = [tracking?.myStop, tracking?.schoolStop].filter(
    (s): s is ApiRouteStop => s != null,
  );
  const points = ownStops.map(toMapPoint).filter((p): p is MapPoint => p !== null);
  const live =
    tracking?.latitude != null && tracking?.longitude != null
      ? { latitude: tracking.latitude, longitude: tracking.longitude, label: tracking.transporterName ?? 'Transportador' }
      : null;

  const orderText =
    tracking?.goingToday && tracking.myOrder && tracking.totalStops
      ? `Você é o ${tracking.myOrder}º embarque de ${tracking.totalStops} hoje`
      : tracking?.hasTransporter && tracking?.myStop && !tracking.goingToday
        ? 'Sem embarque marcado para hoje'
        : null;

  return (
    <Screen>
      <Text style={[typography.screenTitle, styles.title]}>Rastreamento</Text>

      {loading && !tracking ? (
        <MapPlaceholder label="Carregando mapa…" height={240} />
      ) : tracking && !tracking.hasTransporter ? (
        <Card style={styles.emptyCard}>
          <Ionicons name="bus-outline" size={30} color={colors.textMuted} />
          <Text style={styles.emptyText}>
            Você ainda não tem um transportador contratado para acompanhar.
          </Text>
        </Card>
      ) : (
        <>
          {live || points.length > 0 ? (
            <LeafletMap points={points} live={live} height={240} />
          ) : (
            <MapPlaceholder label="Transportador ainda não compartilhou a posição" height={240} />
          )}

          <Card style={styles.card}>
            <View style={styles.header}>
              <View style={styles.flex}>
                <Text style={styles.studentName}>{tracking?.studentName ?? 'Seu filho(a)'}</Text>
                <Text style={styles.transporter}>
                  Transportador: {tracking?.transporterName ?? '—'}
                </Text>
              </View>
              <Badge label={live ? 'AO VIVO' : 'OFFLINE'} tone={live ? 'success' : 'neutral'} />
            </View>

            {orderText ? (
              <View style={styles.orderRow}>
                <Ionicons name="list-outline" size={18} color={colors.brandDark} />
                <Text style={styles.orderText}>{orderText}</Text>
              </View>
            ) : null}

            <View style={styles.statusRow}>
              <Ionicons
                name={live ? 'navigate-circle' : 'time-outline'}
                size={18}
                color={live ? colors.success : colors.textMuted}
              />
              <Text style={styles.statusText}>{timeAgo(tracking?.updatedAt ?? null)}</Text>
            </View>
          </Card>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  title: {
    marginBottom: spacing.lg,
  },
  card: {
    marginTop: spacing.lg,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  transporter: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  orderText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  error: {
    fontSize: 12,
    color: colors.danger,
    marginTop: spacing.md,
  },
});
