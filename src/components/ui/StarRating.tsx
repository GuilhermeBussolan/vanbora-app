import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

interface StarRatingProps {
  rating: number;
  size?: number;
  showValue?: boolean;
  /** Texto auxiliar à direita (ex.: "(124 avaliações)"). */
  caption?: string;
}

/** Linha de estrelas com nota e legenda opcional. */
export function StarRating({ rating, size = 14, showValue = true, caption }: StarRatingProps) {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const stars = [1, 2, 3, 4, 5];
  return (
    <View style={styles.row}>
      {stars.map((s) => {
        const name =
          rating >= s ? 'star' : rating >= s - 0.5 ? 'star-half' : 'star-outline';
        return <Ionicons key={s} name={name} size={size} color={colors.star} />;
      })}
      {showValue ? <Text style={styles.value}>{rating.toFixed(1)}</Text> : null}
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  value: {
    marginLeft: 4,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  caption: {
    marginLeft: 4,
    fontSize: 12,
    color: colors.textSecondary,
  },
});
