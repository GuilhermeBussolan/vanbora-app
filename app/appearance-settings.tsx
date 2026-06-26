import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Card, Screen } from '@/components';
import { spacing, useTheme, useThemedScreen } from '@/theme';
import type { ThemeColors, ThemePref, Typography } from '@/theme';

const OPTIONS: { key: ThemePref; label: string; description: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  {
    key: 'system',
    label: 'Padrão do sistema',
    description: 'Acompanha o tema do seu celular automaticamente.',
    icon: 'phone-portrait-outline',
  },
  {
    key: 'light',
    label: 'Claro',
    description: 'Sempre com fundo claro.',
    icon: 'sunny-outline',
  },
  {
    key: 'dark',
    label: 'Escuro',
    description: 'Sempre com fundo escuro (Modo Noturno).',
    icon: 'moon-outline',
  },
];

/** Escolha do tema do app (Modo Noturno). Salvo localmente no aparelho. */
export default function AppearanceSettingsScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { preference, setPreference } = useTheme();

  return (
    <Screen>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Aparência</Text>

      <Card padded={false}>
        {OPTIONS.map((item, index) => {
          const selected = preference === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => setPreference(item.key)}
              style={[styles.row, index < OPTIONS.length - 1 && styles.divider]}
            >
              <View style={styles.iconWrap}>
                <Ionicons name={item.icon} size={20} color={colors.textSecondary} />
              </View>
              <View style={styles.info}>
                <Text style={styles.label}>{item.label}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
              {selected ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.brandDark} />
              ) : (
                <View style={styles.radioOff} />
              )}
            </Pressable>
          );
        })}
      </Card>

      <Text style={styles.note}>A preferência de tema fica salva neste aparelho.</Text>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    title: { marginTop: spacing.md, marginBottom: spacing.lg },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.lg,
    },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: { flex: 1 },
    label: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    description: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
    radioOff: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.borderStrong,
    },
    note: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
  });
