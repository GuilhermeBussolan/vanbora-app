import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Avatar, Button, Input, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { addHelper, uploadHelperPhoto } from '@/api/helpers';
import { UploadFile } from '@/api/client';
import { pickImage } from '@/lib/imagePicker';
import { HELPER_ROLES } from '@/lib/helperRoles';
import { colors, radius, spacing, typography } from '@/theme';

/** Cadastro de um novo ajudante/monitor do transportador. */
export default function AddHelperScreen() {
  const { token } = useAppState();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [photo, setPhoto] = useState<UploadFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePickPhoto() {
    const file = await pickImage();
    if (file) setPhoto(file);
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
      const created = await addHelper(token, { name: name.trim(), role: role.trim() });
      if (photo) {
        await uploadHelperPhoto(token, created.id, photo);
      }
      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao cadastrar ajudante.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen footer={<Button label="Salvar ajudante" onPress={handleSave} loading={loading} />}>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Adicionar Ajudante</Text>
      <Text style={styles.subtitle}>Cadastre um monitor ou auxiliar da sua equipe.</Text>

      <View style={styles.photoSection}>
        <Pressable onPress={handlePickPhoto} style={styles.photoWrap}>
          <Avatar name={name} size={84} tone="neutral" uri={photo?.uri} />
          <View style={styles.photoBadge}>
            <Ionicons name="camera" size={16} color={colors.textOnBrand} />
          </View>
        </Pressable>
        <Text style={styles.photoHint}>Foto (opcional)</Text>
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
        {HELPER_ROLES.map((r) => {
          const selected = r === role;
          return (
            <Pressable key={r} onPress={() => setRole(r)} style={[styles.chip, selected && styles.chipActive]}>
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>{r}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.md },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
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
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.sm },
});
