import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Button, Card, Screen, SectionTitle } from '@/components';
import { useAppState } from '@/context/AppState';
import { listContracts } from '@/api/contracts';
import { getMyGuardianProfile, GuardianProfileDto, uploadGuardianPhoto } from '@/api/guardian';
import { mediaUrl } from '@/api/client';
import { pickImage } from '@/lib/imagePicker';
import { ContractDto } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

type SettingItem = { icon: keyof typeof Ionicons.glyphMap; label: string; route: string };

const SETTINGS: SettingItem[] = [
  { icon: 'location-outline', label: 'Meu Endereço', route: '/edit-address' },
  { icon: 'lock-closed-outline', label: 'Alterar Senha', route: '/change-password' },
  { icon: 'notifications-outline', label: 'Notificações', route: '/notifications-settings' },
  { icon: 'moon-outline', label: 'Aparência', route: '/appearance-settings' },
  { icon: 'shield-checkmark-outline', label: 'Privacidade e Dados', route: '/privacy-data' },
  { icon: 'document-text-outline', label: 'Termos de Uso', route: '/terms' },
];

/** Perfil do Responsável: dados, dependentes e configurações. */
export default function GuardianProfileScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { user, token, logout, dependents, selectedDependentId, selectDependent, refreshDependents } =
    useAppState();
  const [activeContract, setActiveContract] = useState<ContractDto | null>(null);
  const [profile, setProfile] = useState<GuardianProfileDto | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Atualiza dependentes, o perfil e o contrato ativo do dependente selecionado ao focar.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (token) {
        refreshDependents();
        getMyGuardianProfile(token)
          .then((p) => active && setProfile(p))
          .catch(() => active && setProfile(null));
        listContracts(token, 'ACTIVE')
          .then(
            (list) =>
              active &&
              setActiveContract(list.find((c) => c.dependentId === selectedDependentId) ?? null),
          )
          .catch(() => active && setActiveContract(null));
      }
      return () => {
        active = false;
      };
    }, [token, selectedDependentId, refreshDependents]),
  );

  async function handleChangePhoto() {
    if (!token) return;
    const file = await pickImage();
    if (!file) return;
    setUploadingPhoto(true);
    try {
      setProfile(await uploadGuardianPhoto(token, file));
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Falha ao enviar a foto.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  function handleLogout() {
    logout();
    router.replace('/(auth)/welcome');
  }

  return (
    <Screen>
      <Text style={[typography.screenTitle, styles.title]}>Meu Perfil</Text>

      <View style={styles.profileRow}>
        <Pressable onPress={handleChangePhoto} style={styles.photoWrap}>
          <Avatar name={user?.name ?? 'Responsável'} size={56} uri={mediaUrl(profile?.photoUrl)} />
          <View style={styles.photoBadge}>
            {uploadingPhoto ? (
              <ActivityIndicator size="small" color={colors.textOnBrand} />
            ) : (
              <Ionicons name="camera" size={14} color={colors.textOnBrand} />
            )}
          </View>
        </Pressable>
        <View style={styles.profileInfo}>
          <Text style={typography.cardTitle}>{user?.name ?? 'Responsável'}</Text>
          <Text style={styles.email}>{user?.email ?? '—'}</Text>
        </View>
      </View>

      <View style={[styles.sectionHeader, styles.section]}>
        <SectionTitle title="Descrição" />
        <Pressable onPress={() => router.push('/edit-bio')} hitSlop={8}>
          <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>
      <Card>
        <Text style={profile?.bio?.trim() ? styles.bioText : styles.bioPlaceholder}>
          {profile?.bio?.trim()
            ? profile.bio
            : 'Adicione uma descrição — o transportador vê ao receber sua solicitação.'}
        </Text>
      </Card>

      <SectionTitle title="Meus Dependentes" style={styles.section} />
      {dependents.length > 1 ? (
        <Text style={styles.sectionHint}>Toque para escolher qual filho(a) o app está exibindo.</Text>
      ) : null}
      <View style={styles.list}>
        {dependents.length === 0 ? (
          <Card>
            <Text style={styles.empty}>Nenhum dependente cadastrado ainda.</Text>
          </Card>
        ) : (
          dependents.map((dep) => {
            const sel = dep.id === selectedDependentId;
            return (
              <Pressable key={dep.id} onPress={() => selectDependent(dep.id)}>
                <Card style={StyleSheet.flatten([styles.dependentCard, sel && styles.dependentCardSel])}>
                  <Avatar name={dep.name} size={40} tone="neutral" uri={mediaUrl(dep.photoUrl)} />
                  <View style={styles.dependentInfo}>
                    <Text style={styles.dependentName}>{dep.name}</Text>
                    <Text style={styles.dependentSchool}>{dep.school}</Text>
                  </View>
                  {sel ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.brandDark} />
                  ) : null}
                  <Pressable
                    hitSlop={8}
                    style={styles.editDep}
                    onPress={() =>
                      router.push({
                        pathname: '/edit-dependent',
                        params: {
                          id: String(dep.id),
                          name: dep.name,
                          school: dep.school,
                          photoUrl: dep.photoUrl ?? '',
                        },
                      })
                    }
                  >
                    <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
                  </Pressable>
                </Card>
              </Pressable>
            );
          })
        )}
      </View>

      <Button
        label="Adicionar Dependente"
        variant="outline"
        icon="add"
        onPress={() => router.push('/add-dependent')}
        style={styles.addBtn}
      />

      {activeContract ? (
        <>
          <SectionTitle title="Meu Transporte" style={styles.section} />
          <Card padded={false}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/review-transporter',
                  params: {
                    transporterId: String(activeContract.transporterId),
                    name: activeContract.transporterName,
                  },
                })
              }
              style={[styles.settingRow, styles.settingDivider]}
            >
              <Ionicons name="star-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.settingLabel}>Reavaliar Transportador</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/review-transporter',
                  params: {
                    mode: 'cancel',
                    contractId: String(activeContract.id),
                    transporterId: String(activeContract.transporterId),
                    name: activeContract.transporterName,
                  },
                })
              }
              style={styles.settingRow}
            >
              <Ionicons name="close-circle-outline" size={18} color={colors.danger} />
              <Text style={[styles.settingLabel, styles.dangerLabel]}>Cancelar Transporte</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          </Card>
        </>
      ) : null}

      <SectionTitle title="Configurações" style={styles.section} />
      <Card padded={false}>
        {SETTINGS.map((item, index) => (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.route as never)}
            style={[styles.settingRow, index < SETTINGS.length - 1 && styles.settingDivider]}
          >
            <Ionicons name={item.icon} size={18} color={colors.textSecondary} />
            <Text style={styles.settingLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </Card>

      <Pressable style={styles.logout} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={styles.logoutText}>Sair</Text>
      </Pressable>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  title: {
    marginBottom: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  photoWrap: { position: 'relative' },
  photoBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bioText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  bioPlaceholder: { fontSize: 14, color: colors.textSecondary, lineHeight: 20, fontStyle: 'italic' },
  profileInfo: {
    gap: 2,
  },
  email: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  section: {
    marginTop: spacing.lg,
  },
  list: {
    gap: spacing.md,
  },
  empty: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  sectionHint: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  dependentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dependentCardSel: {
    borderColor: colors.brand,
    borderWidth: 1.5,
  },
  editDep: {
    padding: 4,
  },
  dependentInfo: {
    flex: 1,
    gap: 2,
  },
  dependentName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  dependentSchool: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  addBtn: {
    marginTop: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  settingDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  dangerLabel: {
    color: colors.danger,
  },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.danger,
  },
});
