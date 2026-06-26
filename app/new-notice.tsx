import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { createNotice } from '@/api/notices';
import { consumeAudienceResult, openAudience } from '@/lib/audienceSelection';
import { NoticePriority } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

type Mode = 'now' | 'schedule';

/** Criação de aviso: título, mensagem, prioridade, comentários, destinatários, agendamento. */
export default function NewNoticeScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<NoticePriority>('INFO');
  const [allowComments, setAllowComments] = useState(true);
  const [recipients, setRecipients] = useState<number[] | null>(null); // null = todos
  const [mode, setMode] = useState<Mode>('now');
  const [hours, setHours] = useState('1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recebe a seleção de destinatários ao voltar da tela de público.
  useFocusEffect(
    useCallback(() => {
      const result = consumeAudienceResult();
      if (result !== undefined) setRecipients(result);
    }, []),
  );

  function openRecipients() {
    openAudience(recipients);
    router.push('/notice-audience');
  }

  async function handleSubmit() {
    if (!message.trim()) {
      setError('Escreva a mensagem do aviso.');
      return;
    }
    let publishInHours: number | null = null;
    if (mode === 'schedule') {
      const parsed = parseInt(hours, 10);
      if (Number.isNaN(parsed) || parsed < 1 || parsed > 168) {
        setError('Informe um número de horas entre 1 e 168 (1 semana).');
        return;
      }
      publishInHours = parsed;
    }
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await createNotice(token, {
        title: title.trim() || null,
        message: message.trim(),
        publishInHours,
        allowComments,
        priority,
        recipientGuardianIds: recipients,
      });
      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao criar o aviso.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen
      footer={
        <Button
          label={mode === 'now' ? 'Publicar agora' : 'Agendar aviso'}
          icon={mode === 'now' ? 'send' : 'time-outline'}
          onPress={handleSubmit}
          loading={loading}
        />
      }
    >
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Novo Aviso</Text>

      <TextInput
        style={styles.titleInput}
        placeholder="Título (opcional)"
        placeholderTextColor={colors.textMuted}
        value={title}
        onChangeText={setTitle}
        maxLength={120}
      />

      <TextInput
        style={styles.textarea}
        placeholder="Escreva o aviso para os responsáveis..."
        placeholderTextColor={colors.textMuted}
        value={message}
        onChangeText={setMessage}
        multiline
        maxLength={600}
      />
      <Text style={styles.counter}>{message.length}/600</Text>

      <Text style={[typography.sectionTitle, styles.section]}>Destinatários</Text>
      <Pressable style={styles.recipientsRow} onPress={openRecipients}>
        <Ionicons name="people-outline" size={18} color={colors.textSecondary} />
        <Text style={styles.recipientsText}>
          {recipients === null || recipients.length === 0
            ? 'Todos os responsáveis'
            : `${recipients.length} responsável(is) selecionado(s)`}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Text style={[typography.sectionTitle, styles.section]}>Prioridade</Text>
      <View style={styles.modeRow}>
        <Chip
          label="Informativo"
          icon="information-circle-outline"
          active={priority === 'INFO'}
          onPress={() => setPriority('INFO')}
        />
        <Chip
          label="Urgente"
          icon="alert-circle-outline"
          active={priority === 'URGENT'}
          onPress={() => setPriority('URGENT')}
          danger
        />
      </View>

      <View style={styles.switchRow}>
        <View style={styles.flex}>
          <Text style={styles.switchLabel}>Aceitar comentários</Text>
          <Text style={styles.switchHint}>Permite que os responsáveis comentem neste aviso.</Text>
        </View>
        <Switch
          value={allowComments}
          onValueChange={setAllowComments}
          trackColor={{ true: colors.brand, false: colors.border }}
          thumbColor={colors.white}
        />
      </View>

      <Text style={[typography.sectionTitle, styles.section]}>Quando publicar</Text>
      <View style={styles.modeRow}>
        <Chip label="Agora" icon="flash-outline" active={mode === 'now'} onPress={() => setMode('now')} />
        <Chip
          label="Agendar"
          icon="calendar-outline"
          active={mode === 'schedule'}
          onPress={() => setMode('schedule')}
        />
      </View>

      {mode === 'schedule' ? (
        <View style={styles.scheduleRow}>
          <Text style={styles.scheduleLabel}>Publicar daqui</Text>
          <TextInput
            style={styles.hoursInput}
            value={hours}
            onChangeText={setHours}
            keyboardType="number-pad"
            maxLength={3}
          />
          <Text style={styles.scheduleLabel}>horas</Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

function Chip({
  label,
  icon,
  active,
  onPress,
  danger,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const activeBg = danger ? colors.danger : colors.brand;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: activeBg, borderColor: activeBg }]}
    >
      <Ionicons
        name={icon}
        size={15}
        color={active ? colors.white : colors.textSecondary}
      />
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  title: { marginTop: spacing.md, marginBottom: spacing.lg },
  titleInput: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  recipientsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
  },
  recipientsText: { flex: 1, fontSize: 14, color: colors.textPrimary },
  textarea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    padding: spacing.lg,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  counter: { fontSize: 11, color: colors.textMuted, alignSelf: 'flex-end', marginTop: spacing.xs },
  section: { marginTop: spacing.xl, marginBottom: spacing.md },
  modeRow: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  chipText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  flex: { flex: 1 },
  switchLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  switchHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
  scheduleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  scheduleLabel: { fontSize: 14, color: colors.textPrimary },
  hoursInput: {
    width: 64,
    height: 44,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.lg },
});
