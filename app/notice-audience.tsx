import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { getAudience } from '@/api/notices';
import { commitAudience, getAudienceSeed } from '@/lib/audienceSelection';
import { AudienceRecipient } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Seleção de destinatários: Todos, filtros por escola/bairro e marcação individual. */
export default function NoticeAudienceScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [recipients, setRecipients] = useState<AudienceRecipient[]>([]);
  // null = todos; Set = ids selecionados.
  const seed = getAudienceSeed();
  const [selected, setSelected] = useState<Set<number> | null>(
    seed === null ? null : new Set(seed),
  );

  useEffect(() => {
    if (token) getAudience(token).then(setRecipients).catch(() => setRecipients([]));
  }, [token]);

  const schools = useMemo(
    () => Array.from(new Set(recipients.map((r) => r.school))).sort(),
    [recipients],
  );
  const neighborhoods = useMemo(
    () => Array.from(new Set(recipients.map((r) => r.neighborhood))).sort(),
    [recipients],
  );

  const isAll = selected === null;

  function setAll() {
    setSelected(null);
  }

  function toggle(guardianId: number) {
    setSelected((prev) => {
      const next = new Set(prev ?? []);
      if (next.has(guardianId)) next.delete(guardianId);
      else next.add(guardianId);
      return next;
    });
  }

  function addGroup(predicate: (r: AudienceRecipient) => boolean) {
    setSelected((prev) => {
      const next = new Set(prev ?? []);
      recipients.filter(predicate).forEach((r) => next.add(r.guardianId));
      return next;
    });
  }

  function confirm() {
    const ids = !selected || selected.size === 0 ? null : Array.from(selected);
    commitAudience(ids);
    router.back();
  }

  const selectedCount = selected?.size ?? 0;

  return (
    <Screen
      footer={
        <Button
          label={isAll || selectedCount === 0 ? 'Enviar para todos' : `Confirmar (${selectedCount})`}
          onPress={confirm}
        />
      }
    >
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Destinatários</Text>

      <Pressable style={[styles.allRow, isAll && styles.allRowActive]} onPress={setAll}>
        <Ionicons
          name={isAll ? 'radio-button-on' : 'radio-button-off'}
          size={20}
          color={isAll ? colors.brandDark : colors.textMuted}
        />
        <Text style={styles.allText}>Todos os responsáveis</Text>
      </Pressable>

      <Text style={styles.filterLabel}>Atalhos por escola</Text>
      <View style={styles.chips}>
        {schools.map((s) => (
          <Pressable key={s} style={styles.chip} onPress={() => addGroup((r) => r.school === s)}>
            <Ionicons name="school-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.chipText}>{s}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.filterLabel}>Atalhos por bairro</Text>
      <View style={styles.chips}>
        {neighborhoods.map((n) => (
          <Pressable key={n} style={styles.chip} onPress={() => addGroup((r) => r.neighborhood === n)}>
            <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.chipText}>{n}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.filterLabel}>Responsáveis</Text>
      <ScrollView style={styles.list}>
        {recipients.map((r) => {
          const checked = !isAll && selected!.has(r.guardianId);
          return (
            <Pressable key={`${r.guardianId}-${r.studentName}`} style={styles.row} onPress={() => toggle(r.guardianId)}>
              <Ionicons
                name={checked ? 'checkbox' : 'square-outline'}
                size={20}
                color={checked ? colors.brandDark : colors.textMuted}
              />
              <View style={styles.flex}>
                <Text style={styles.name}>{r.guardianName}</Text>
                <Text style={styles.sub}>
                  {r.studentName} · {r.school} · {r.neighborhood}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  title: { marginTop: spacing.md, marginBottom: spacing.lg },
  allRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  allRowActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  allText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  chipText: { fontSize: 13, color: colors.textPrimary },
  list: { maxHeight: 320, marginTop: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  flex: { flex: 1 },
  name: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
