import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ReactionGroup } from '@/types';
import { colors, radius, spacing } from '@/theme';

interface ReactionsBarProps {
  reactions: ReactionGroup[];
}

/** Mostra as reações (emoji + contagem). Tocar revela QUEM reagiu (modal). */
export function ReactionsBar({ reactions }: ReactionsBarProps) {
  const [open, setOpen] = useState(false);

  if (reactions.length === 0) {
    return <Text style={styles.none}>Nenhuma reação ainda.</Text>;
  }

  return (
    <>
      <Pressable style={styles.row} onPress={() => setOpen(true)}>
        {reactions.map((group) => (
          <View key={group.emoji} style={styles.chip}>
            <Text style={styles.emoji}>{group.emoji}</Text>
            <Text style={styles.count}>{group.count}</Text>
          </View>
        ))}
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <SafeAreaView style={styles.sheet} edges={['bottom']}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Quem reagiu</Text>
              <Pressable hitSlop={8} onPress={() => setOpen(false)}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </Pressable>
            </View>
            <ScrollView style={styles.sheetBody}>
              {reactions.map((group) => (
                <View key={group.emoji} style={styles.groupBlock}>
                  <Text style={styles.groupHeader}>
                    {group.emoji} {group.count}
                  </Text>
                  {group.names.map((name, idx) => (
                    <Text key={`${group.emoji}-${idx}`} style={styles.name}>
                      {name}
                    </Text>
                  ))}
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  none: { fontSize: 13, color: colors.textMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  emoji: { fontSize: 15 },
  count: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '70%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  sheetBody: { padding: spacing.lg },
  groupBlock: { marginBottom: spacing.lg },
  groupHeader: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  name: { fontSize: 14, color: colors.textSecondary, paddingVertical: 3 },
});
