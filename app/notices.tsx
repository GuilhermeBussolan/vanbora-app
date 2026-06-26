import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Card, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { deleteNotice, listMyNotices } from '@/api/notices';
import { TransporterNoticeDto } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function reactionSummary(reactions: TransporterNoticeDto['reactions']): string {
  return reactions.map((r) => `${r.emoji} ${r.count}`).join('   ');
}

/** Gerenciamento de avisos: criar (com agendamento), listar e excluir. */
export default function NoticesScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [notices, setNotices] = useState<TransporterNoticeDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!token) return;
    listMyNotices(token)
      .then(setNotices)
      .catch(() => setNotices([]))
      .finally(() => setLoading(false));
  }, [token]);

  useFocusEffect(load);

  function confirmDelete(id: number) {
    Alert.alert('Excluir aviso', 'Tem certeza que deseja excluir este aviso?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          try {
            await deleteNotice(token, id);
            setNotices((prev) => prev.filter((n) => n.id !== id));
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir o aviso.');
          }
        },
      },
    ]);
  }

  return (
    <Screen>
      <AppHeader
        title="Avisos"
        showBack
        right={
          <Pressable style={styles.newBtn} onPress={() => router.push('/new-notice')}>
            <Ionicons name="add" size={16} color={colors.textOnBrand} />
            <Text style={styles.newBtnText}>Novo Aviso</Text>
          </Pressable>
        }
      />

      {loading ? (
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xxl }} />
      ) : notices.length === 0 ? (
        <Text style={styles.empty}>Nenhum aviso ainda. Toque em "Novo Aviso".</Text>
      ) : (
        <View style={styles.list}>
          {notices.map((notice) => {
            const hasReactions = notice.reactions.length > 0;
            return (
              <Pressable key={notice.id} onPress={() => router.push(`/transporter-notice/${notice.id}`)}>
                <Card>
                  <View style={styles.cardHead}>
                    <View style={styles.badges}>
                      {notice.priority === 'URGENT' ? (
                        <View style={styles.urgentBadge}>
                          <Ionicons name="alert-circle" size={12} color={colors.white} />
                          <Text style={styles.urgentText}>Urgente</Text>
                        </View>
                      ) : null}
                      {notice.scheduled ? (
                        <View style={styles.scheduledBadge}>
                          <Ionicons name="time-outline" size={12} color={colors.warning} />
                          <Text style={styles.scheduledText}>
                            Agendado · {formatDateTime(notice.publishAt)}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.publishedBadge}>
                          <Ionicons name="checkmark-circle" size={12} color={colors.success} />
                          <Text style={styles.publishedText}>Publicado</Text>
                        </View>
                      )}
                    </View>
                    <Pressable hitSlop={8} onPress={() => confirmDelete(notice.id)}>
                      <Ionicons name="trash-outline" size={18} color={colors.danger} />
                    </Pressable>
                  </View>

                  {notice.title ? (
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {notice.title}
                    </Text>
                  ) : null}
                  <Text style={styles.message} numberOfLines={notice.title ? 2 : 3}>
                    {notice.message}
                  </Text>

                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                      <Ionicons name="eye-outline" size={13} color={colors.textSecondary} />
                      <Text style={styles.metaText}>
                        {notice.viewedCount}/{notice.recipients}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="chatbubble-outline" size={13} color={colors.textSecondary} />
                      <Text style={styles.metaText}>{notice.commentsCount}</Text>
                    </View>
                    {hasReactions ? (
                      <Text style={styles.reactions}>{reactionSummary(notice.reactions)}</Text>
                    ) : null}
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  newBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textOnBrand,
  },
  empty: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
  list: {
    gap: spacing.md,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    flexWrap: 'wrap',
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
  scheduledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scheduledText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
  },
  publishedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  publishedText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  reactions: {
    fontSize: 13,
  },
});
