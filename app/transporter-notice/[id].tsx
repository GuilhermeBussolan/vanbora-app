import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Screen } from '@/components';
import { CommentsSection } from '@/components/feature/CommentsSection';
import { ReactionsBar } from '@/components/feature/ReactionsBar';
import { useAppState } from '@/context/AppState';
import { getMyNotice, listTransporterComments, moderateComment } from '@/api/notices';
import { NoticeCommentDto, TransporterNoticeDto } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Visão do transportador sobre o próprio aviso: engajamento, comentários e editar. */
export default function TransporterNoticeScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const noticeId = Number(id);
  const { token } = useAppState();
  const [notice, setNotice] = useState<TransporterNoticeDto | null>(null);
  const [comments, setComments] = useState<NoticeCommentDto[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (token) {
        Promise.all([getMyNotice(token, noticeId), listTransporterComments(token, noticeId)])
          .then(([n, c]) => {
            if (active) {
              setNotice(n);
              setComments(c);
            }
          })
          .catch(() => active && setNotice(null))
          .finally(() => active && setLoading(false));
      }
      return () => {
        active = false;
      };
    }, [token, noticeId]),
  );

  async function moderate(comment: NoticeCommentDto) {
    if (!token) return;
    await moderateComment(token, noticeId, comment.id);
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader showBack />
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xxl }} />
      </Screen>
    );
  }

  if (!notice) {
    return (
      <Screen>
        <AppHeader showBack />
        <Text style={styles.empty}>Aviso não encontrado.</Text>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <Button
          label="Editar aviso"
          icon="create-outline"
          variant="outline"
          onPress={() => router.push(`/edit-notice?id=${notice.id}`)}
        />
      }
    >
      <AppHeader showBack />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.badges}>
          {notice.priority === 'URGENT' ? (
            <View style={[styles.badge, styles.urgent]}>
              <Ionicons name="alert-circle" size={13} color={colors.white} />
              <Text style={styles.urgentText}>Urgente</Text>
            </View>
          ) : null}
          {notice.scheduled ? (
            <View style={[styles.badge, styles.scheduled]}>
              <Ionicons name="time-outline" size={12} color={colors.warning} />
              <Text style={styles.scheduledText}>Agendado · {formatDate(notice.publishAt)}</Text>
            </View>
          ) : (
            <View style={[styles.badge, styles.published]}>
              <Ionicons name="checkmark-circle" size={12} color={colors.success} />
              <Text style={styles.publishedText}>Publicado</Text>
            </View>
          )}
        </View>

        {notice.title ? <Text style={styles.noticeTitle}>{notice.title}</Text> : null}
        <Text style={styles.message}>{notice.message}</Text>

        <View style={styles.audienceRow}>
          <Ionicons name="people-outline" size={15} color={colors.textSecondary} />
          <Text style={styles.audienceText}>
            Para: {notice.audienceAll ? 'Todos' : `${notice.recipients} responsável(is)`}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <Stat icon="eye-outline" label={`Visto por ${notice.viewedCount} de ${notice.recipients}`} />
          <Stat icon="chatbubble-outline" label={`${notice.commentsCount} comentários`} />
        </View>

        <Text style={[typography.sectionTitle, styles.section]}>Reações</Text>
        <ReactionsBar reactions={notice.reactions} />

        <View style={styles.commentsBlock}>
          <CommentsSection
            comments={comments}
            canPost={false}
            canModerate
            disabledReason={
              notice.allowComments ? undefined : 'Comentários estão desativados neste aviso.'
            }
            onDelete={moderate}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

function Stat({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={15} color={colors.textSecondary} />
      <Text style={styles.statText}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  empty: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
  badges: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.lg },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  urgent: { backgroundColor: colors.danger },
  urgentText: { fontSize: 11, fontWeight: '700', color: colors.white },
  scheduled: { backgroundColor: colors.warningBg },
  scheduledText: { fontSize: 11, fontWeight: '600', color: colors.warning },
  published: { backgroundColor: colors.successBg },
  publishedText: { fontSize: 11, fontWeight: '600', color: colors.success },
  noticeTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.sm },
  message: { fontSize: 16, lineHeight: 24, color: colors.textPrimary },
  audienceRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.lg },
  audienceText: { fontSize: 13, color: colors.textSecondary },
  statsRow: { flexDirection: 'row', gap: spacing.xl, marginTop: spacing.lg },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 13, color: colors.textSecondary },
  section: { marginTop: spacing.xxl, marginBottom: spacing.md },
  commentsBlock: { marginTop: spacing.xxl },
});
