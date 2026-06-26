import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Screen } from '@/components';
import { UserRole } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

interface Option {
  role: UserRole;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const OPTIONS: Option[] = [
  {
    role: 'guardian',
    icon: 'people-outline',
    title: 'Sou Responsável',
    description: 'Acompanhe o trajeto e gerencie o transporte do seu filho.',
  },
  {
    role: 'transporter',
    icon: 'bus-outline',
    title: 'Sou Transportador',
    description: 'Gerencie alunos, rotas e recebimentos.',
  },
];

/** Seleção do tipo de usuário antes do cadastro. */
export default function ProfileSelectScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const [selected, setSelected] = useState<UserRole>('guardian');

  function handleContinue() {
    if (selected === 'guardian') {
      router.push('/(auth)/register-guardian');
    } else {
      router.push('/(auth)/register-transporter');
    }
  }

  return (
    <Screen
      footer={<Button label="Continuar" onPress={handleContinue} />}
    >
      <AppHeader showBack />
      <Text style={[typography.screenTitle, styles.heading]}>
        Como você vai usar o VanBora?
      </Text>

      <View style={styles.list}>
        {OPTIONS.map((opt) => {
          const active = selected === opt.role;
          return (
            <Pressable
              key={opt.role}
              onPress={() => setSelected(opt.role)}
              style={[styles.card, active && styles.cardActive]}
            >
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                <Ionicons
                  name={opt.icon}
                  size={22}
                  color={active ? colors.textOnBrand : colors.textSecondary}
                />
              </View>
              <View style={styles.cardText}>
                <Text style={typography.cardTitle}>{opt.title}</Text>
                <Text style={styles.cardDescription}>{opt.description}</Text>
              </View>
              <Ionicons
                name={active ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={active ? colors.brandDark : colors.textMuted}
              />
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  heading: {
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },
  list: {
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  cardActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brandSoft,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconWrapActive: {
    backgroundColor: colors.brand,
  },
  cardText: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  cardDescription: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
