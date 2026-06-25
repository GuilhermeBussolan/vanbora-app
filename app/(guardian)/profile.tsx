import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Button, Card, Screen, SectionTitle } from '@/components';
import { useAppState } from '@/context/AppState';
import { listDependents } from '@/api/dependents';
import { DependentDto } from '@/types';
import { colors, radius, spacing, typography } from '@/theme';

type SettingItem = { icon: keyof typeof Ionicons.glyphMap; label: string; route: string };

const SETTINGS: SettingItem[] = [
  { icon: 'location-outline', label: 'Meu Endereço', route: '/edit-address' },
  { icon: 'lock-closed-outline', label: 'Alterar Senha', route: '/change-password' },
  { icon: 'notifications-outline', label: 'Notificações', route: '/notifications-settings' },
  { icon: 'document-text-outline', label: 'Termos de Uso', route: '/terms' },
];

/** Perfil do Responsável: dados, dependentes e configurações. */
export default function GuardianProfileScreen() {
  const { user, token, logout } = useAppState();
  const [dependents, setDependents] = useState<DependentDto[]>([]);

  // Carrega dependentes reais sempre que a tela ganha foco.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (token) {
        listDependents(token)
          .then((list) => active && setDependents(list))
          .catch(() => active && setDependents([]));
      }
      return () => {
        active = false;
      };
    }, [token]),
  );

  function handleLogout() {
    logout();
    router.replace('/(auth)/welcome');
  }

  return (
    <Screen>
      <Text style={[typography.screenTitle, styles.title]}>Meu Perfil</Text>

      <View style={styles.profileRow}>
        <Avatar name={user?.name ?? 'Responsável'} size={52} />
        <View style={styles.profileInfo}>
          <Text style={typography.cardTitle}>{user?.name ?? 'Responsável'}</Text>
          <Text style={styles.email}>{user?.email ?? '—'}</Text>
        </View>
      </View>

      <SectionTitle title="Meus Dependentes" style={styles.section} />
      <View style={styles.list}>
        {dependents.length === 0 ? (
          <Card>
            <Text style={styles.empty}>Nenhum dependente cadastrado ainda.</Text>
          </Card>
        ) : (
          dependents.map((dep) => (
            <Card key={dep.id} style={styles.dependentCard}>
              <Avatar name={dep.name} size={40} tone="neutral" />
              <View style={styles.dependentInfo}>
                <Text style={styles.dependentName}>{dep.name}</Text>
                <Text style={styles.dependentSchool}>{dep.school}</Text>
              </View>
            </Card>
          ))
        )}
      </View>

      <Button
        label="Adicionar Dependente"
        variant="outline"
        icon="add"
        onPress={() => router.push('/add-dependent')}
        style={styles.addBtn}
      />

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

const styles = StyleSheet.create({
  title: {
    marginBottom: spacing.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
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
  dependentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
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
