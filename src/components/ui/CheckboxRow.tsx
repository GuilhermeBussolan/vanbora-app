import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

interface CheckboxRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  checked: boolean;
  onToggle: () => void;
}

/** Linha de seleção múltipla (ícone do recurso + rótulo + checkbox), usada em listas fixas de opções. */
export function CheckboxRow({ icon, label, checked, onToggle }: CheckboxRowProps) {
  const { colors, styles } = useThemedScreen(createStyles);
  return (
    <Pressable onPress={onToggle} style={styles.row}>
      <View style={[styles.iconCircle, checked && styles.iconCircleChecked]}>
        <Ionicons name={icon} size={14} color={checked ? colors.textOnBrand : colors.textSecondary} />
      </View>
      <Text style={styles.label}>{label}</Text>
      <Ionicons
        name={checked ? 'checkbox' : 'square-outline'}
        size={20}
        color={checked ? colors.brandDark : colors.textMuted}
      />
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleChecked: {
    backgroundColor: colors.brand,
  },
  label: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
});
