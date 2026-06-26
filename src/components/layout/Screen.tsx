import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing, useTheme } from '@/theme';

/** Margem horizontal padrão das telas (padrão iOS HIG / Material = 16). */
export const SCREEN_MARGIN = spacing.lg;

interface ScreenProps {
  children: React.ReactNode;
  /** Habilita rolagem vertical do conteúdo. */
  scroll?: boolean;
  /** Aplica margem horizontal padrão. */
  padded?: boolean;
  edges?: readonly Edge[];
  contentStyle?: ViewStyle;
  /** Conteúdo fixo no rodapé (fora da área rolável). */
  footer?: React.ReactNode;
}

/**
 * Container base de todas as telas: respeita as safe areas do iOS/Android
 * (notch, barra de status e indicador inferior), aplica a margem padrão e
 * acompanha o tema (claro/escuro).
 */
export function Screen({
  children,
  scroll = true,
  padded = true,
  edges = ['top', 'left', 'right'],
  contentStyle,
  footer,
}: ScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Margem de conteúdo: a safe area (notch/status bar/home indicator) é aplicada
  // pelo SafeAreaView; aqui vai só o respiro de conteúdo, equilibrado topo/base.
  const padStyle: ViewStyle = {
    paddingHorizontal: SCREEN_MARGIN,
    paddingTop: spacing.lg,
  };
  // Rodapé fixo (botões de ação): soma o inset para não ficar sob o home indicator.
  const footerBottom = spacing.md + insets.bottom;

  const inner = (
    <View style={[styles.flex, padded && padStyle, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={[styles.scrollContent, padded && padStyle, contentStyle]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          inner
        )}
        {footer ? (
          <View
            style={[
              styles.footer,
              { paddingHorizontal: SCREEN_MARGIN, paddingBottom: footerBottom },
            ]}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  footer: {
    paddingTop: spacing.md,
  },
});
