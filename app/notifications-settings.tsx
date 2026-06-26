import React, { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { AppHeader, Card, Screen } from '@/components';
import {
  defaultPrefs,
  loadNotificationPrefs,
  NotificationPrefs,
  saveNotificationPrefs,
} from '@/lib/notificationPrefs';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

const ITEMS: { key: keyof NotificationPrefs; label: string; description: string }[] = [
  { key: 'tripUpdates', label: 'Trajeto em tempo real', description: 'Avisos de embarque, chegada e desembarque.' },
  { key: 'payments', label: 'Pagamentos', description: 'Lembretes de vencimento e confirmações.' },
  { key: 'notices', label: 'Avisos do transportador', description: 'Comunicados e mudanças na rota.' },
];

/** Preferências de notificação (salvas localmente no aparelho). */
export default function NotificationsSettingsScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultPrefs);

  useEffect(() => {
    loadNotificationPrefs().then(setPrefs);
  }, []);

  function toggle(key: keyof NotificationPrefs, value: boolean) {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    saveNotificationPrefs(updated);
  }

  return (
    <Screen>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Notificações</Text>

      <Card padded={false}>
        {ITEMS.map((item, index) => (
          <View
            key={item.key}
            style={[styles.row, index < ITEMS.length - 1 && styles.divider]}
          >
            <View style={styles.info}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
            <Switch
              value={prefs[item.key]}
              onValueChange={(v) => toggle(item.key, v)}
              trackColor={{ true: colors.brand, false: colors.border }}
              thumbColor={colors.white}
            />
          </View>
        ))}
      </Card>

      <Text style={styles.note}>As preferências ficam salvas neste aparelho.</Text>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  title: { marginTop: spacing.md, marginBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  info: { flex: 1 },
  label: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  description: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
  note: { fontSize: 12, color: colors.textMuted, textAlign: 'center', marginTop: spacing.lg },
});
