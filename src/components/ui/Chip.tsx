import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

interface ChipProps {
  label: string;
  /** Estilo "selecionado" (preenchido em amarelo). */
  selected?: boolean;
  /** Exibe um X para remoção (ex.: bairros da zona). */
  removable?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
}

/** Chip de filtro / tag (bairros, escolas, filtros de lista). */
export function Chip({ label, selected = false, removable = false, onPress, onRemove }: ChipProps) {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected ? styles.selected : styles.unselected]}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
      {removable ? (
        <Pressable onPress={onRemove} hitSlop={6} style={styles.removeBtn}>
          <Ionicons name="close" size={13} color={colors.textPrimary} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  selected: {
    backgroundColor: colors.brand,
  },
  unselected: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  textSelected: {
    color: colors.textOnBrand,
  },
  removeBtn: {
    marginLeft: 6,
  },
});
