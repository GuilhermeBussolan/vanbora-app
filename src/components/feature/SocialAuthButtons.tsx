import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { useAppState } from '@/context/AppState';
import { socialLogin } from '@/api/auth';
import { ApiError } from '@/api/client';
import {
  isSocialLoginEnabled,
  PROVIDER_LABEL,
  signInWithProvider,
  SocialLoginCancelled,
  SocialProvider,
} from '@/lib/auth0';
import { startSignupDraft } from '@/state/signupDraft';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

interface SocialAuthButtonsProps {
  /** Mensagem de erro para a tela exibir junto dos demais erros do formulário. */
  onError?: (message: string) => void;
}

/**
 * "Entrar com Google / Facebook" (Auth0), compartilhado pelas telas de entrada.
 *
 * Serve a responsáveis e transportadores: quem já tem conta entra direto, com o
 * papel vindo da própria conta; quem é novo segue para a escolha de perfil e o
 * cadastro, já autenticado — sem precisar criar senha.
 *
 * Não renderiza nada quando o Auth0 não está configurado no ambiente, para não
 * oferecer um botão que só resultaria em erro.
 */
export function SocialAuthButtons({ onError }: SocialAuthButtonsProps) {
  const { styles } = useThemedScreen(createStyles);
  const { applySession, setHasTransporter } = useAppState();
  const [pending, setPending] = useState<SocialProvider | null>(null);

  if (!isSocialLoginEnabled) {
    return null;
  }

  async function handlePress(provider: SocialProvider) {
    setPending(provider);
    onError?.('');
    try {
      const idToken = await signInWithProvider(provider);
      const result = await socialLogin(idToken);

      if (result.registered && result.session) {
        const role = await applySession(result.session);
        if (role === 'transporter') {
          router.replace('/(transporter)/home');
        } else {
          setHasTransporter(true);
          router.replace('/(guardian)/home');
        }
        return;
      }

      // Primeiro acesso: falta escolher o perfil e preencher CPF, endereço etc.
      // O ticket prova o login social até o cadastro terminar.
      startSignupDraft({
        socialTicket: result.signupTicket ?? undefined,
        email: result.profile.email,
        name: result.profile.name ?? undefined,
        provider: result.profile.provider,
      });
      router.push('/(auth)/profile-select');
    } catch (err) {
      if (err instanceof SocialLoginCancelled) {
        return; // desistiu: não é erro
      }
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : `Não foi possível entrar com ${PROVIDER_LABEL[provider]}.`;
      onError?.(message);
    } finally {
      setPending(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>ou continue com</Text>
        <View style={styles.dividerLine} />
      </View>

      <Button
        label="Google"
        icon="logo-google"
        variant="outline"
        loading={pending === 'google'}
        disabled={pending !== null}
        onPress={() => handlePress('google')}
      />
      <Button
        label="Facebook"
        icon="logo-facebook"
        variant="outline"
        loading={pending === 'facebook'}
        disabled={pending !== null}
        onPress={() => handlePress('facebook')}
        style={styles.spaced}
      />
    </View>
  );
}

const createStyles = (colors: ThemeColors, _typography: Typography) =>
  StyleSheet.create({
    container: {
      marginTop: spacing.xl,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
    },
    dividerText: {
      marginHorizontal: spacing.md,
      fontSize: 12,
      color: colors.textSecondary,
    },
    spaced: {
      marginTop: spacing.md,
    },
  });
