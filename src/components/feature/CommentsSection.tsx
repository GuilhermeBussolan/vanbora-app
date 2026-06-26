import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NoticeCommentDto } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

interface CommentsSectionProps {
  comments: NoticeCommentDto[];
  /** Mostra o campo para escrever (responsável, quando o aviso aceita comentários). */
  canPost: boolean;
  /** Transportador pode excluir qualquer comentário (moderação). */
  canModerate?: boolean;
  /** Texto quando comentários estão desativados. */
  disabledReason?: string;
  onPost?: (text: string) => Promise<void>;
  onDelete?: (comment: NoticeCommentDto) => Promise<void>;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Seção de comentários de um aviso, reutilizada pelos dois perfis. */
export function CommentsSection({
  comments,
  canPost,
  canModerate = false,
  disabledReason,
  onPost,
  onDelete,
}: CommentsSectionProps) {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  async function submit() {
    const text = draft.trim();
    if (!text || !onPost) return;
    setSending(true);
    try {
      await onPost(text);
      setDraft('');
    } finally {
      setSending(false);
    }
  }

  return (
    <View>
      <Text style={[typography.sectionTitle, styles.title]}>Comentários ({comments.length})</Text>

      {comments.length === 0 ? (
        <Text style={styles.empty}>Nenhum comentário ainda.</Text>
      ) : (
        <View style={styles.list}>
          {comments.map((comment) => (
            <View key={comment.id} style={styles.comment}>
              <View style={styles.commentHead}>
                <Text style={styles.author}>{comment.authorName}</Text>
                <Text style={styles.time}>{formatTime(comment.createdAt)}</Text>
              </View>
              <Text style={styles.text}>{comment.text}</Text>
              {(comment.mine || canModerate) && onDelete ? (
                <Pressable
                  hitSlop={8}
                  style={styles.deleteBtn}
                  onPress={() => onDelete(comment)}
                >
                  <Ionicons name="trash-outline" size={14} color={colors.danger} />
                  <Text style={styles.deleteText}>Excluir</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      )}

      {canPost ? (
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Escreva um comentário..."
            placeholderTextColor={colors.textMuted}
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <Pressable style={styles.sendBtn} onPress={submit} disabled={sending}>
            <Ionicons name="send" size={16} color={colors.textOnBrand} />
          </Pressable>
        </View>
      ) : disabledReason ? (
        <Text style={styles.disabled}>{disabledReason}</Text>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  title: { marginBottom: spacing.md },
  empty: { fontSize: 13, color: colors.textMuted },
  list: { gap: spacing.md },
  comment: {
    backgroundColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  commentHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  author: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  time: { fontSize: 11, color: colors.textMuted },
  text: { fontSize: 14, lineHeight: 19, color: colors.textPrimary },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  deleteText: { fontSize: 12, color: colors.danger, fontWeight: '600' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
    marginTop: spacing.md,
  },
});
