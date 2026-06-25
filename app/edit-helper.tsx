import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Avatar, Button, Input, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { deleteHelper, updateHelper, uploadHelperPhoto } from '@/api/helpers';
import { mediaUrl } from '@/api/client';
import { pickImage } from '@/lib/imagePicker';
import { HELPER_ROLES } from '@/lib/helperRoles';
import { colors, radius, spacing, typography } from '@/theme';

/** Edição de um ajudante: nome, função, foto, situação e exclusão. */
export default function EditHelperScreen() {
  const { token } = useAppState();
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    role?: string;
    active?: string;
    photoUrl?: string;
  }>();
  const helperId = Number(params.id);

  const [name, setName] = useState(params.name ?? '');
  const [role, setRole] = useState(params.role ?? '');
  const [active, setActive] = useState(params.active !== '0');
  const [photoUrl, setPhotoUrl] = useState<string | null>(params.photoUrl || null);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleOptions = HELPER_ROLES.includes(role) || !role ? HELPER_ROLES : [role, ...HELPER_ROLES];

  async function handleChangePhoto() {
    if (!token) return;
    const file = await pickImage();
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const updated = await uploadHelperPhoto(token, helperId, file);
      setPhotoUrl(updated.photoUrl);
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Falha ao enviar a foto.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave() {
    if (!name.trim() || !role.trim()) {
      setError('Preencha o nome e a função.');
      return;
    }
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await updateHelper(token, helperId, { name: name.trim(), role: role.trim(), active });
      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao salvar o ajudante.');
    } finally {
      setLoading(false);
    }
  }

  function handleDelete() {
    Alert.alert('Excluir ajudante', `Remover "${name}" definitivamente?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          if (!token) return;
          try {
            await deleteHelper(token, helperId);
            router.back();
          } catch (err: any) {
            Alert.alert('Erro', err?.message ?? 'Falha ao excluir.');
          }
        },
      },
    ]);
  }

  return (
    <Screen footer={<Button label="Salvar alterações" onPress={handleSave} loading={loading} />}>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Editar Ajudante</Text>

      <View style={styles.photoSection}>
        <Pressable onPress={handleChangePhoto} style={styles.photoWrap}>
          <Avatar name={name} size={84} tone="neutral" uri={mediaUrl(photoUrl)} />
          <View style={styles.photoBadge}>
            <Ionicons name="camera" size={16} color={colors.textOnBrand} />
          </View>
        </Pressable>
        <Text style={styles.photoHint}>{uploadingPhoto ? 'Enviando…' : 'Toque para mudar a foto'}</Text>
      </View>

      <Text style={styles.fieldLabel}>Nome</Text>
      <Input
        icon="person-outline"
        placeholder="Nome do ajudante"
        value={name}
        onChangeText={setName}
        containerStyle={styles.field}
      />

      <Text style={styles.fieldLabel}>Função</Text>
      <View style={styles.chips}>
        {roleOptions.map((r) => {
          const selected = r === role;
          return (
            <Pressable key={r} onPress={() => setRole(r)} style={[styles.chip, selected && styles.chipActive]}>
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>{r}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.activeRow}>
        <View style={styles.flex1}>
          <Text style={styles.activeLabel}>Ativo no perfil público</Text>
          <Text style={styles.activeHint}>Inativos não aparecem para os responsáveis.</Text>
        </View>
        <Switch
          value={active}
          onValueChange={setActive}
          trackColor={{ true: colors.brand, false: colors.border }}
          thumbColor={colors.white}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable onPress={handleDelete} style={styles.deleteRow}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
        <Text style={styles.deleteText}>Excluir ajudante</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.md, marginBottom: spacing.lg },
  photoSection: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  photoWrap: { position: 'relative' },
  photoBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  photoHint: { fontSize: 12, color: colors.textSecondary },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.sm },
  field: { marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.textOnBrand },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  flex1: { flex: 1 },
  activeLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  activeHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.md },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  deleteText: { fontSize: 15, fontWeight: '700', color: colors.danger },
});
