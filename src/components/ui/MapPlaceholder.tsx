import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

interface MapPlaceholderProps {
  label?: string;
  height?: number;
  style?: ViewStyle;
}

/**
 * Espaço reservado para o mapa em tempo real.
 * Será substituído por react-native-maps na integração futura.
 */
export function MapPlaceholder({
  label = 'Mapa em tempo real',
  height = 220,
  style,
}: MapPlaceholderProps) {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  return (
    <View style={[styles.map, { height }, style]}>
      <Ionicons name="map-outline" size={34} color={colors.textMuted} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  map: {
    backgroundColor: colors.mapBg,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: colors.textSecondary,
  },
});
