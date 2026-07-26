import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Avatar, Card, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { getGuardianForRequest, GuardianForTransporterDto } from '@/api/hire';
import { mediaUrl } from '@/api/client';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** "2026-07-16T..." → "julho de 2026". */
function memberSinceLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

/** [Transportador] Perfil do responsável de uma solicitação recebida. */
export default function GuardianProfileScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAppState();
  const [data, setData] = useState<GuardianForTransporterDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    getGuardianForRequest(token, Number(id))
      .then(setData)
      .catch((err) => setError(err?.message ?? 'Falha ao carregar o perfil.'))
      .finally(() => setLoading(false));
  }, [token, id]);

  return (
    <Screen>
      <AppHeader title="Responsável" showBack />
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      ) : error || !data ? (
        <Text style={styles.error}>{error ?? 'Não foi possível carregar.'}</Text>
      ) : (
        <>
          <View style={styles.headerRow}>
            <Avatar name={data.name} size={64} uri={mediaUrl(data.photoUrl)} />
            <View style={styles.headerInfo}>
              <Text style={typography.cardTitle}>{data.name}</Text>
              <View style={styles.memberRow}>
                <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.memberText}>No app desde {memberSinceLabel(data.memberSince)}</Text>
              </View>
            </View>
          </View>

          <Card style={styles.card}>
            <Row icon="mail-outline" label="E-mail" value={data.email} styles={styles} colors={colors} />
            <Row icon="call-outline" label="Telefone" value={data.phone || '—'} styles={styles} colors={colors} />
            <Row
              icon="location-outline"
              label="Bairro de embarque"
              value={data.pickupNeighborhood || '—'}
              styles={styles}
              colors={colors}
            />
            <Row
              icon="school-outline"
              label="Escola de destino"
              value={data.dropoffSchool || '—'}
              styles={styles}
              colors={colors}
            />
            <Row
              icon="person-outline"
              label="Aluno(a)"
              value={data.studentName}
              styles={styles}
              colors={colors}
            />
            <Row
              icon="people-outline"
              label="Dependentes cadastrados"
              value={String(data.dependentsCount)}
              styles={styles}
              colors={colors}
              last
            />
          </Card>

          {data.bio?.trim() ? (
            <>
              <Text style={[typography.sectionTitle, styles.section]}>Sobre</Text>
              <Card>
                <Text style={styles.bioText}>{data.bio}</Text>
              </Card>
            </>
          ) : null}
        </>
      )}
    </Screen>
  );
}

function Row({
  icon,
  label,
  value,
  last,
  styles,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
  styles: ReturnType<typeof createStyles>;
  colors: ThemeColors;
}) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Ionicons name={icon} size={16} color={colors.textSecondary} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    center: { paddingTop: spacing.xxxl, alignItems: 'center' },
    error: { fontSize: 13, color: colors.danger, marginTop: spacing.lg },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
    headerInfo: { flex: 1, gap: 4 },
    memberRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    memberText: { fontSize: 12, color: colors.textSecondary },
    card: { gap: 0 },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    rowLabel: { fontSize: 13, color: colors.textSecondary },
    rowValue: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.textPrimary, textAlign: 'right' },
    section: { marginTop: spacing.xl, marginBottom: spacing.md },
    bioText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  });
