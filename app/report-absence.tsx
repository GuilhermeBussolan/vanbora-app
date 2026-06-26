import React, { useCallback, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { AppHeader, Card, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { AttendanceDay, listAttendance, setGoing } from '@/api/guardian';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** "Avisar falta": presente por padrão; o pai desliga os dias em que NÃO vai. */
export default function ReportAbsenceScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token, selectedDependentId } = useAppState();
  const [days, setDays] = useState<AttendanceDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (token) {
        setLoading(true);
        listAttendance(token, selectedDependentId)
          .then((list) => active && setDays(list))
          .catch((e) => active && setError(e?.message ?? 'Falha ao carregar os dias.'))
          .finally(() => active && setLoading(false));
      }
      return () => {
        active = false;
      };
    }, [token, selectedDependentId]),
  );

  async function toggle(date: string, going: boolean) {
    if (!token) return;
    setError(null);
    const previous = days;
    setDays((prev) => prev.map((d) => (d.date === date ? { ...d, going } : d)));
    try {
      const updated = await setGoing(token, date, going, selectedDependentId);
      setDays(updated);
    } catch (e: any) {
      setError(e?.message ?? 'Não foi possível salvar.');
      setDays(previous);
    }
  }

  return (
    <Screen>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Avisar falta</Text>
      <Text style={styles.subtitle}>
        Seu filho é considerado presente por padrão. Desligue os dias em que ele{' '}
        <Text style={styles.bold}>não vai</Text> — o transportador é avisado automaticamente.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : (
        <View style={styles.list}>
          {days.map((d) => (
            <Card key={d.date} style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.weekday}>
                  {d.weekdayLabel}
                  {d.today ? ' • Hoje' : ''}
                </Text>
                <Text style={styles.date}>{formatLongDate(d.date)}</Text>
              </View>
              <Text style={[styles.tag, d.going ? styles.tagGoing : styles.tagAbsent]}>
                {d.going ? 'Vai' : 'Falta'}
              </Text>
              <Switch
                value={d.going}
                onValueChange={(v) => toggle(d.date, v)}
                trackColor={{ true: colors.brand, false: colors.borderStrong }}
                thumbColor={colors.white}
              />
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

/** "2026-06-26" → "26/06". */
function formatLongDate(iso: string): string {
  const [, m, d] = iso.split('-');
  return d && m ? `${d}/${m}` : iso;
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    title: { marginTop: spacing.md },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      marginBottom: spacing.lg,
      lineHeight: 19,
    },
    bold: { fontWeight: '700', color: colors.textPrimary },
    error: { fontSize: 13, color: colors.danger, marginBottom: spacing.md },
    center: { paddingTop: spacing.xxxl, alignItems: 'center' },
    list: { gap: spacing.sm },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    flex: { flex: 1 },
    weekday: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    date: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    tag: {
      fontSize: 12,
      fontWeight: '700',
      paddingHorizontal: spacing.md,
      paddingVertical: 4,
      borderRadius: 999,
      overflow: 'hidden',
    },
    tagGoing: { color: colors.success, backgroundColor: colors.successBg },
    tagAbsent: { color: colors.danger, backgroundColor: colors.dangerBg },
  });
