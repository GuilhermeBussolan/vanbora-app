import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

interface LogoProps {
  size?: number;
  showTagline?: boolean;
  /**
   * 'onBrand' = exibido sobre o fundo amarelo da marca (splash): usa cores fixas
   * de alto contraste ("Bora" branco), independente do tema claro/escuro.
   */
  variant?: 'default' | 'onBrand';
}

/** Marca VanBora: "Van" + "Bora" (amarelo) + ícone de van. */
export function Logo({ size = 28, showTagline = false, variant = 'default' }: LogoProps) {
  const { colors, styles } = useThemedScreen(createStyles);
  const onBrand = variant === 'onBrand';

  // Sobre o amarelo: contraste fixo. Caso contrário: cores do tema ativo.
  const vanColor = onBrand ? '#1A1A1A' : colors.textPrimary;
  const boraColor = onBrand ? '#FFFFFF' : colors.brand;
  const iconColor = onBrand ? '#1A1A1A' : colors.brand;
  const taglineColor = onBrand ? '#1A1A1A' : colors.textSecondary;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Ionicons name="bus" size={size} color={iconColor} style={styles.icon} />
        <Text style={[styles.word, { fontSize: size, color: vanColor }]}>
          Van<Text style={{ color: boraColor }}>Bora</Text>
        </Text>
      </View>
      {showTagline ? (
        <Text style={[styles.tagline, { color: taglineColor }]}>
          TRANSPORTE ESCOLAR INTELIGENTE
        </Text>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    wrap: {
      alignItems: 'center',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    icon: {
      marginRight: 6,
      transform: [{ scaleX: -1 }],
    },
    word: {
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    tagline: {
      marginTop: 4,
      fontSize: 9,
      letterSpacing: 1.5,
      fontWeight: '600',
    },
  });
