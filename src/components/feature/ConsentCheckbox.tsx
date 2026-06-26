import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

interface ConsentCheckboxProps {
  checked: boolean;
  onToggle: () => void;
}

/**
 * Aceite obrigatório (LGPD) no cadastro: checkbox + texto com links para a
 * Política de Privacidade e os Termos de Uso. Desmarcado por padrão.
 */
export function ConsentCheckbox({ checked, onToggle }: ConsentCheckboxProps) {
  const { colors, styles } = useThemedScreen(createStyles);
  return (
    <Pressable onPress={onToggle} style={styles.row} hitSlop={6}>
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Ionicons name="checkmark" size={15} color={colors.textOnBrand} /> : null}
      </View>
      <Text style={styles.text}>
        Li e concordo com a{' '}
        <Text style={styles.link} onPress={() => router.push('/privacy-policy')}>
          Política de Privacidade
        </Text>{' '}
        e os{' '}
        <Text style={styles.link} onPress={() => router.push('/terms')}>
          Termos de Uso
        </Text>
        , e autorizo o tratamento dos meus dados conforme a LGPD.
      </Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    box: {
      width: 22,
      height: 22,
      borderRadius: radius.sm,
      borderWidth: 2,
      borderColor: colors.inputBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    boxChecked: {
      backgroundColor: colors.brand,
      borderColor: colors.brand,
    },
    text: { flex: 1, fontSize: 12, lineHeight: 18, color: colors.textSecondary },
    link: { color: colors.brandDark, fontWeight: '700', textDecorationLine: 'underline' },
  });
