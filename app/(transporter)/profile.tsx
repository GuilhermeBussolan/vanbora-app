import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Button, Card, Chip, Screen, SectionTitle } from '@/components';
import { useAppState } from '@/context/AppState';
import { getMyProfile, uploadMyPhoto } from '@/api/transporter';
import { mediaUrl } from '@/api/client';
import { pickImage } from '@/lib/imagePicker';
import { formatCurrency } from '@/data/mockData';
import { HelperDto, TransporterProfileDto } from '@/types';
import { colors, radius, spacing, typography } from '@/theme';

type SettingItem = { icon: keyof typeof Ionicons.glyphMap; label: string; route: string };

const SETTINGS: SettingItem[] = [
  { icon: 'lock-closed-outline', label: 'Alterar Senha', route: '/change-password' },
  { icon: 'notifications-outline', label: 'Notificações', route: '/notifications-settings' },
  { icon: 'document-text-outline', label: 'Termos de Uso', route: '/terms' },
];

/** Perfil do Transportador: dados do veículo, ajudantes, atendimento e configurações. */
export default function TransporterProfileScreen() {
  const { user, token, logout } = useAppState();
  const [profile, setProfile] = useState<TransporterProfileDto | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const load = useCallback(() => {
    let active = true;
    if (token) {
      getMyProfile(token)
        .then((p) => active && setProfile(p))
        .catch(() => active && setProfile(null));
    }
    return () => {
      active = false;
    };
  }, [token]);

  useFocusEffect(load);

  async function handleChangePhoto() {
    if (!token) return;
    const file = await pickImage();
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const updated = await uploadMyPhoto(token, file);
      setProfile(updated);
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

  const displayName = profile?.name ?? user?.name ?? '';
  const helpers = profile?.helpers ?? [];

  return (
    <Screen>
      <Text style={[typography.screenTitle, styles.title]}>Meu Perfil</Text>

      <View style={styles.profileRow}>
        <Pressable onPress={handleChangePhoto} style={styles.photoWrap}>
          <Avatar name={displayName} size={64} uri={mediaUrl(profile?.photoUrl)} />
          <View style={styles.photoBadge}>
            {uploadingPhoto ? (
              <ActivityIndicator size="small" color={colors.textOnBrand} />
            ) : (
              <Ionicons name="camera" size={14} color={colors.textOnBrand} />
            )}
          </View>
        </Pressable>
        <View style={styles.profileInfo}>
          <Text style={typography.cardTitle}>{displayName}</Text>
          <Text style={styles.meta}>
            CNH {profile?.cnh ?? '—'} • Placa {profile?.plate ?? '—'}
          </Text>
          <Text style={styles.meta}>Capacidade: {profile?.capacity ?? '—'} lugares</Text>
        </View>
        <Pressable onPress={() => router.push('/edit-vehicle')} hitSlop={8}>
          <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <Button
        label="Ver Meus Alunos"
        icon="people-outline"
        onPress={() => router.push('/students')}
        style={styles.studentsBtn}
      />

      <View style={[styles.sectionHeader, styles.section]}>
        <SectionTitle title="Preço e Propostas" />
        <Pressable onPress={() => router.push('/edit-pricing')} hitSlop={8}>
          <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>
      <Card style={styles.pricingCard}>
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Valor de tabela</Text>
          <Text style={styles.pricingValue}>
            {profile ? `${formatCurrency(profile.baseMonthlyFee)}/mês` : '—'}
          </Text>
        </View>
        <View style={styles.pricingRow}>
          <Text style={styles.pricingLabel}>Aceita propostas</Text>
          <View style={[styles.proposalsBadge, profile?.acceptsProposals ? styles.proposalsOn : styles.proposalsOff]}>
            <Text
              style={[
                styles.proposalsText,
                { color: profile?.acceptsProposals ? colors.success : colors.textSecondary },
              ]}
            >
              {profile?.acceptsProposals ? 'Sim' : 'Não'}
            </Text>
          </View>
        </View>
      </Card>

      <SectionTitle title="Meus Ajudantes" style={styles.section} />
      <View style={styles.list}>
        {helpers.length === 0 ? (
          <Card>
            <Text style={styles.empty}>Nenhum ajudante cadastrado ainda.</Text>
          </Card>
        ) : (
          helpers.map((h) => <HelperRow key={h.id} helper={h} />)
        )}
      </View>
      <Button
        label="Adicionar Ajudante"
        variant="outline"
        icon="add"
        onPress={() => router.push('/add-helper')}
        style={styles.addBtn}
      />

      <View style={[styles.sectionHeader, styles.section]}>
        <SectionTitle title="Área de Atendimento" />
        <Pressable onPress={() => router.push('/edit-service-area')} hitSlop={8}>
          <Ionicons name="create-outline" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>
      {(profile?.schools.length ?? 0) === 0 && (profile?.neighborhoods.length ?? 0) === 0 ? (
        <Text style={styles.empty}>Nenhuma escola ou bairro definido.</Text>
      ) : (
        <View style={styles.chips}>
          {profile?.schools.map((s) => (
            <Chip key={`s-${s}`} label={s} selected />
          ))}
          {profile?.neighborhoods.map((n) => (
            <Chip key={`n-${n}`} label={n} />
          ))}
        </View>
      )}

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

/** Linha de um ajudante, clicável para editar. */
function HelperRow({ helper }: { helper: HelperDto }) {
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: '/edit-helper',
          params: {
            id: String(helper.id),
            name: helper.name,
            role: helper.role,
            active: helper.active ? '1' : '0',
            photoUrl: helper.photoUrl ?? '',
          },
        })
      }
    >
      <Card style={styles.helperCard}>
        <Avatar name={helper.name} size={40} tone="neutral" uri={mediaUrl(helper.photoUrl)} />
        <View style={styles.helperInfo}>
          <Text style={styles.helperName}>{helper.name}</Text>
          <Text style={styles.helperRole}>{helper.role}</Text>
        </View>
        {!helper.active ? (
          <View style={styles.inactiveBadge}>
            <Text style={styles.inactiveText}>Inativo</Text>
          </View>
        ) : null}
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.lg },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
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
  profileInfo: { flex: 1, gap: 2 },
  meta: { fontSize: 12, color: colors.textSecondary },
  studentsBtn: { marginBottom: spacing.sm },
  section: { marginTop: spacing.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pricingCard: { marginTop: spacing.md, gap: spacing.sm },
  pricingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pricingLabel: { fontSize: 13, color: colors.textSecondary },
  pricingValue: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
  proposalsBadge: { paddingHorizontal: spacing.md, paddingVertical: 3, borderRadius: radius.pill },
  proposalsOn: { backgroundColor: colors.successBg },
  proposalsOff: { backgroundColor: colors.border },
  proposalsText: { fontSize: 12, fontWeight: '700' },
  list: { gap: spacing.md },
  empty: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  helperCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  helperInfo: { flex: 1, gap: 2 },
  helperName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  helperRole: { fontSize: 12, color: colors.textSecondary },
  inactiveBadge: {
    backgroundColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  inactiveText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
  addBtn: { marginTop: spacing.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  settingDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  settingLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.danger },
});
