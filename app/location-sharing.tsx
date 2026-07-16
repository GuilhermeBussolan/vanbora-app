import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Card, Input, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { getLocationSharing, updateLocationSharing } from '@/api/tracking';
import { WEEKDAY_SHORT } from '@/lib/locationSchedule';
import { LocationWindowDto } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

interface Block {
  key: string;
  days: number[]; // ISO 1..7
  start: string; // HH:mm
  end: string; // HH:mm
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Janelas do exemplo pedido: seg–sex 06–07, 11–13, 17–18:30. */
const PRESET: Omit<Block, 'key'>[] = [
  { days: [1, 2, 3, 4, 5], start: '06:00', end: '07:00' },
  { days: [1, 2, 3, 4, 5], start: '11:00', end: '13:00' },
  { days: [1, 2, 3, 4, 5], start: '17:00', end: '18:30' },
];

/** Agrupa janelas (uma por dia) em blocos com o mesmo horário. */
function windowsToBlocks(windows: LocationWindowDto[], nextKey: () => string): Block[] {
  const map = new Map<string, Block>();
  for (const w of windows) {
    const id = `${w.startTime}-${w.endTime}`;
    const block = map.get(id) ?? { key: nextKey(), days: [], start: w.startTime, end: w.endTime };
    if (!block.days.includes(w.dayOfWeek)) block.days.push(w.dayOfWeek);
    map.set(id, block);
  }
  return [...map.values()].map((b) => ({ ...b, days: [...b.days].sort((a, c) => a - c) }));
}

function formatTimeInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

/** [Transportador] Configura o compartilhamento de localização: interruptor + agenda. */
export default function LocationSharingScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const counter = useRef(0);
  const nextKey = () => `b${(counter.current += 1)}`;

  const [enabled, setEnabled] = useState(false);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getLocationSharing(token)
      .then((s) => {
        setEnabled(s.enabled);
        setBlocks(windowsToBlocks(s.windows, nextKey));
      })
      .catch((err) => setError(err?.message ?? 'Falha ao carregar a configuração.'))
      .finally(() => setLoading(false));
  }, [token]);

  function addBlock() {
    setBlocks((prev) => [...prev, { key: nextKey(), days: [1, 2, 3, 4, 5], start: '', end: '' }]);
  }

  function patchBlock(key: string, patch: Partial<Block>) {
    setBlocks((prev) => prev.map((b) => (b.key === key ? { ...b, ...patch } : b)));
  }

  function toggleDay(key: string, day: number) {
    setBlocks((prev) =>
      prev.map((b) =>
        b.key === key
          ? {
              ...b,
              days: b.days.includes(day)
                ? b.days.filter((d) => d !== day)
                : [...b.days, day].sort((a, c) => a - c),
            }
          : b,
      ),
    );
  }

  function applyPreset() {
    setEnabled(true);
    setBlocks(PRESET.map((b) => ({ ...b, key: nextKey() })));
  }

  async function handleSave() {
    // Valida e expande os blocos em janelas (uma por dia).
    const windows: LocationWindowDto[] = [];
    if (enabled) {
      for (const b of blocks) {
        if (b.days.length === 0) continue;
        if (!TIME_RE.test(b.start) || !TIME_RE.test(b.end)) {
          setError('Use horários no formato HH:MM (ex.: 06:00) em todas as janelas.');
          return;
        }
        if (b.end <= b.start) {
          setError(`O fim (${b.end}) deve ser após o início (${b.start}).`);
          return;
        }
        for (const day of b.days) {
          windows.push({ dayOfWeek: day, startTime: b.start, endTime: b.end });
        }
      }
    }

    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await updateLocationSharing(token, { enabled, windows });
      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao salvar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader showBack />
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen footer={<Button label="Salvar" onPress={handleSave} loading={saving} />}>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Compartilhar Localização</Text>
      <Text style={styles.subtitle}>
        Ligue o compartilhamento e defina as janelas em que os responsáveis podem acompanhar sua van
        ao vivo. Fora das janelas, sua localização não é compartilhada.
      </Text>

      <View style={styles.toggleRow}>
        <View style={styles.flex1}>
          <Text style={styles.toggleLabel}>Compartilhar minha localização</Text>
          <Text style={styles.toggleHint}>
            Interruptor geral. Se desligar, nada é compartilhado, mesmo com janelas configuradas.
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ true: colors.brand, false: colors.border }}
          thumbColor={colors.white}
        />
      </View>

      {enabled ? (
        <>
          <View style={styles.sectionRow}>
            <Text style={typography.sectionTitle}>Janelas agendadas</Text>
            <Pressable onPress={applyPreset} hitSlop={6}>
              <Text style={styles.presetLink}>Usar preset seg–sex</Text>
            </Pressable>
          </View>
          <Text style={styles.subtitle}>
            Sem janelas, o compartilhamento fica sempre ligado enquanto o app estiver aberto.
          </Text>

          {blocks.map((b) => (
            <Card key={b.key} style={styles.blockCard}>
              <View style={styles.blockTop}>
                <Text style={styles.blockBadge}>Janela</Text>
                <Pressable
                  onPress={() => setBlocks((prev) => prev.filter((x) => x.key !== b.key))}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              </View>

              <View style={styles.days}>
                {[1, 2, 3, 4, 5, 6, 7].map((day) => {
                  const on = b.days.includes(day);
                  return (
                    <Pressable
                      key={day}
                      onPress={() => toggleDay(b.key, day)}
                      style={[styles.dayChip, on && styles.dayChipOn]}
                    >
                      <Text style={[styles.dayChipText, on && styles.dayChipTextOn]}>
                        {WEEKDAY_SHORT[day]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.times}>
                <View style={styles.flex1}>
                  <Text style={styles.timeLabel}>Início</Text>
                  <Input
                    icon="time-outline"
                    placeholder="06:00"
                    keyboardType="number-pad"
                    maxLength={5}
                    value={b.start}
                    onChangeText={(v) => patchBlock(b.key, { start: formatTimeInput(v) })}
                  />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.timeLabel}>Fim</Text>
                  <Input
                    icon="time-outline"
                    placeholder="07:00"
                    keyboardType="number-pad"
                    maxLength={5}
                    value={b.end}
                    onChangeText={(v) => patchBlock(b.key, { end: formatTimeInput(v) })}
                  />
                </View>
              </View>
            </Card>
          ))}

          <Pressable onPress={addBlock} style={styles.addBlock}>
            <Ionicons name="add-circle-outline" size={20} color={colors.brandDark} />
            <Text style={styles.addBlockText}>Adicionar janela</Text>
          </Pressable>
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxxl },
    title: { marginTop: spacing.md },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      marginBottom: spacing.md,
      lineHeight: 19,
    },
    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
    flex1: { flex: 1 },
    toggleLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    toggleHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
    sectionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xl,
      marginBottom: spacing.xs,
    },
    presetLink: { fontSize: 13, fontWeight: '700', color: colors.brandDark },
    blockCard: { marginBottom: spacing.md, gap: spacing.md },
    blockTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    blockBadge: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.brandDark,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    days: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    dayChip: {
      paddingVertical: 8,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },
    dayChipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
    dayChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
    dayChipTextOn: { color: colors.textOnBrand },
    times: { flexDirection: 'row', gap: spacing.md },
    timeLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs },
    addBlock: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      justifyContent: 'center',
      paddingVertical: spacing.md,
    },
    addBlockText: { fontSize: 14, fontWeight: '600', color: colors.brandDark },
    error: { fontSize: 13, color: colors.danger, marginTop: spacing.lg },
  });
