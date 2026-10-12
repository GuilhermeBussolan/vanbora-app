import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

interface Props {
  count: number;
  onView: () => void;
  onDismiss: () => void;
}

/** Card discreto de "há novidades no guia" — nunca abre sozinho, usuário decide. */
export function WhatsNewBanner({ count, onView, onDismiss }: Props) {
  const { colors, styles } = useThemedScreen(createStyles);
  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Ionicons name="sparkles-outline" size={20} color={colors.brandDark} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.title}>Novidades no Vanbora</Text>
          <Text style={styles.text}>
            {count > 1
              ? `${count} novidades esperando por você no guia de funcionalidades.`
              : 'Uma novidade esperando por você no guia de funcionalidades.'}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={onDismiss} hitSlop={8} style={styles.actionBtn}>
          <Text style={styles.dismissText}>Agora não</Text>
        </Pressable>
        <Pressable onPress={onView} hitSlop={8} style={styles.actionBtn}>
          <Text style={styles.viewText}>Ver novidades</Text>
        </Pressable>
      </View>
    </Card>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  card: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flex: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  text: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  actionBtn: {
    padding: spacing.xs,
  },
  dismissText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  viewText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.brandDark,
  },
});
