import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { listContracts } from '@/api/contracts';
import { getGuardianDashboard, GuardianDashboardDto } from '@/api/guardian';
import { listGuardianNotices, removeReaction, setReaction } from '@/api/notices';
import { ContractDto, GuardianNoticeDto, NOTICE_EMOJIS } from '@/types';
import { formatCurrency } from '@/data/mockData';
import { colors, radius, spacing, typography } from '@/theme';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Dashboard do Responsável — alterna entre estado vazio e populado (dados reais). */
export default function GuardianHomeScreen() {
  const { user, token } = useAppState();
  const [dashboard, setDashboard] = useState<GuardianDashboardDto | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (token) {
        getGuardianDashboard(token)
          .then((d) => active && setDashboard(d))
          .catch(() => active && setDashboard(null));
      }
      return () => {
        active = false;
      };
    }, [token]),
  );

  return (
    <Screen>
      <Text style={[typography.screenTitle, styles.greeting]}>
        {greeting()}, {user?.name ?? ''}
      </Text>

      <PendingContractsBanner />

      {dashboard?.hasTransporter ? (
        <PopulatedDashboard dashboard={dashboard} />
      ) : (
        <EmptyDashboard />
      )}
    </Screen>
  );
}

/** Banner: avisa o responsável que há contrato(s) liberado(s) para assinatura. */
function PendingContractsBanner() {
  const { token } = useAppState();
  const [pending, setPending] = useState<ContractDto[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      if (token) {
        listContracts(token, 'PENDING_SIGNATURE')
          .then((list) => active && setPending(list))
          .catch(() => active && setPending([]));
      }
      return () => {
        active = false;
      };
    }, [token]),
  );

  if (pending.length === 0) return null;

  return (
    <View style={styles.banners}>
      {pending.map((c) => (
        <Pressable key={c.id} onPress={() => router.push(`/contract/${c.id}`)}>
          <Card style={styles.contractBanner}>
            <Ionicons name="document-text-outline" size={22} color={colors.brandDark} />
            <View style={styles.bannerBody}>
              <Text style={styles.bannerTitle}>Contrato para assinar</Text>
              <Text style={styles.bannerText}>
                {c.transporterName} liberou o contrato de {c.studentName}. Toque para revisar e assinar.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Card>
        </Pressable>
      ))}
    </View>
  );
}

/** Card do aviso mais recente, tocável (tela cheia) e com reação inline. */
function LatestNoticeCard() {
  const { token } = useAppState();
  const [notice, setNotice] = useState<GuardianNoticeDto | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      if (token) {
        listGuardianNotices(token)
          .then((list) => active && setNotice(list[0] ?? null))
          .catch(() => active && setNotice(null));
      }
      return () => {
        active = false;
      };
    }, [token]),
  );

  async function react(emoji: string) {
    if (!token || !notice) return;
    try {
      const updated =
        notice.myReaction === emoji
          ? await removeReaction(token, notice.id)
          : await setReaction(token, notice.id, emoji);
      setNotice(updated);
    } catch {
      /* ignora */
    }
  }

  if (!notice) return null;

  return (
    <Card style={styles.noticeCard}>
      <Pressable onPress={() => router.push(`/notice/${notice.id}`)}>
        <View style={styles.noticeHeader}>
          <Ionicons name="megaphone-outline" size={18} color={colors.brandDark} />
          <Text style={styles.noticeTitle}>Aviso do Transportador</Text>
          <View style={styles.flex} />
          <Pressable hitSlop={6} onPress={() => router.push('/guardian-notices')}>
            <Text style={styles.seeAll}>Ver todos</Text>
          </Pressable>
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
              onPress={() => react(emoji)}
              style={[styles.reactionBtn, selected && styles.reactionBtnSelected]}
            >
              <Text style={styles.reactionEmoji}>{emoji}</Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

function PopulatedDashboard({ dashboard }: { dashboard: GuardianDashboardDto }) {
  const next = dashboard.nextPayment;
  return (
    <View style={styles.body}>
      <LatestNoticeCard />

      <Card>
        <View style={styles.attendanceHeader}>
          <Text style={typography.sectionTitle}>Presença da Semana</Text>
          {dashboard.studentName ? (
            <Text style={styles.studentName}>{dashboard.studentName}</Text>
          ) : null}
        </View>
        <View style={styles.daysRow}>
          {dashboard.weekAttendance.map((d) => {
            const present = d.present !== false;
            return (
              <View key={d.day} style={styles.dayItem}>
                <Text style={styles.dayLabel}>{d.day}</Text>
                <View style={[styles.dayCircle, present ? styles.dayPresent : styles.dayAbsent]}>
                  <Ionicons
                    name={present ? 'checkmark' : 'close'}
                    size={16}
                    color={present ? colors.textOnBrand : colors.danger}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </Card>

      <Card>
        <View style={styles.paymentRow}>
          <View style={styles.paymentInfo}>
            <View style={styles.paymentLabelRow}>
              <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.paymentLabel}>Próximo Pagamento</Text>
            </View>
            {next ? (
              <>
                <Text style={styles.paymentValue}>{formatCurrency(next.amount)}</Text>
                <Text style={styles.paymentDue}>
                  {formatRefMonth(next.referenceMonth)}
                  {next.dueDate ? ` • vence ${formatDate(next.dueDate)}` : ''}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.paymentValue}>Em dia</Text>
                <Text style={styles.paymentDue}>Nenhuma mensalidade pendente.</Text>
              </>
            )}
          </View>
          {next ? (
            <Button label="Pagar" onPress={() => router.push('/payments')} style={styles.payBtn} />
          ) : null}
        </View>
      </Card>
    </View>
  );
}

function EmptyDashboard() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="bus-outline" size={42} color={colors.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>Você ainda não tem um transportador contratado.</Text>
      <Text style={styles.emptyText}>
        Encontre o transporte ideal para o seu filho e acompanhe tudo pelo aplicativo.
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

const styles = StyleSheet.create({
  greeting: {
    marginBottom: spacing.xl,
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
  seeAll: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.brandDark,
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
  attendanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
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
