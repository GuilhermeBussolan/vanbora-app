import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { getMyNotice, updateNotice } from '@/api/notices';
import { consumeAudienceResult, openAudience } from '@/lib/audienceSelection';
import { NoticePriority } from '@/types';
import { colors, radius, spacing, typography } from '@/theme';

/** Edição de aviso: título, texto, prioridade, comentários, destinatários, reagendamento. */
export default function EditNoticeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const noticeId = Number(id);
  const { token } = useAppState();

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState<NoticePriority>('INFO');
  const [allowComments, setAllowComments] = useState(true);
  const [audienceChanged, setAudienceChanged] = useState(false);
  const [recipients, setRecipients] = useState<number[] | null>(null); // só usado se audienceChanged
  const [reschedule, setReschedule] = useState(false);
  const [hours, setHours] = useState('1');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getMyNotice(token, noticeId)
      .then((n) => {
        setTitle(n.title ?? '');
        setMessage(n.message);
        setPriority(n.priority);
        setAllowComments(n.allowComments);
      })
      .catch(() => setError('Não foi possível carregar o aviso.'))
      .finally(() => setLoading(false));
  }, [token, noticeId]);

  useFocusEffect(
    useCallback(() => {
      const result = consumeAudienceResult();
      if (result !== undefined) {
        setRecipients(result);
        setAudienceChanged(true);
      }
    }, []),
  );

  function openRecipients() {
    openAudience(audienceChanged ? recipients : null);
    router.push('/notice-audience');
  }

  async function handleSave() {
    if (!message.trim()) {
      setError('A mensagem não pode ficar vazia.');
      return;
    }
    let publishInHours: number | null = null;
    if (reschedule) {
      const parsed = parseInt(hours, 10);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 168) {
        setError('Horas inválidas (0 = publicar agora, até 168).');
        return;
      }
      publishInHours = parsed;
    }
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await updateNotice(token, noticeId, {
        title: title.trim() || null,
        message: message.trim(),
        priority,
        allowComments,
        publishInHours,
        // null = mantém o público atual; senão regrava (vazio = todos).
        recipientGuardianIds: audienceChanged ? recipients ?? [] : null,
      });
      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao salvar o aviso.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader showBack />
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xxl }} />
      </Screen>
    );
  }

  return (
    <Screen footer={<Button label="Salvar alterações" onPress={handleSave} loading={saving} />}>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Editar Aviso</Text>

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
          {!audienceChanged
            ? 'Manter público atual'
            : recipients === null || recipients.length === 0
              ? 'Todos os responsáveis'
              : `${recipients.length} responsável(is) selecionado(s)`}
        </Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Pressable>

      <Text style={[typography.sectionTitle, styles.section]}>Prioridade</Text>
      <View style={styles.row}>
        <Chip label="Informativo" icon="information-circle-outline" active={priority === 'INFO'} onPress={() => setPriority('INFO')} />
        <Chip label="Urgente" icon="alert-circle-outline" active={priority === 'URGENT'} danger onPress={() => setPriority('URGENT')} />
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.switchLabel}>Aceitar comentários</Text>
        <Switch
          value={allowComments}
          onValueChange={setAllowComments}
          trackColor={{ true: colors.brand, false: colors.border }}
          thumbColor={colors.white}
        />
      </View>

      <View style={styles.switchRow}>
        <View style={styles.flex}>
          <Text style={styles.switchLabel}>Reagendar publicação</Text>
          <Text style={styles.switchHint}>0 horas = publicar agora; antecipa ou adia o aviso.</Text>
        </View>
        <Switch
          value={reschedule}
          onValueChange={setReschedule}
          trackColor={{ true: colors.brand, false: colors.border }}
          thumbColor={colors.white}
        />
      </View>

      {reschedule ? (
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
  const activeBg = danger ? colors.danger : colors.brand;
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && { backgroundColor: activeBg, borderColor: activeBg }]}>
      <Ionicons name={icon} size={15} color={active ? colors.white : colors.textSecondary} />
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  row: { flexDirection: 'row', gap: spacing.sm },
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
