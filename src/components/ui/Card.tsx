import React from 'react';
import { StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { cardShadow, radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

interface CardProps extends ViewProps {
  /** Destaque com borda amarela (ex.: pagamento pendente). */
  highlighted?: boolean;
  padded?: boolean;
  style?: ViewStyle;
}

/** Container branco com borda, sombra leve e cantos arredondados. */
export function Card({
  highlighted = false,
  padded = true,
  style,
  children,
  ...rest
}: CardProps) {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  return (
    <View
      style={[
        styles.card,
        padded && styles.padded,
        highlighted && styles.highlighted,
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  padded: {
    padding: spacing.lg,
  },
  highlighted: {
    borderColor: colors.brand,
    borderWidth: 1.5,
  },
});
