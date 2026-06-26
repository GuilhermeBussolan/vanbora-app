import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Logo } from '@/components';
import { useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Splash inicial em amarelo da marca; encaminha para a tela de boas-vindas. */
export default function SplashScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  useEffect(() => {
    const timer = setTimeout(() => router.replace('/(auth)/welcome'), 1600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Logo size={40} showTagline variant="onBrand" />
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
