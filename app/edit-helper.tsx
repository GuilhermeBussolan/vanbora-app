import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Avatar, Badge, Button, Input, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { deleteHelper, revokeHelperAccess, setHelperAccess, updateHelper, uploadHelperPhoto } from '@/api/helpers';
import { mediaUrl } from '@/api/client';
import { pickImage } from '@/lib/imagePicker';
import { HELPER_ROLES, isMonitorRole } from '@/lib/helperRoles';
import { isValidEmail, isValidPhone } from '@/lib/validation';
import { MonitorAccessFields, MonitorAccessValue } from '@/components/feature/MonitorAccessFields';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Edição de um ajudante: nome, função, foto, situação, acesso ao app (monitor) e exclusão. */
export default function EditHelperScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    role?: string;
    active?: string;
    photoUrl?: string;
    hasAccess?: string;
    accessActive?: string;
    email?: string;
    phone?: string;
  }>();
  const helperId = Number(params.id);

  const [name, setName] = useState(params.name ?? '');
  const [role, setRole] = useState(params.role ?? '');
  const [active, setActive] = useState(params.active !== '0');
  const [photoUrl, setPhotoUrl] = useState<string | null>(params.photoUrl || null);
  const [hasAccess, setHasAccess] = useState(params.hasAccess === '1');
  const [grantAccess, setGrantAccess] = useState(false);
  const initialAccess = { email: params.email ?? '', phone: params.phone ?? '', password: '' };
  const [access, setAccess] = useState<MonitorAccessValue>(initialAccess);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monitor = isMonitorRole(role);
  const accessChanged =
    access.email.trim() !== initialAccess.email ||
    access.phone !== initialAccess.phone ||
    access.password.length > 0;
  // Acesso a gravar: novo (liberado agora) ou alteração dos dados de um acesso existente.
  const saveAccess = monitor && ((hasAccess && accessChanged) || (!hasAccess && grantAccess));

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
    if (saveAccess) {
      if (!isValidEmail(access.email.trim())) {
        setError('Informe um e-mail válido para o acesso do monitor.');
        return;
      }
      if (!isValidPhone(access.phone)) {
        setError('Telefone inválido. Informe DDD + número (11 dígitos).');
        return;
      }
      const needsPassword = !hasAccess;
      if ((needsPassword || access.password.length > 0) && access.password.length < 6) {
        setError('A senha deve ter ao menos 6 caracteres.');
        return;
      }
    }
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await updateHelper(token, helperId, { name: name.trim(), role: role.trim(), active });
      if (saveAccess) {
        await setHelperAccess(token, helperId, {
          email: access.email.trim(),
          phone: access.phone,
          password: access.password || undefined,
        });
      }
      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao salvar o ajudante.');
    } finally {
      setLoading(false);
    }
  }

  function handleRevokeAccess() {
    Alert.alert(
      'Retirar acesso ao app',
      `${name} deixa de entrar no app na hora e sai dos percursos e conversas. Verificações e mensagens já registradas continuam no histórico.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Retirar acesso',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            try {
              await revokeHelperAccess(token, helperId);
              setHasAccess(false);
              setGrantAccess(false);
              setAccess({ email: '', phone: '', password: '' });
            } catch (err: any) {
              Alert.alert('Erro', err?.message ?? 'Falha ao retirar o acesso.');
            }
          },
        },
      ],
    );
  }

  function handleDelete() {
    const consequences = hasAccess
      ? `Remover "${name}"? O monitor perde imediatamente o acesso ao app e sai dos percursos e das conversas. Verificações de segurança e mensagens já registradas continuam no histórico.`
      : `Remover "${name}" definitivamente?`;
    Alert.alert('Excluir ajudante', consequences, [
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
          <Text style={styles.activeHint}>
            {hasAccess
              ? 'Inativos não aparecem para os responsáveis e perdem o acesso ao app até serem reativados.'
              : 'Inativos não aparecem para os responsáveis.'}
          </Text>
        </View>
        <Switch
          value={active}
          onValueChange={setActive}
          trackColor={{ true: colors.brand, false: colors.border }}
          thumbColor={colors.white}
        />
      </View>

      {monitor ? (
        <>
          <View style={styles.activeRow}>
            <View style={styles.flex1}>
              <Text style={styles.activeLabel}>Acesso ao app</Text>
              <Text style={styles.activeHint}>
                {hasAccess
                  ? 'Altere o e-mail, o telefone ou redefina a senha do monitor.'
                  : 'Libere para o monitor ver os alunos, as verificações e as conversas dos percursos em que você o escalar.'}
              </Text>
            </View>
            {hasAccess ? (
              <Badge
                label={params.accessActive === '0' || !active ? 'DESATIVADO' : 'ATIVO'}
                tone={params.accessActive === '0' || !active ? 'neutral' : 'success'}
              />
            ) : (
              <Switch
                value={grantAccess}
                onValueChange={setGrantAccess}
                trackColor={{ true: colors.brand, false: colors.border }}
                thumbColor={colors.white}
              />
            )}
          </View>
          {hasAccess || grantAccess ? (
            <View style={styles.accessFields}>
              <MonitorAccessFields value={access} onChange={setAccess} passwordOptional={hasAccess} />
            </View>
          ) : null}
          {hasAccess ? (
            <Pressable onPress={handleRevokeAccess} style={styles.revokeRow}>
              <Ionicons name="key-outline" size={18} color={colors.danger} />
              <Text style={styles.deleteText}>Retirar acesso ao app</Text>
            </Pressable>
          ) : null}
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable onPress={handleDelete} style={styles.deleteRow}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
        <Text style={styles.deleteText}>Excluir ajudante</Text>
      </Pressable>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
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
  accessFields: { marginTop: spacing.md },
  revokeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
  },
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
