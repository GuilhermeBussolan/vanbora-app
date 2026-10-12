import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, SectionTitle } from '@/components';
import { useAppState } from '@/context/AppState';
import { cancelTripRun, finishTripRun, listTrips, startTrip } from '@/api/trips';
import { listChecklists } from '@/api/checklists';
import { formatDate, formatTime } from '@/lib/dateFormat';
import { SafetyChecklistDto, TripDto, TripRunDto } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

const runBadge: Record<TripRunDto['status'], { label: string; tone: 'success' | 'warning' | 'neutral' }> = {
  IN_PROGRESS: { label: 'EM ANDAMENTO', tone: 'warning' },
  COMPLETED: { label: 'ENCERRADO', tone: 'success' },
  CANCELLED: { label: 'CANCELADO', tone: 'neutral' },
};

interface TripsSectionProps {
  /** Mostra o atalho "Gerenciar" (só o transportador cadastra percursos). */
  manageable?: boolean;
}

/**
 * Percursos do usuário (transportador: todos; monitor: os escalados) com iniciar/encerrar e
 * os checklists de segurança pendentes. Encerrar leva direto ao checklist pós-percurso.
 */
export function TripsSection({ manageable = false }: TripsSectionProps) {
  const { colors, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [trips, setTrips] = useState<TripDto[]>([]);
  const [pending, setPending] = useState<SafetyChecklistDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!token) return;
    Promise.all([listTrips(token), listChecklists(token, 'PENDING')])
      .then(([t, c]) => {
        setTrips(t);
        setPending(c);
        setError(null);
      })
      .catch((err) => setError(err?.message ?? 'Falha ao carregar os percursos.'))
      .finally(() => setLoading(false));
  }, [token]);

  useFocusEffect(load);

  async function run(tripId: number, action: () => Promise<TripRunDto>, openChecklist = false) {
    setBusyId(tripId);
    setError(null);
    try {
      const result = await action();
      if (openChecklist && result.checklistId != null && result.checklistStatus === 'PENDING') {
        router.push(`/safety-checklist/${result.checklistId}`);
      }
      load();
    } catch (err: any) {
      setError(err?.message ?? 'Não foi possível atualizar o percurso.');
      load();
    } finally {
      setBusyId(null);
    }
  }

  function confirmFinish(trip: TripDto, runId: number) {
    Alert.alert(
      'Encerrar percurso',
      `Encerrar "${trip.name}"? Em seguida será aberta a verificação de segurança da van.`,
      [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Encerrar', onPress: () => run(trip.id, () => finishTripRun(token!, runId), true) },
      ],
    );
  }

  function confirmCancel(trip: TripDto, runId: number) {
    Alert.alert(
      'Cancelar percurso',
      `O percurso "${trip.name}" não aconteceu? Cancelado, ele não gera checklist.`,
      [
        { text: 'Voltar', style: 'cancel' },
        {
          text: 'Cancelar percurso',
          style: 'destructive',
          onPress: () => run(trip.id, () => cancelTripRun(token!, runId)),
        },
      ],
    );
  }

  return (
    <View>
      <SectionTitle
        title="Percursos"
        actionLabel={manageable ? 'Gerenciar' : undefined}
        onAction={() => router.push('/trips')}
        style={styles.header}
      />

      {pending.map((c) => (
        <Pressable key={c.id} onPress={() => router.push(`/safety-checklist/${c.id}`)}>
          <Card style={styles.pendingCard}>
            <Ionicons name="warning-outline" size={20} color={colors.warning} />
            <View style={styles.flex1}>
              <Text style={styles.pendingTitle}>⚠️ Verificação de segurança pendente</Text>
              <Text style={styles.pendingText}>
                {c.tripName} • encerrado {formatDate(c.tripFinishedAt)} às {formatTime(c.tripFinishedAt)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Card>
        </Pressable>
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : trips.length === 0 ? (
        <Card>
          <Text style={styles.empty}>
            {manageable
              ? 'Nenhum percurso cadastrado. Cadastre os percursos para escalar monitores e registrar o checklist de segurança.'
              : 'Você ainda não foi escalado em nenhum percurso.'}
          </Text>
          {manageable ? (
            <Button
              label="Cadastrar percurso"
              variant="outline"
              icon="add"
              onPress={() => router.push('/edit-trip')}
              style={styles.emptyBtn}
            />
          ) : null}
        </Card>
      ) : (
        <View style={styles.list}>
          {trips.map((trip) => {
            const current = trip.currentRun;
            const running = current?.status === 'IN_PROGRESS';
            const badge = current ? runBadge[current.status] : null;
            const busy = busyId === trip.id;
            return (
              <Card key={trip.id}>
                <View style={styles.tripTop}>
                  <View style={styles.flex1}>
                    <Text style={styles.tripName}>{trip.name}</Text>
                    <Text style={styles.tripMeta}>
                      {trip.studentCount} aluno(s) •{' '}
                      {trip.monitors.length > 0
                        ? `Monitor: ${trip.monitors.map((m) => m.name).join(', ')}`
                        : 'Sem monitor'}
                    </Text>
                  </View>
                  {badge ? <Badge label={badge.label} tone={badge.tone} /> : null}
                </View>

                {current && running ? (
                  <Text style={styles.runInfo}>
                    Iniciado às {formatTime(current.startedAt)}
                    {current.startedByName ? ` por ${current.startedByName}` : ''}
                  </Text>
                ) : null}

                {current?.status === 'COMPLETED' && current.checklistId != null ? (
                  <Pressable onPress={() => router.push(`/safety-checklist/${current.checklistId}`)}>
                    <View style={styles.checkRow}>
                      <Ionicons
                        name={current.checklistStatus === 'COMPLETED' ? 'checkmark-circle' : 'alert-circle'}
                        size={16}
                        color={current.checklistStatus === 'COMPLETED' ? colors.success : colors.warning}
                      />
                      <Text style={styles.checkText}>
                        {current.checklistStatus === 'COMPLETED'
                          ? 'Verificação concluída — ver detalhes'
                          : 'Verificação de segurança pendente'}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    </View>
                  </Pressable>
                ) : null}

                <View style={styles.actions}>
                  {running && current ? (
                    <>
                      <Button
                        label="Encerrar percurso"
                        icon="flag-outline"
                        onPress={() => confirmFinish(trip, current.id)}
                        loading={busy}
                        style={styles.flex1}
                      />
                      <Button
                        label="Cancelar"
                        variant="outline"
                        onPress={() => confirmCancel(trip, current.id)}
                        disabled={busy}
                        style={styles.cancelBtn}
                      />
                    </>
                  ) : (
                    <Button
                      label={current ? 'Iniciar novamente' : 'Iniciar percurso'}
                      variant={current ? 'outline' : 'primary'}
                      icon="play-outline"
                      onPress={() => run(trip.id, () => startTrip(token!, trip.id))}
                      loading={busy}
                      style={styles.flex1}
                    />
                  )}
                </View>
              </Card>
            );
          })}
        </View>
      )}

      <Pressable onPress={() => router.push('/safety-checklists')} style={styles.historyLink} hitSlop={6}>
        <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.historyText}>Histórico de verificações</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  header: { marginBottom: spacing.md },
  flex1: { flex: 1 },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderColor: colors.warning,
    backgroundColor: colors.warningBg,
    marginBottom: spacing.md,
  },
  pendingTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  pendingText: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  error: { fontSize: 13, color: colors.danger, marginBottom: spacing.sm },
  loader: { marginVertical: spacing.lg },
  empty: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  emptyBtn: { marginTop: spacing.md },
  list: { gap: spacing.md },
  tripTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  tripName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  tripMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  runInfo: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  cancelBtn: { paddingHorizontal: spacing.lg, borderRadius: radius.md },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  historyText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textSecondary },
});
