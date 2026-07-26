import React, { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Avatar, Button, Input, Screen, SchoolPicker } from '@/components';
import { useAppState } from '@/context/AppState';
import { deleteDependent, updateDependent, uploadDependentPhoto } from '@/api/dependents';
import { mediaUrl } from '@/api/client';
import { pickImage } from '@/lib/imagePicker';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Edição e exclusão dos dados de um dependente. */
export default function EditDependentScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token, refreshDependents } = useAppState();
  const params = useLocalSearchParams<{ id?: string; name?: string; school?: string; photoUrl?: string }>();
  const id = Number(params.id);

  const [name, setName] = useState(params.name ?? '');
  const [schoolName, setSchoolName] = useState(params.school ?? '');
  const [schoolId, setSchoolId] = useState<number | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(params.photoUrl || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChangePhoto() {
    if (!token) return;
    const file = await pickImage();
    if (!file) return;
    setUploadingPhoto(true);
    setError(null);
    try {
      const updated = await uploadDependentPhoto(token, id, file);
      setPhotoUrl(updated.photoUrl);
      await refreshDependents();
    } catch (e: any) {
      setError(e?.message ?? 'Falha ao enviar a foto.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave() {
    if (!name.trim() || !schoolName.trim()) {
      setError('Preencha o nome e a escola.');
      return;
    }
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await updateDependent(token, id, { name: name.trim(), school: schoolName, schoolId });
      await refreshDependents();
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  async function doDelete() {
    if (!token) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteDependent(token, id);
      await refreshDependents();
      router.back();
    } catch (e: any) {
      setError(e?.message ?? 'Falha ao excluir.');
    } finally {
      setDeleting(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      'Excluir dependente',
      `Tem certeza que deseja excluir ${name || 'este dependente'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: doDelete },
      ],
    );
  }

  return (
    <Screen footer={<Button label="Salvar alterações" onPress={handleSave} loading={saving} />}>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Editar Dependente</Text>
      <Text style={styles.subtitle}>Atualize os dados do aluno.</Text>

      <View style={styles.photoRow}>
        <Pressable onPress={handleChangePhoto} style={styles.photoWrap}>
          <Avatar name={name || 'Aluno'} size={72} tone="neutral" uri={mediaUrl(photoUrl)} />
          <View style={styles.photoBadge}>
            {uploadingPhoto ? (
              <ActivityIndicator size="small" color={colors.textOnBrand} />
            ) : (
              <Ionicons name="camera" size={15} color={colors.textOnBrand} />
            )}
          </View>
        </Pressable>
      </View>

      <Input
        icon="person-outline"
        placeholder="Nome do aluno"
        value={name}
        onChangeText={setName}
        containerStyle={styles.field}
      />
      <Text style={styles.fieldLabel}>Escola</Text>
      <Pressable style={styles.picker} onPress={() => setPickerOpen(true)}>
        <Ionicons name="school-outline" size={18} color={colors.textMuted} />
        <Text style={[styles.pickerText, !schoolName && styles.pickerPlaceholder]}>
          {schoolName || 'Selecionar escola'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <SchoolPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(s) => {
          setSchoolId(s.id);
          setSchoolName(s.name);
        }}
      />

      <Pressable style={styles.deleteBtn} onPress={confirmDelete} disabled={deleting}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
        <Text style={styles.deleteText}>{deleting ? 'Excluindo...' : 'Excluir dependente'}</Text>
      </Pressable>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    title: { marginTop: spacing.md },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      marginBottom: spacing.xl,
    },
    photoRow: { alignItems: 'center', marginBottom: spacing.lg },
    photoWrap: { position: 'relative' },
    photoBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.white,
    },
    field: { marginBottom: spacing.md },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    picker: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      height: 50,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.white,
    },
    pickerText: { flex: 1, fontSize: 14, color: colors.textPrimary },
    pickerPlaceholder: { color: colors.textMuted },
    error: { fontSize: 13, color: colors.danger, marginTop: spacing.sm },
    deleteBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.xxl,
      paddingVertical: spacing.md,
    },
    deleteText: { fontSize: 15, fontWeight: '700', color: colors.danger },
  });
