import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, Button, Input, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { changePassword } from '@/api/account';
import { ApiError } from '@/api/client';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Troca de senha do usuário autenticado. */
export default function ChangePasswordScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!current || !next || !confirm) {
      setError('Preencha todos os campos.');
      return;
    }
    if (next.length < 6) {
      setError('A nova senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (next !== confirm) {
      setError('A confirmação não corresponde à nova senha.');
      return;
    }
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await changePassword(token, current, next);
      Alert.alert('Senha alterada', 'Sua senha foi atualizada com sucesso.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      const message =
        err instanceof ApiError && err.status === 400
          ? err.message
          : err?.message ?? 'Falha ao alterar a senha.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen footer={<Button label="Salvar nova senha" onPress={handleSave} loading={loading} />}>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Alterar Senha</Text>

      <Input
        icon="lock-closed-outline"
        placeholder="Senha atual"
        password
        value={current}
        onChangeText={setCurrent}
        containerStyle={styles.field}
      />
      <Input
        icon="lock-closed-outline"
        placeholder="Nova senha"
        password
        value={next}
        onChangeText={setNext}
        containerStyle={styles.field}
      />
      <Input
        icon="lock-closed-outline"
        placeholder="Confirmar nova senha"
        password
        value={confirm}
        onChangeText={setConfirm}
        containerStyle={styles.field}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  title: { marginTop: spacing.md, marginBottom: spacing.xl },
  field: { marginBottom: spacing.md },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.sm },
});
