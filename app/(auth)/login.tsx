import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, Button, Input, Logo, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { ApiError } from '@/api/client';
import { colors, spacing, typography } from '@/theme';

/** Login real contra a API: roteia para Responsável ou Transportador conforme o papel. */
export default function LoginScreen() {
  const { login, setHasTransporter } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError('Informe e-mail e senha.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const role = await login(email.trim(), password);
      if (role === 'transporter') {
        router.replace('/(transporter)/home');
      } else {
        setHasTransporter(true);
        router.replace('/(guardian)/home');
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.status === 401 || err.status === 403
            ? 'E-mail ou senha inválidos.'
            : err.message
          : 'Falha ao entrar. Tente novamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen contentStyle={styles.content}>
      <AppHeader showBack onBack={() => router.back()} />

      <View style={styles.logo}>
        <Logo size={30} />
      </View>

      <Text style={[typography.title, styles.title]}>Acesse sua conta</Text>
      <Text style={styles.subtitle}>Insira seu e-mail e senha para continuar</Text>

      <View style={styles.form}>
        <Input
          icon="mail-outline"
          placeholder="E-mail"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Input
          icon="lock-closed-outline"
          placeholder="Senha"
          password
          value={password}
          onChangeText={setPassword}
          containerStyle={styles.spaced}
        />
        <Pressable hitSlop={8} style={styles.forgot}>
          <Text style={styles.forgotText}>Esqueci minha senha</Text>
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <Button label="Entrar" onPress={handleLogin} loading={loading} style={styles.submit} />

      <Text style={styles.demoHint}>
        Demo · responsável: mariana@vanbora.com · transportador: roberto@vanbora.com · senha: 123456
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  logo: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  form: {
    flex: 1,
  },
  spaced: {
    marginTop: spacing.md,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginTop: spacing.md,
  },
  forgotText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  submit: {
    marginTop: spacing.xl,
  },
  error: {
    color: colors.danger,
    fontSize: 13,
    marginTop: spacing.md,
  },
  demoHint: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
    marginTop: spacing.lg,
    lineHeight: 16,
  },
});
