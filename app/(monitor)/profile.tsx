import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Card, Chip, Screen, SectionTitle } from '@/components';
import { useAppState } from '@/context/AppState';
import { getMonitorProfile } from '@/api/monitor';
import { mediaUrl } from '@/api/client';
import { MonitorProfileDto } from '@/types';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

type SettingItem = { icon: keyof typeof Ionicons.glyphMap; label: string; route: string };

/** Só o que é da própria conta — nada administrativo do transportador. */
const SETTINGS: SettingItem[] = [
  { icon: 'time-outline', label: 'Histórico de verificações', route: '/safety-checklists' },
  { icon: 'lock-closed-outline', label: 'Alterar Senha', route: '/change-password' },
  { icon: 'notifications-outline', label: 'Notificações', route: '/notifications-settings' },
  { icon: 'moon-outline', label: 'Aparência', route: '/appearance-settings' },
  { icon: 'shield-checkmark-outline', label: 'Privacidade e Dados', route: '/privacy-data' },
  { icon: 'document-text-outline', label: 'Termos de Uso', route: '/terms' },
];

/** Perfil do Monitor: dados próprios, equipe a que pertence e percursos escalados. */
export default function MonitorProfileScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { user, token, logout } = useAppState();
  const [profile, setProfile] = useState<MonitorProfileDto | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (token) {
        getMonitorProfile(token)
          .then((p) => active && setProfile(p))
          .catch(() => active && setProfile(null));
      }
      return () => {
        active = false;
      };
    }, [token]),
  );

  function handleLogout() {
    logout();
    router.dismissAll();
    router.replace('/(auth)/welcome');
  }

  const displayName = profile?.name ?? user?.name ?? '';

  return (
    <Screen>
      <Text style={[typography.screenTitle, styles.title]}>Meu Perfil</Text>

      <View style={styles.profileRow}>
        <Avatar name={displayName} size={64} uri={mediaUrl(profile?.photoUrl)} />
        <View style={styles.profileInfo}>
          <Text style={typography.cardTitle}>{displayName}</Text>
          <Text style={styles.meta}>{profile?.email ?? user?.email ?? ''}</Text>
          <Text style={styles.meta}>Monitor(a)</Text>
        </View>
      </View>

      <SectionTitle title="Equipe" style={styles.section} />
      <Card style={styles.teamCard}>
        <View style={styles.teamRow}>
          <Ionicons name="bus-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.teamText}>{profile?.transporterName ?? '—'}</Text>
        </View>
        {profile?.transporterPhone ? (
          <View style={styles.teamRow}>
            <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.teamText}>{profile.transporterPhone}</Text>
          </View>
        ) : null}
        {profile?.vehiclePlate ? (
          <View style={styles.teamRow}>
            <Ionicons name="car-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.teamText}>Placa {profile.vehiclePlate}</Text>
          </View>
        ) : null}
      </Card>

      <SectionTitle title="Meus Percursos" style={styles.section} />
      {(profile?.trips.length ?? 0) === 0 ? (
        <Text style={styles.empty}>Você ainda não foi escalado em nenhum percurso.</Text>
      ) : (
        <View style={styles.chips}>
          {profile?.trips.map((t) => <Chip key={t.id} label={t.name} selected />)}
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

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  title: { marginBottom: spacing.lg },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  profileInfo: { flex: 1, gap: 2 },
  meta: { fontSize: 12, color: colors.textSecondary },
  section: { marginTop: spacing.xl, marginBottom: spacing.md },
  teamCard: { gap: spacing.sm },
  teamRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  teamText: { fontSize: 14, color: colors.textPrimary },
  empty: { fontSize: 13, color: colors.textSecondary },
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
