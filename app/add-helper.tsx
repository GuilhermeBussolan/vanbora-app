import React, { useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Avatar, Button, Input, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { addHelper, uploadHelperPhoto } from '@/api/helpers';
import { UploadFile } from '@/api/client';
import { pickImage } from '@/lib/imagePicker';
import { HELPER_ROLES, isMonitorRole } from '@/lib/helperRoles';
import { isValidEmail, isValidPhone } from '@/lib/validation';
import { MonitorAccessFields, MonitorAccessValue } from '@/components/feature/MonitorAccessFields';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Cadastro de um novo ajudante/monitor do transportador. */
export default function AddHelperScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [photo, setPhoto] = useState<UploadFile | null>(null);
  const [grantAccess, setGrantAccess] = useState(true);
  const [access, setAccess] = useState<MonitorAccessValue>({ email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monitor = isMonitorRole(role);

  async function handlePickPhoto() {
    const file = await pickImage();
    if (file) setPhoto(file);
  }

  async function handleSave() {
    if (!name.trim() || !role.trim()) {
      setError('Preencha o nome e a função.');
      return;
    }
    const withAccess = monitor && grantAccess;
    if (withAccess) {
      if (!isValidEmail(access.email.trim())) {
        setError('Informe um e-mail válido para o acesso do monitor.');
        return;
      }
      if (!isValidPhone(access.phone)) {
        setError('Telefone inválido. Informe DDD + número (11 dígitos).');
        return;
      }
      if (access.password.length < 6) {
        setError('A senha provisória deve ter ao menos 6 caracteres.');
        return;
      }
    }
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const created = await addHelper(token, {
        name: name.trim(),
        role: role.trim(),
        access: withAccess
          ? { email: access.email.trim(), phone: access.phone, password: access.password }
          : undefined,
      });
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
      <Text style={styles.subtitle}>Cadastre um monitor ou auxiliar da sua equipe. Monitores podem receber acesso ao app.</Text>

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

      {monitor ? (
        <>
          <View style={styles.accessRow}>
            <View style={styles.flex1}>
              <Text style={styles.accessLabel}>Acesso ao app</Text>
              <Text style={styles.accessHint}>
                O monitor vê só os alunos, as verificações de segurança e as conversas dos percursos
                em que você o escalar. Sem acesso ao financeiro.
              </Text>
            </View>
            <Switch
              value={grantAccess}
              onValueChange={setGrantAccess}
              trackColor={{ true: colors.brand, false: colors.border }}
              thumbColor={colors.white}
            />
          </View>
          {grantAccess ? <MonitorAccessFields value={access} onChange={setAccess} /> : null}
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
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
  accessRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xl, marginBottom: spacing.md },
  flex1: { flex: 1 },
  accessLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  accessHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.sm },
});
