import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Screen } from '@/components';
import { CommentsSection } from '@/components/feature/CommentsSection';
import { ReactionsBar } from '@/components/feature/ReactionsBar';
import { useAppState } from '@/context/AppState';
import {
  addComment,
  deleteOwnComment,
  getGuardianNotice,
  listGuardianComments,
  removeReaction,
  setReaction,
} from '@/api/notices';
import { GuardianNoticeDto, NoticeCommentDto, NOTICE_EMOJIS } from '@/types';
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

/** Aviso em tela cheia (responsável): prioridade, reação, quem reagiu e comentários. */
export default function NoticeDetailScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const noticeId = Number(id);
  const { token } = useAppState();
  const [notice, setNotice] = useState<GuardianNoticeDto | null>(null);
  const [comments, setComments] = useState<NoticeCommentDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([getGuardianNotice(token, noticeId), listGuardianComments(token, noticeId)])
      .then(([n, c]) => {
        setNotice(n);
        setComments(c);
      })
      .catch(() => setNotice(null))
      .finally(() => setLoading(false));
  }, [token, noticeId]);

  const react = useCallback(
    async (emoji: string) => {
      if (!token || !notice) return;
      const updated =
        notice.myReaction === emoji
          ? await removeReaction(token, noticeId)
          : await setReaction(token, noticeId, emoji);
      setNotice(updated);
    },
    [token, noticeId, notice],
  );

  async function postComment(text: string) {
    if (!token) return;
    const created = await addComment(token, noticeId, text);
    setComments((prev) => [...prev, created]);
  }

  async function removeComment(comment: NoticeCommentDto) {
    if (!token) return;
    await deleteOwnComment(token, noticeId, comment.id);
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
    <Screen>
      <AppHeader showBack />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.head}>
          <View style={styles.iconCircle}>
            <Ionicons name="megaphone" size={22} color={colors.brandDark} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.from}>{notice.transporterName}</Text>
            <Text style={styles.date}>{formatDate(notice.publishAt)}</Text>
          </View>
          {notice.priority === 'URGENT' ? (
            <View style={styles.urgentBadge}>
              <Ionicons name="alert-circle" size={13} color={colors.white} />
              <Text style={styles.urgentText}>Urgente</Text>
            </View>
          ) : null}
        </View>

        {notice.title ? <Text style={styles.noticeTitle}>{notice.title}</Text> : null}
        <Text style={styles.message}>{notice.message}</Text>

        <Text style={[typography.sectionTitle, styles.section]}>Sua reação</Text>
        <View style={styles.emojiRow}>
          {NOTICE_EMOJIS.map((emoji) => {
            const selected = notice.myReaction === emoji;
            return (
              <Pressable
                key={emoji}
                onPress={() => react(emoji)}
                style={[styles.emojiBtn, selected && styles.emojiBtnSelected]}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.reactionsBlock}>
          <ReactionsBar reactions={notice.reactions} />
        </View>

        <View style={styles.commentsBlock}>
          <CommentsSection
            comments={comments}
            canPost={notice.allowComments}
            disabledReason={notice.allowComments ? undefined : 'Comentários desativados neste aviso.'}
            onPost={postComment}
            onDelete={removeComment}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  empty: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  flex: { flex: 1 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  from: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  date: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  urgentText: { fontSize: 11, fontWeight: '700', color: colors.white },
  noticeTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.sm },
  message: { fontSize: 16, lineHeight: 24, color: colors.textPrimary },
  section: { marginTop: spacing.xxl, marginBottom: spacing.md },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  emojiBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.inputBorder,
    backgroundColor: colors.white,
  },
  emojiBtnSelected: { borderColor: colors.brand, borderWidth: 2, backgroundColor: colors.brandSoft },
  emoji: { fontSize: 24 },
  reactionsBlock: { marginTop: spacing.lg },
  commentsBlock: { marginTop: spacing.xxl },
});
