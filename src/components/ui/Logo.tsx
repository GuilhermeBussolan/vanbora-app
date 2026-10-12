import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

interface LogoProps {
  size?: number;
  showTagline?: boolean;
  /**
   * 'onBrand' = exibido sobre o fundo amarelo da marca (splash): usa cores fixas
   * de alto contraste ("Bora" branco) e o símbolo monocromático preto (mais
   * legível sobre o amarelo do que o símbolo colorido), independente do tema.
   */
  variant?: 'default' | 'onBrand';
}

/** Proporção real do arquivo do símbolo (697x682) — evita distorcer ao escalar pelo `size`. */
const SYMBOL_ASPECT_RATIO = 697 / 682;

/** Marca VanBora: símbolo oficial + "Van" + "Bora" (amarelo). */
export function Logo({ size = 28, showTagline = false, variant = 'default' }: LogoProps) {
  const { colors, styles } = useThemedScreen(createStyles);
  const onBrand = variant === 'onBrand';

  // Sobre o amarelo: contraste fixo. Caso contrário: cores do tema ativo.
  const vanColor = onBrand ? '#1A1A1A' : colors.textPrimary;
  const boraColor = onBrand ? '#FFFFFF' : colors.brand;
  const taglineColor = onBrand ? '#1A1A1A' : colors.textSecondary;
  const symbolSource = onBrand
    ? require('../../../assets/brand/logo-symbol-mono-black.png')
    : require('../../../assets/brand/logo-symbol.png');

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Image
          source={symbolSource}
          style={[styles.icon, { width: size * SYMBOL_ASPECT_RATIO, height: size }]}
          resizeMode="contain"
        />
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
