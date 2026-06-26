import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Card, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { getMyProfile, updateContractTemplate } from '@/api/transporter';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Define o modelo de contrato (texto) que o responsável lê ao assinar. */
export default function EditContractTemplateScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [template, setTemplate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    if (token) {
      getMyProfile(token)
        .then((p) => active && setTemplate(p.contractTemplate ?? ''))
        .catch(() => undefined)
        .finally(() => active && setLoading(false));
    }
    return () => {
      active = false;
    };
  }, [token]);

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    try {
      await updateContractTemplate(token, template.trim() ? template : null);
      Alert.alert('Pronto', 'Seu modelo de contrato foi salvo.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Falha ao salvar o modelo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen
      footer={
        <Button label="Salvar modelo" icon="save-outline" onPress={handleSave} loading={saving} />
      }
    >
      <AppHeader title="Modelo de Contrato" showBack />

      <Card style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color={colors.brandDark} />
        <Text style={styles.infoText}>
          Escreva o texto do seu contrato. Ele aparece para o responsável ler e assinar. Um cabeçalho
          com as partes, aluno, escola, valor e data é sempre adicionado automaticamente. Se deixar em
          branco, usamos um contrato padrão.
        </Text>
      </Card>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loading} />
      ) : (
        <View style={styles.field}>
          <Text style={styles.label}>Texto do contrato</Text>
          <TextInput
            style={styles.textArea}
            value={template}
            onChangeText={setTemplate}
            placeholder="Ex.: Cláusula 1ª — Do objeto..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.hint}>{template.trim().length} caracteres</Text>
        </View>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    infoCard: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignItems: 'flex-start',
      marginTop: spacing.md,
      backgroundColor: colors.brandSoft,
      borderColor: colors.brand,
    },
    infoText: { flex: 1, fontSize: 12, lineHeight: 18, color: colors.textSecondary },
    loading: { marginTop: spacing.xxl },
    field: { marginTop: spacing.lg },
    label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
    textArea: {
      minHeight: 280,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: radius.md,
      backgroundColor: colors.white,
      padding: spacing.md,
      fontSize: 14,
      lineHeight: 21,
      color: colors.textPrimary,
    },
    hint: { fontSize: 11, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'right' },
  });
