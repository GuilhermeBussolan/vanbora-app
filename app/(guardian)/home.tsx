import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { getGuardianDashboard, GuardianDashboardDto } from '@/api/guardian';
import { cancelHireRequest, dismissHireRequest } from '@/api/hire';
import { listGuardianNotices, removeReaction, setReaction } from '@/api/notices';
import { GuardianNoticeDto, NOTICE_EMOJIS } from '@/types';
import { formatCurrency } from '@/data/mockData';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Dashboard do Responsável — por dependente: populado, em contratação ou vazio. */
export default function GuardianHomeScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { user, token, dependents, selectedDependentId, selectDependent } = useAppState();
  const [dashboard, setDashboard] = useState<GuardianDashboardDto | null>(null);
  const [notices, setNotices] = useState<GuardianNoticeDto[]>([]);

  const reloadDashboard = useCallback(() => {
    if (!token) return;
    getGuardianDashboard(token, selectedDependentId)
      .then(setDashboard)
      .catch(() => setDashboard(null));
  }, [token, selectedDependentId]);

  useFocusEffect(reloadDashboard);

  async function handleCancelHire(id: number) {
    if (!token) return;
    try {
      await cancelHireRequest(token, id);
      reloadDashboard();
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível cancelar a solicitação.');
    }
  }

  async function handleDismissRejected(id: number) {
    if (!token) return;
    try {
      await dismissHireRequest(token, id);
      reloadDashboard();
    } catch {
      /* ignora */
    }
  }

  // Avisos do responsável — alimentam tanto o sino quanto os cards "novos" da home.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (token) {
        listGuardianNotices(token)
          .then((list) => active && setNotices(list))
          .catch(() => active && setNotices([]));
      }
      return () => {
        active = false;
      };
    }, [token]),
  );

  // "Novos" = ainda não abertos, reagidos nem comentados pelo responsável.
  const newNotices = notices.filter((n) => !n.acknowledged);

  async function handleReact(notice: GuardianNoticeDto, emoji: string) {
    if (!token) return;
    try {
      const updated =
        notice.myReaction === emoji
          ? await removeReaction(token, notice.id)
          : await setReaction(token, notice.id, emoji);
      setNotices((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
    } catch {
      /* ignora */
    }
  }

  return (
    <Screen>
      <View style={styles.headerRow}>
        <Text style={[typography.screenTitle, styles.greetingFlex]} numberOfLines={1}>
          {greeting()}, {user?.name ?? ''}
        </Text>
        <NoticeBell count={newNotices.length} />
      </View>

      <NewNoticesSection notices={newNotices} onReact={handleReact} />

      {dependents.length > 1 ? (
        <View style={styles.switcher}>
          {dependents.map((d) => {
            const sel = d.id === selectedDependentId;
            return (
              <Pressable
                key={d.id}
                onPress={() => selectDependent(d.id)}
                style={[styles.depChip, sel && styles.depChipSel]}
              >
                <Ionicons
                  name="person-circle"
                  size={18}
                  color={sel ? colors.textOnBrand : colors.textSecondary}
                />
                <Text style={[styles.depChipText, sel && styles.depChipTextSel]}>
                  {firstName(d.name)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {dashboard?.hasTransporter ? (
        <PopulatedDashboard dashboard={dashboard} />
      ) : dashboard?.pendingContractId ? (
        <PendingContractCard dashboard={dashboard} />
      ) : dashboard?.pendingHireRequestId ? (
        <PendingHireCard dashboard={dashboard} onCancel={handleCancelHire} />
      ) : dashboard?.rejectedHireRequestId ? (
        <RejectedHireCard dashboard={dashboard} onDismiss={handleDismissRejected} />
      ) : (
        <EmptyDashboard dependentName={dashboard?.studentName ?? null} />
      )}

      <Pressable style={styles.cancelledLink} onPress={() => router.push('/cancelled-contracts')}>
        <Ionicons name="close-circle-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.cancelledLinkText}>Ver contratos cancelados</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </Pressable>
    </Screen>
  );
}

function firstName(name: string): string {
  return name.split(' ')[0];
}

/** Card: contrato liberado para o dependente selecionado, aguardando assinatura. */
function PendingContractCard({ dashboard }: { dashboard: GuardianDashboardDto }) {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  return (
    <Pressable onPress={() => router.push(`/contract/${dashboard.pendingContractId}`)}>
      <Card style={styles.contractBanner}>
        <Ionicons name="document-text-outline" size={22} color={colors.brandDark} />
        <View style={styles.bannerBody}>
          <Text style={styles.bannerTitle}>Contrato para assinar</Text>
          <Text style={styles.bannerText}>
            {dashboard.studentName ? `${dashboard.studentName} está em fase de contratação. ` : ''}
            Toque para revisar e assinar.
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Card>
    </Pressable>
  );
}

/** Rótulo "expira em X" a partir da data ISO de expiração. */
function expiresInLabel(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'Expirando…';
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `Expira em ${days} dia${days > 1 ? 's' : ''}`;
  }
  if (hours >= 1) return `Expira em ${hours} h`;
  return `Expira em ${Math.max(1, Math.floor(ms / 60_000))} min`;
}

/** Card: solicitação enviada, aguardando o transportador aceitar (com cancelar). */
function PendingHireCard({
  dashboard,
  onCancel,
}: {
  dashboard: GuardianDashboardDto;
  onCancel: (id: number) => void;
}) {
  const { colors, styles } = useThemedScreen(createStyles);
  const id = dashboard.pendingHireRequestId as number;
  const name = dashboard.pendingHireTransporterName ?? 'o transportador';
  const student = dashboard.studentName ? firstName(dashboard.studentName) : null;

  function confirmCancel() {
    Alert.alert(
      'Cancelar solicitação',
      `Deseja cancelar a solicitação para ${name}? Você poderá enviar para outro transportador.`,
      [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Cancelar solicitação', style: 'destructive', onPress: () => onCancel(id) },
      ],
    );
  }

  return (
    <Card style={styles.hirePendingCard}>
      <View style={styles.hireHeader}>
        <View style={styles.hireIcon}>
          <Ionicons name="hourglass-outline" size={20} color={colors.brandDark} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.hireTitle}>Solicitação enviada</Text>
          <Text style={styles.hireText}>
            Aguardando {name} aceitar{student ? ` o transporte de ${student}` : ''}.
          </Text>
        </View>
      </View>
      <View style={styles.hireMetaRow}>
        <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
        <Text style={styles.hireMeta}>
          {dashboard.pendingHireExpiresAt
            ? `${expiresInLabel(dashboard.pendingHireExpiresAt)} — cancela sozinha se não houver resposta`
            : 'Válida por 3 dias — cancela sozinha se não houver resposta'}
        </Text>
      </View>
      <Button
        label="Cancelar solicitação"
        variant="outline"
        icon="close-circle-outline"
        onPress={confirmCancel}
        style={styles.hireBtn}
      />
    </Card>
  );
}

/** Card: solicitação recusada pelo transportador (dispensar / buscar outro). */
function RejectedHireCard({
  dashboard,
  onDismiss,
}: {
  dashboard: GuardianDashboardDto;
  onDismiss: (id: number) => void;
}) {
  const { colors, styles } = useThemedScreen(createStyles);
  const id = dashboard.rejectedHireRequestId as number;
  const name = dashboard.rejectedHireTransporterName ?? 'O transportador';

  return (
    <Card style={styles.hireRejectedCard}>
      <View style={styles.hireHeader}>
        <View style={styles.hireIconDanger}>
          <Ionicons name="close" size={20} color={colors.danger} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.hireTitle}>Solicitação recusada</Text>
          <Text style={styles.hireText}>
            {name} não aceitou a solicitação. Você pode buscar outro transportador.
          </Text>
        </View>
      </View>
      <View style={styles.hireActions}>
        <Button
          label="Dispensar"
          variant="outline"
          onPress={() => onDismiss(id)}
          style={styles.hireActionBtn}
        />
        <Button
          label="Buscar outro"
          icon="search"
          onPress={() => router.push('/(guardian)/search')}
          style={styles.hireActionBtn}
        />
      </View>
    </Card>
  );
}

/** Sino de avisos no topo da home: badge com a contagem de avisos novos. */
function NoticeBell({ count }: { count: number }) {
  const { colors, styles } = useThemedScreen(createStyles);
  return (
    <Pressable
      onPress={() => router.push('/guardian-notices')}
      hitSlop={8}
      style={styles.bell}
      accessibilityLabel={`Avisos${count > 0 ? `, ${count} novo${count > 1 ? 's' : ''}` : ''}`}
    >
      <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
      {count > 0 ? (
        <View style={styles.bellBadge}>
          <Text style={styles.bellBadgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

/** Avisos novos (não lidos) empilhados na home; cada um abre em tela cheia e reage inline. */
function NewNoticesSection({
  notices,
  onReact,
}: {
  notices: GuardianNoticeDto[];
  onReact: (notice: GuardianNoticeDto, emoji: string) => void;
}) {
  const { colors, styles } = useThemedScreen(createStyles);
  if (notices.length === 0) return null;

  return (
    <View style={styles.noticesWrap}>
      {notices.map((notice) => (
        <Card key={notice.id} style={styles.noticeCard}>
          <Pressable onPress={() => router.push(`/notice/${notice.id}`)}>
            <View style={styles.noticeHeader}>
              <Ionicons name="megaphone-outline" size={18} color={colors.brandDark} />
              <Text style={styles.noticeTitle}>Aviso do Transportador</Text>
              <View style={styles.flex} />
              <View style={styles.newTag}>
                <Text style={styles.newTagText}>NOVO</Text>
              </View>
            </View>
            {notice.title ? (
              <Text style={styles.noticeCardTitle} numberOfLines={1}>
                {notice.title}
              </Text>
            ) : null}
            <Text style={styles.noticeMessage} numberOfLines={notice.title ? 2 : 3}>
              {notice.message}
            </Text>
          </Pressable>

          <View style={styles.reactionRow}>
            {NOTICE_EMOJIS.map((emoji) => {
              const selected = notice.myReaction === emoji;
              return (
                <Pressable
                  key={emoji}
                  onPress={() => onReact(notice, emoji)}
                  style={[styles.reactionBtn, selected && styles.reactionBtnSelected]}
                >
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>
      ))}
    </View>
  );
}

function PopulatedDashboard({ dashboard }: { dashboard: GuardianDashboardDto }) {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const next = dashboard.nextPayment;
  const firstName = dashboard.studentName?.split(' ')[0] ?? 'Seu filho';
  const todayISO = localTodayISO();
  const going = dashboard.goingToday;

  return (
    <View style={styles.body}>
      {dashboard.reviewDue && dashboard.transporterId ? (
        <Pressable
          onPress={() =>
            router.push({
              pathname: '/review-transporter',
              params: {
                transporterId: String(dashboard.transporterId),
                name: dashboard.transporterName ?? '',
                skippable: '1',
              },
            })
          }
        >
          <Card style={styles.reviewBanner}>
            <Ionicons name="star" size={22} color={colors.brandDark} />
            <View style={styles.flex}>
              <Text style={styles.bannerTitle}>Como está a experiência?</Text>
              <Text style={styles.bannerText}>
                Avalie {firstNameOfTransporter(dashboard.transporterName)} — leva 10 segundos.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Card>
        </Pressable>
      ) : null}

      {/* Hoje — vai ou não vai + atalho para avisar falta */}
      <Card>
        <View style={styles.todayRow}>
          <View
            style={[
              styles.todayBadge,
              going === false ? styles.todayBadgeAbsent : styles.todayBadgePresent,
            ]}
          >
            <Ionicons
              name={going === false ? 'close' : going == null ? 'cafe-outline' : 'bus'}
              size={20}
              color={going === false ? colors.danger : colors.textOnBrand}
            />
          </View>
          <View style={styles.flex}>
            <Text style={styles.todayLabel}>Hoje</Text>
            <Text style={styles.todayStatus}>
              {going == null
                ? 'Sem transporte hoje'
                : going
                  ? `${firstName} vai à escola`
                  : `${firstName} não vai hoje`}
            </Text>
          </View>
        </View>
        <Button
          label="Avisar falta"
          variant="outline"
          icon="calendar-outline"
          onPress={() => router.push('/report-absence')}
          style={styles.avisarBtn}
        />
      </Card>

      {/* Presença da semana (real) — toca para ver o histórico por semana */}
      <Pressable onPress={() => router.push('/attendance-history')}>
        <Card>
          <View style={styles.attendanceHeader}>
            <Text style={typography.sectionTitle}>Presença da Semana</Text>
            <View style={styles.seeHistory}>
              <Text style={styles.seeHistoryText}>Histórico</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.brandDark} />
            </View>
          </View>
          <View style={styles.daysRow}>
            {dashboard.weekAttendance.map((d) => {
              const isToday = d.date === todayISO;
              return (
                <View key={d.day} style={styles.dayItem}>
                  <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{d.day}</Text>
                  <View
                    style={[
                      styles.dayCircle,
                      d.present ? styles.dayPresent : styles.dayAbsent,
                      isToday && styles.dayToday,
                    ]}
                  >
                    <Ionicons
                      name={d.present ? 'checkmark' : 'close'}
                      size={16}
                      color={d.present ? colors.textOnBrand : colors.danger}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        </Card>
      </Pressable>

      {/* Próximo pagamento — sempre mostra a data; "Ver todos" abre o cronograma */}
      <Card>
        <View style={styles.paymentRow}>
          <View style={styles.paymentInfo}>
            <View style={styles.paymentLabelRow}>
              <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.paymentLabel}>
                {next?.payable ? 'Próximo Pagamento' : 'Próxima Mensalidade'}
              </Text>
            </View>
            {next ? (
              <>
                <Text style={styles.paymentValue}>{formatCurrency(next.amount)}</Text>
                <Text style={styles.paymentDue}>
                  {formatRefMonth(next.referenceMonth)}
                  {next.dueDate ? ` • vence ${formatDate(next.dueDate)}` : ''}
                </Text>
                {next.status === 'OVERDUE' ? (
                  <Text style={styles.overdueTag}>Em atraso</Text>
                ) : !next.payable ? (
                  <Text style={styles.okTag}>Tudo em dia 🎉</Text>
                ) : null}
              </>
            ) : (
              <>
                <Text style={styles.paymentValue}>Em dia</Text>
                <Text style={styles.paymentDue}>Nenhuma mensalidade pendente.</Text>
              </>
            )}
          </View>
          <Button
            label={next?.payable ? 'Pagar' : 'Ver todos'}
            variant={next?.payable ? 'primary' : 'outline'}
            onPress={() => router.push('/payments')}
            style={styles.payBtn}
          />
        </View>
      </Card>
    </View>
  );
}

/** Primeiro nome do transportador (ou um rótulo genérico). */
function firstNameOfTransporter(name: string | null): string {
  return name?.split(' ')[0] ?? 'o transportador';
}

/** Data de hoje no fuso local em ISO (YYYY-MM-DD), sem o deslocamento UTC. */
function localTodayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function EmptyDashboard({ dependentName }: { dependentName: string | null }) {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="bus-outline" size={42} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>
        {dependentName
          ? `${firstName(dependentName)} ainda não tem um transportador.`
          : 'Você ainda não tem um transportador contratado.'}
      </Text>
      <Text style={styles.emptyText}>
        Encontre o transporte ideal e acompanhe tudo pelo aplicativo.
      </Text>
      <Button
        label="Buscar Transportador"
        icon="search"
        onPress={() => router.push('/(guardian)/search')}
        style={styles.emptyBtn}
      />
    </View>
  );
}

/** "2026-06" → "Junho 2026". */
function formatRefMonth(ym: string): string {
  const [year, month] = ym.split('-');
  const names = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ];
  const idx = Number(month) - 1;
  return idx >= 0 && idx < 12 ? `${names[idx]} ${year}` : ym;
}

/** "2026-06-10" → "10/06". */
function formatDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return d && m ? `${d}/${m}` : iso;
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  cancelledLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.xxl,
    paddingVertical: spacing.md,
  },
  cancelledLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  greetingFlex: {
    flex: 1,
  },
  bell: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textOnBrand,
  },
  noticesWrap: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  newTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
  },
  newTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: colors.textOnBrand,
  },
  switcher: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  depChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  depChipSel: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  depChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  depChipTextSel: {
    color: colors.textOnBrand,
  },
  banners: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  contractBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  hirePendingCard: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  hireRejectedCard: {
    backgroundColor: colors.dangerBg,
    borderColor: colors.danger,
  },
  hireHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  hireIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hireIconDanger: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hireTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  hireText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  hireMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  hireMeta: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  hireBtn: {
    marginTop: spacing.lg,
    height: 44,
    borderColor: colors.danger,
  },
  hireActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  hireActionBtn: {
    flex: 1,
    height: 44,
  },
  reviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  bannerBody: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  bannerText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  body: {
    gap: spacing.lg,
  },
  noticeCard: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  flex: {
    flex: 1,
  },
  reactionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  reactionBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reactionBtnSelected: {
    borderColor: colors.brand,
    borderWidth: 2,
  },
  reactionEmoji: {
    fontSize: 18,
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
    color: colors.textSecondary,
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  todayBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBadgePresent: {
    backgroundColor: colors.brand,
  },
  todayBadgeAbsent: {
    backgroundColor: colors.dangerBg,
  },
  todayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  todayStatus: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 2,
  },
  avisarBtn: {
    marginTop: spacing.lg,
    height: 44,
  },
  okTag: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
    marginTop: 4,
  },
  overdueTag: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.danger,
    marginTop: 4,
  },
  dayToday: {
    borderWidth: 2,
    borderColor: colors.textPrimary,
  },
  dayLabelToday: {
    color: colors.textPrimary,
    fontWeight: '800',
  },
  attendanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  seeHistory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeHistoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.brandDark,
  },
  studentName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayItem: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPresent: {
    backgroundColor: colors.brand,
  },
  dayAbsent: {
    backgroundColor: colors.dangerBg,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paymentLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  paymentValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4,
  },
  paymentDue: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  payBtn: {
    height: 44,
    paddingHorizontal: spacing.xl,
  },
  empty: {
    alignItems: 'center',
    paddingTop: spacing.xxxl * 2,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 19,
    paddingHorizontal: spacing.lg,
  },
  emptyBtn: {
    marginTop: spacing.xxl,
    alignSelf: 'stretch',
  },
});
