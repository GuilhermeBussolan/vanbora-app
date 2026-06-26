import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Card, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { AttendanceDay, getWeekAttendance, setGoing } from '@/api/guardian';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Histórico de presença com navegação por semanas (setas de avançar/voltar). */
export default function AttendanceHistoryScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token, selectedDependentId } = useAppState();
  const [ref, setRef] = useState(localTodayISO());
  const [days, setDays] = useState<AttendanceDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    (date: string) => {
      if (!token) return;
      setLoading(true);
      getWeekAttendance(token, date, selectedDependentId)
        .then(setDays)
        .catch((e) => setError(e?.message ?? 'Falha ao carregar a semana.'))
        .finally(() => setLoading(false));
    },
    [token, selectedDependentId],
  );

  useEffect(() => {
    load(ref);
  }, [ref, load]);

  async function toggle(day: AttendanceDay) {
    if (!token || !day.editable) return;
    setError(null);
    const previous = days;
    setDays((prev) => prev.map((d) => (d.date === day.date ? { ...d, going: !d.going } : d)));
    try {
      await setGoing(token, day.date, !day.going, selectedDependentId);
      load(ref);
    } catch (e: any) {
      setError(e?.message ?? 'Não foi possível salvar.');
      setDays(previous);
    }
  }

  const first = days[0]?.date;
  const last = days[days.length - 1]?.date;
  const isThisWeek = days.some((d) => d.today);

  return (
    <Screen>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Presença</Text>

      <View style={styles.nav}>
        <Pressable onPress={() => setRef(addDaysISO(ref, -7))} hitSlop={8} style={styles.navBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.navCenter}>
          <Text style={styles.weekRange}>
            {first && last ? `${ddmm(first)} – ${ddmm(last)}` : '—'}
          </Text>
          <Text style={styles.weekHint}>{isThisWeek ? 'Esta semana' : monthLabel(first)}</Text>
        </View>
        <Pressable onPress={() => setRef(addDaysISO(ref, 7))} hitSlop={8} style={styles.navBtn}>
          <Ionicons name="chevron-forward" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : (
        <View style={styles.list}>
          {days.map((d) => {
            const content = (
              <Card key={d.date} style={StyleSheet.flatten([styles.row, d.today && styles.rowToday])}>
                <View
                  style={[styles.circle, d.going ? styles.circlePresent : styles.circleAbsent]}
                >
                  <Ionicons
                    name={d.going ? 'checkmark' : 'close'}
                    size={18}
                    color={d.going ? colors.textOnBrand : colors.danger}
                  />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.weekday}>
                    {d.weekdayLabel}
                    {d.today ? ' • Hoje' : ''}
                  </Text>
                  <Text style={styles.date}>{ddmm(d.date)}</Text>
                </View>
                <Text style={[styles.status, d.going ? styles.statusPresent : styles.statusAbsent]}>
                  {d.going ? 'Foi' : 'Faltou'}
                </Text>
                {d.editable ? (
                  <Ionicons name="create-outline" size={16} color={colors.textMuted} />
                ) : null}
              </Card>
            );
            return d.editable ? (
              <Pressable key={d.date} onPress={() => toggle(d)}>
                {content}
              </Pressable>
            ) : (
              content
            );
          })}
        </View>
      )}

      <Text style={styles.note}>
        Toque em um dia de hoje em diante para avisar/desfazer uma falta. Dias passados são apenas
        consulta.
      </Text>
    </Screen>
  );
}

/** "2026-06-16" → "16/06". */
function ddmm(iso?: string): string {
  if (!iso) return '';
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function monthLabel(iso?: string): string {
  if (!iso) return '';
  const [y, m] = iso.split('-');
  return `${MONTHS[Number(m) - 1]} de ${y}`;
}

function addDaysISO(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  const p = (x: number) => String(x).padStart(2, '0');
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}

function localTodayISO(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    title: { marginTop: spacing.md, marginBottom: spacing.lg },
    nav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.sm,
    },
    navBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.brandSoft,
    },
    navCenter: { flex: 1, alignItems: 'center' },
    weekRange: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
    weekHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    error: { fontSize: 13, color: colors.danger, marginTop: spacing.md },
    center: { paddingTop: spacing.xxxl, alignItems: 'center' },
    list: { gap: spacing.sm, marginTop: spacing.lg },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    rowToday: { borderColor: colors.brand, borderWidth: 1.5 },
    circle: {
      width: 38,
      height: 38,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    circlePresent: { backgroundColor: colors.brand },
    circleAbsent: { backgroundColor: colors.dangerBg },
    flex: { flex: 1 },
    weekday: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    date: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    status: { fontSize: 13, fontWeight: '700' },
    statusPresent: { color: colors.success },
    statusAbsent: { color: colors.danger },
    note: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: spacing.lg,
      lineHeight: 17,
    },
  });
