import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

interface AppHeaderProps {
  title?: string;
  /** Exibe seta de voltar à esquerda. */
  showBack?: boolean;
  onBack?: () => void;
  /** Elemento opcional à direita. */
  right?: React.ReactNode;
}

/** Cabeçalho com botão de voltar e título centralizado/à esquerda. */
export function AppHeader({ title, showBack = false, onBack, right }: AppHeaderProps) {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const handleBack = onBack ?? (() => router.back());
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {showBack ? (
          <Pressable onPress={handleBack} hitSlop={10} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </Pressable>
        ) : null}
      </View>
      {title ? <Text style={[typography.title, styles.title]}>{title}</Text> : <View />}
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    marginBottom: spacing.lg,
  },
  side: {
    minWidth: 40,
    justifyContent: 'center',
  },
  right: {
    alignItems: 'flex-end',
  },
  backBtn: {
    marginRight: spacing.sm,
  },
  title: {
    flex: 1,
  },
});
