import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

type Tone = 'success' | 'warning' | 'danger' | 'neutral';

interface BadgeProps {
  label: string;
  tone?: Tone;
}

/** Etiqueta de status compacta (PAGO, PENDENTE, ATRASADO, etc.). */
export function Badge({ label, tone = 'neutral' }: BadgeProps) {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const toneMap: Record<Tone, { bg: string; fg: string }> = {
    success: { bg: colors.successBg, fg: colors.success },
    warning: { bg: colors.warningBg, fg: colors.warning },
    danger: { bg: colors.dangerBg, fg: colors.danger },
    neutral: { bg: colors.border, fg: colors.textSecondary },
  };
  const { bg, fg } = toneMap[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
