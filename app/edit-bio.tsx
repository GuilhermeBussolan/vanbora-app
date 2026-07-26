import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, Button, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { getMyGuardianProfile, updateGuardianBio } from '@/api/guardian';
import { getMyProfile, updateTransporterBio } from '@/api/transporter';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

const MAX = 1000;

/** Edita a descrição/biografia do usuário (responsável ou transportador). */
export default function EditBioScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token, role } = useAppState();
  const isTransporter = role === 'transporter';
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const load = isTransporter
      ? getMyProfile(token).then((p) => p.bio ?? '')
      : getMyGuardianProfile(token).then((p) => p.bio ?? '');
    load
      .then(setBio)
      .catch((err) => setError(err?.message ?? 'Falha ao carregar.'))
      .finally(() => setLoading(false));
  }, [token, isTransporter]);

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      if (isTransporter) await updateTransporterBio(token, bio.trim());
      else await updateGuardianBio(token, bio.trim());
      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader showBack />
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen footer={<Button label="Salvar descrição" onPress={handleSave} loading={saving} />}>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Descrição</Text>
      <Text style={styles.subtitle}>
        {isTransporter
          ? 'Conte um pouco sobre você e seu serviço — os responsáveis veem no seu perfil.'
          : 'Conte um pouco sobre você — o transportador vê ao receber sua solicitação.'}
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Escreva aqui…"
        placeholderTextColor={colors.textMuted}
        value={bio}
        onChangeText={(v) => setBio(v.slice(0, MAX))}
        multiline
        maxLength={MAX}
      />
      <Text style={styles.counter}>
        {bio.length}/{MAX}
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxxl },
    title: { marginTop: spacing.md },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
      lineHeight: 19,
    },
    input: {
      minHeight: 160,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      padding: spacing.md,
      fontSize: 15,
      color: colors.textPrimary,
      backgroundColor: colors.white,
      textAlignVertical: 'top',
      lineHeight: 21,
    },
    counter: { fontSize: 12, color: colors.textMuted, textAlign: 'right', marginTop: spacing.xs },
    error: { fontSize: 13, color: colors.danger, marginTop: spacing.md },
  });
