import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Card, CheckboxRow, Screen, SectionTitle } from '@/components';
import { useAppState } from '@/context/AppState';
import { completeChecklist, getChecklist } from '@/api/checklists';
import { ApiError, mediaUrl, UploadFile } from '@/api/client';
import { takeCameraPhoto } from '@/lib/imagePicker';
import { formatDate, formatTime } from '@/lib/dateFormat';
import { SafetyChecklistDto } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

const MAX_PHOTOS = 5;

const ITEM_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  INTERIOR_WALKTHROUGH: 'walk-outline',
  SEATS_AND_FLOOR: 'search-outline',
  NO_CHILD_LEFT: 'shield-checkmark-outline',
};

/**
 * Checklist de segurança pós-percurso — o mesmo para motorista e monitor. Pendente: confirma
 * os itens e fotografa o interior da van (câmera, obrigatória). Concluído: mostra quem
 * realizou e quando, para o outro profissional saber que a verificação já foi feita.
 */
export default function SafetyChecklistScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const { id } = useLocalSearchParams<{ id: string }>();
  const checklistId = Number(id);

  const [checklist, setChecklist] = useState<SafetyChecklistDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [photos, setPhotos] = useState<UploadFile[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(() => {
    if (!token || !checklistId) return;
    setError(null);
    getChecklist(token, checklistId)
      .then(setChecklist)
      .catch((err) => setError(err?.message ?? 'Não foi possível carregar o checklist.'))
      .finally(() => setLoading(false));
  }, [token, checklistId]);

  useFocusEffect(load);

  function toggle(code: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  }

  async function handleTakePhoto() {
    const photo = await takeCameraPhoto();
    if (photo) setPhotos((prev) => [...prev, photo].slice(0, MAX_PHOTOS));
  }

  async function handleComplete() {
    if (!token || !checklist) return;
    setSubmitting(true);
    setError(null);
    try {
      const done = await completeChecklist(token, checklist.id, Array.from(checked), photos);
      setChecklist(done);
      setPhotos([]);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // Outro profissional concluiu primeiro: mostra o estado atualizado (quem e quando).
        Alert.alert('Verificação já realizada', err.message);
        load();
      } else {
        // Falha no envio (ex.: upload): nada foi concluído — pode tentar de novo.
        setError(err instanceof Error ? err.message : 'Falha ao concluir a verificação.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Segurança da van" showBack />
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      </Screen>
    );
  }

  if (!checklist) {
    return (
      <Screen>
        <AppHeader title="Segurança da van" showBack />
        <Card>
          <Text style={styles.empty}>{error ?? 'Checklist não encontrado.'}</Text>
        </Card>
      </Screen>
    );
  }

  const pending = checklist.status === 'PENDING';
  const allChecked = checklist.items.every((item) => checked.has(item.code));
  const canSubmit = allChecked && photos.length > 0;

  return (
    <Screen
      footer={
        pending ? (
          <Button
            label="Concluir verificação"
            icon="checkmark-circle-outline"
            onPress={handleComplete}
            loading={submitting}
            disabled={!canSubmit}
          />
        ) : undefined
      }
    >
      <AppHeader title="Segurança da van" showBack />

      {pending ? (
        <Card style={styles.pendingCard}>
          <Text style={styles.statusTitle}>⚠️ Verificação de segurança pendente</Text>
          <Text style={styles.statusText}>
            {checklist.tripName} • encerrado às {formatTime(checklist.tripFinishedAt)} de{' '}
            {formatDate(checklist.tripFinishedAt)}
          </Text>
          <Text style={styles.statusHint}>
            Confira todo o interior da van e registre a foto. Apenas um profissional precisa
            concluir.
          </Text>
        </Card>
      ) : (
        <Card style={styles.doneCard}>
          <Text style={styles.statusTitle}>✅ Verificação concluída</Text>
          <View style={styles.detailRow}>
            <Ionicons name="git-branch-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.detailText}>Percurso: {checklist.tripName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.detailText}>
              Realizada por: {checklist.completedByMe ? 'você' : checklist.completedByName} —{' '}
              {checklist.completedByRole}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.detailText}>Data: {formatDate(checklist.completedAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.detailText}>Horário: {formatTime(checklist.completedAt)}</Text>
          </View>
          {!checklist.completedByMe ? (
            <Text style={styles.statusHint}>Este checklist já foi realizado por outro profissional.</Text>
          ) : null}
          {checklist.guardiansNotified != null ? (
            <View style={styles.detailRow}>
              <Ionicons name="notifications-outline" size={14} color={colors.success} />
              <Text style={styles.notifiedText}>
                {checklist.guardiansNotified === 1
                  ? '1 responsável avisado'
                  : `${checklist.guardiansNotified} responsáveis avisados`}
              </Text>
            </View>
          ) : null}
        </Card>
      )}

      <SectionTitle title="Itens conferidos" style={styles.section} />
      {checklist.items.map((item) => (
        <CheckboxRow
          key={item.code}
          icon={ITEM_ICONS[item.code] ?? 'checkmark-outline'}
          label={item.label}
          checked={pending ? checked.has(item.code) : item.confirmed}
          onToggle={() => (pending ? toggle(item.code) : undefined)}
        />
      ))}

      <SectionTitle title="Foto do interior da van" style={styles.section} />
      {pending ? (
        <>
          <Text style={styles.hint}>
            Obrigatória. Use a câmera para fotografar o interior agora (até {MAX_PHOTOS} fotos).
          </Text>
          {photos.length > 0 ? (
            <View style={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={photo.uri} style={styles.photoWrap}>
                  <Image source={{ uri: photo.uri }} style={styles.photo} />
                  <Pressable
                    onPress={() => setPhotos((prev) => prev.filter((_, i) => i !== index))}
                    style={styles.removeBadge}
                    hitSlop={8}
                    accessibilityLabel="Remover foto"
                  >
                    <Ionicons name="close" size={14} color={colors.white} />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
          {photos.length < MAX_PHOTOS ? (
            <Button
              label={photos.length === 0 ? 'Tirar foto do interior' : 'Tirar outra foto'}
              variant="outline"
              icon="camera-outline"
              onPress={handleTakePhoto}
              style={styles.cameraBtn}
            />
          ) : null}
          {!canSubmit ? (
            <Text style={styles.requirement}>
              {!allChecked ? 'Confirme todos os itens' : 'Tire ao menos uma foto'} para concluir.
            </Text>
          ) : null}
        </>
      ) : checklist.photos.some((p) => p.available && p.url) ? (
        <>
          <View style={styles.photoGrid}>
            {checklist.photos
              .filter((p) => p.available && p.url)
              .map((p) => (
                <Image key={p.id} source={{ uri: mediaUrl(p.url) }} style={styles.photo} />
              ))}
          </View>
          <Text style={styles.hint}>
            As fotos serão excluídas automaticamente em {formatDate(checklist.photosPurgeAt)}. O
            registro da verificação permanece.
          </Text>
        </>
      ) : (
        <Card>
          <Text style={styles.empty}>
            {checklist.photoCount > 0
              ? `${checklist.photoCount} foto(s) registrada(s), excluída(s) em ${formatDate(
                  checklist.photosPurgedAt ?? checklist.photosPurgeAt,
                )} pela retenção de 15 dias. O registro da verificação permanece.`
              : 'Sem fotos.'}
          </Text>
        </Card>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  loader: { marginTop: spacing.xxxl },
  empty: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  pendingCard: { gap: spacing.sm, borderColor: colors.warning, backgroundColor: colors.warningBg },
  doneCard: { gap: spacing.sm, borderColor: colors.success, backgroundColor: colors.successBg },
  statusTitle: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  statusText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  statusHint: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  detailText: { fontSize: 13, color: colors.textPrimary },
  notifiedText: { fontSize: 13, fontWeight: '600', color: colors.success },
  section: { marginTop: spacing.xl, marginBottom: spacing.sm },
  hint: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.sm, lineHeight: 17 },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  photoWrap: { position: 'relative' },
  photo: { width: 96, height: 96, borderRadius: radius.md, backgroundColor: colors.border },
  removeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBtn: { marginTop: spacing.xs },
  requirement: { fontSize: 12, color: colors.warning, marginTop: spacing.sm, fontWeight: '600' },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.md },
});
