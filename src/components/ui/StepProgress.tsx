import React from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

interface StepProgressProps {
  steps: number;
  current: number; // índice baseado em 1
}

/** Barra de progresso por etapas (cadastro do transportador). */
export function StepProgress({ steps, current }: StepProgressProps) {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  return (
    <View style={styles.row}>
      {Array.from({ length: steps }).map((_, i) => (
        <View
          key={i}
          style={[styles.segment, i < current ? styles.active : styles.inactive]}
        />
      ))}
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: radius.pill,
  },
  active: {
    backgroundColor: colors.brand,
  },
  inactive: {
    backgroundColor: colors.border,
  },
});
