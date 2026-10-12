import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Logo, Screen, SocialAuthButtons } from '@/components';
import { clearSignupDraft } from '@/state/signupDraft';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Tela inicial: marca + botões Entrar / Criar Conta / login social. */
export default function WelcomeScreen() {
  const { styles } = useThemedScreen(createStyles);
  const [error, setError] = useState<string | null>(null);

  function startEmailSignup() {
    // Cadastro por e-mail: descarta um rascunho social de uma tentativa anterior.
    clearSignupDraft();
    router.push('/(auth)/profile-select');
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.logo}>
        <Logo size={36} showTagline />
      </View>

      <View style={styles.actions}>
        <Button label="Entrar" onPress={() => router.push('/(auth)/login')} />
        <Button
          label="Criar Conta"
          variant="secondary"
          onPress={startEmailSignup}
          style={styles.spaced}
        />

        <SocialAuthButtons onError={(message) => setError(message || null)} />

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, _typography: Typography) =>
  StyleSheet.create({
    content: {
      justifyContent: 'center',
    },
    logo: {
      alignItems: 'center',
      marginBottom: spacing.xxxl,
    },
    actions: {
      width: '100%',
    },
    spaced: {
      marginTop: spacing.md,
    },
    error: {
      marginTop: spacing.lg,
      fontSize: 13,
      textAlign: 'center',
      color: colors.danger,
    },
  });
