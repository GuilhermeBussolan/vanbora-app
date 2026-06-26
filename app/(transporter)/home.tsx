import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Screen, SectionTitle } from '@/components';
import { useAppState } from '@/context/AppState';
import { listHireRequests, releaseContract, rejectHireRequest } from '@/api/hire';
import { listMyNotices } from '@/api/notices';
import { getDashboard, DashboardMetrics } from '@/api/dashboard';
import { HireRequestDto, TransporterNoticeDto } from '@/types';
import { currentTransporterName, formatCurrency } from '@/data/mockData';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Dashboard do Transportador: métricas do dia, solicitações e avisos recentes. */
export default function TransporterHomeScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token, user } = useAppState();
  const [requests, setRequests] = useState<HireRequestDto[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    if (!token) return;
    listHireRequests(token)
      .then(setRequests)
      .catch((err) => setError(err?.message ?? 'Falha ao carregar solicitações.'));
    getDashboard(token).then(setMetrics).catch(() => undefined);
  }, [token]);

  useFocusEffect(loadData);

  async function handleRelease(id: number) {
    if (!token) return;
    setBusyId(id);
    setError(null);
    try {
      await releaseContract(token, id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao liberar o contrato.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id: number) {
    if (!token) return;
    setBusyId(id);
    setError(null);
    try {
      await rejectHireRequest(token, id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao recusar.');
    } finally {
      setBusyId(null);
    }
  }

  const metricCards = [
    { label: 'Alunos hoje', value: metrics?.totalStudents ?? 0, tone: colors.textPrimary, filter: 'all' },
    { label: 'Confirmados', value: metrics?.confirmed ?? 0, tone: colors.success, filter: 'confirmed' },
    { label: 'Ausentes', value: metrics?.absent ?? 0, tone: colors.danger, filter: 'absent' },
  ];

  return (
    <Screen>
      <Text style={[typography.screenTitle, styles.greeting]}>
        Olá, {user?.name ?? currentTransporterName}
      </Text>

      <View style={styles.metrics}>
        {metricCards.map((m) => (
          <Pressable
            key={m.label}
            style={styles.metricPressable}
            onPress={() => router.push(`/students?filter=${m.filter}`)}
          >
            <Card style={styles.metricCard}>
              <Text style={[styles.metricValue, { color: m.tone }]}>{m.value}</Text>
              <Text style={styles.metricLabel}>{m.label}</Text>
              <View style={styles.metricHint}>
                <Text style={styles.metricHintText}>ver lista</Text>
                <Ionicons name="chevron-forward" size={11} color={colors.textMuted} />
              </View>
            </Card>
          </Pressable>
        ))}
      </View>

      <Card style={styles.churnCard}>
        <Ionicons name="close-circle-outline" size={18} color={colors.textSecondary} />
        <Text style={styles.churnLabel}>Contratos cancelados</Text>
        <Text style={styles.churnValue}>{metrics?.cancelledContracts ?? 0}</Text>
      </Card>

      <SectionTitle title="Solicitações de Contratação" style={styles.section} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <View style={styles.list}>
        {requests.length === 0 ? (
          <Card>
            <Text style={styles.empty}>Nenhuma solicitação pendente.</Text>
          </Card>
        ) : (
          requests.map((req) => (
            <Card key={req.id}>
              <Text style={styles.requestName}>{req.guardianName}</Text>
              <Text style={styles.requestDetail}>Aluno: {req.studentName}</Text>
              <View style={styles.requestMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="school-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{req.school}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{req.neighborhood}</Text>
                </View>
              </View>
              <View style={styles.requestMeta}>
                <View style={styles.metaItem}>
                  <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{req.guardianPhone}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="mail-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{req.guardianEmail}</Text>
                </View>
              </View>
              {req.proposedFee != null ? (
                <View style={styles.proposalBox}>
                  <Ionicons name="pricetag" size={14} color={colors.brandDark} />
                  <Text style={styles.proposalText}>
                    Proposta: <Text style={styles.proposalValue}>{formatCurrency(req.proposedFee)}/mês</Text>
                    {'  '}(tabela {formatCurrency(req.baseFee)})
                  </Text>
                </View>
              ) : (
                <Text style={styles.valueLine}>
                  Valor de tabela: {formatCurrency(req.baseFee)}/mês
                </Text>
              )}
              <View style={styles.requestActions}>
                <Button
                  label="Liberar contrato"
                  icon="document-text-outline"
                  onPress={() => handleRelease(req.id)}
                  loading={busyId === req.id}
                  style={styles.acceptBtn}
                />
                <Button
                  label="Recusar"
                  variant="outline"
                  onPress={() => handleReject(req.id)}
                  disabled={busyId === req.id}
                  style={styles.rejectBtn}
                />
              </View>
            </Card>
          ))
        )}
      </View>

      <SectionTitle
        title="Avisos Recentes"
        actionLabel="Gerenciar Avisos"
        onAction={() => router.push('/notices')}
        style={styles.section}
      />
      <RecentNoticeCard />
    </Screen>
  );
}

/** Aviso mais recente do transportador, clicável → detalhe/engajamento. */
function RecentNoticeCard() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [notice, setNotice] = useState<TransporterNoticeDto | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (token) {
        listMyNotices(token)
          .then((list) => active && setNotice(list[0] ?? null))
          .catch(() => active && setNotice(null))
          .finally(() => active && setLoaded(true));
      }
      return () => {
        active = false;
      };
    }, [token]),
  );

  if (loaded && !notice) {
    return (
      <Card>
        <Text style={styles.noticeMeta}>Nenhum aviso ainda.</Text>
      </Card>
    );
  }
  if (!notice) return null;

  return (
    <Pressable onPress={() => router.push(`/transporter-notice/${notice.id}`)}>
      <Card>
        <View style={styles.noticeTop}>
          {notice.priority === 'URGENT' ? (
            <View style={styles.urgentBadge}>
              <Ionicons name="alert-circle" size={12} color={colors.white} />
              <Text style={styles.urgentText}>Urgente</Text>
            </View>
          ) : null}
          <View style={styles.flexGrow} />
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </View>
        {notice.title ? (
          <Text style={styles.noticeCardTitle} numberOfLines={1}>
            {notice.title}
          </Text>
        ) : null}
        <Text style={styles.noticeMessage} numberOfLines={notice.title ? 2 : 3}>
          {notice.message}
        </Text>
        <Text style={styles.noticeMeta}>
          Visto por {notice.viewedCount} de {notice.recipients} • {notice.commentsCount} comentários
        </Text>
      </Card>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  greeting: {
    marginBottom: spacing.xl,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricPressable: {
    flex: 1,
  },
  metricCard: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  metricHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
    marginTop: 6,
  },
  metricHintText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  churnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  churnLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  churnValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  section: {
    marginTop: spacing.xl,
  },
  list: {
    gap: spacing.md,
  },
  error: {
    fontSize: 12,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  empty: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  requestName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  requestDetail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  requestMeta: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  proposalBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  proposalText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
  },
  proposalValue: {
    fontWeight: '800',
    color: colors.textPrimary,
  },
  valueLine: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  acceptBtn: {
    flex: 1,
    height: 44,
  },
  rejectBtn: {
    flex: 1,
    height: 44,
  },
  noticeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  flexGrow: {
    flex: 1,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  urgentText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  noticeCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  noticeMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  noticeMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});
