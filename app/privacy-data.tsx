import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Card, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { getConsentStatus } from '@/api/account';
import { ConsentStatusDto } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const RIGHTS = [
  'Acessar os dados que mantemos sobre você',
  'Corrigir dados incompletos ou desatualizados',
  'Solicitar a portabilidade dos seus dados',
  'Solicitar a exclusão dos seus dados',
];

/** Privacidade e Dados (LGPD): situação do consentimento, direitos e revogação. */
export default function PrivacyDataScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [status, setStatus] = useState<ConsentStatusDto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    let active = true;
    if (token) {
      getConsentStatus(token)
        .then((s) => active && setStatus(s))
        .catch(() => active && setStatus(null))
        .finally(() => active && setLoading(false));
    }
    return () => {
      active = false;
    };
  }, [token]);

  useFocusEffect(load);

  return (
    <Screen>
      <AppHeader title="Privacidade e Dados" showBack />

      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loading} />
      ) : (
        <>
          <Card style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons
                name={status?.granted ? 'shield-checkmark' : 'shield-outline'}
                size={22}
                color={status?.granted ? colors.success : colors.textMuted}
              />
              <Text style={styles.statusTitle}>
                {status?.granted ? 'Consentimento vigente' : 'Consentimento revogado'}
              </Text>
            </View>
            <Text style={styles.statusLine}>
              Aceito em: {formatDateTime(status?.acceptedAt ?? null)}
            </Text>
            {status?.revokedAt ? (
              <Text style={styles.statusLine}>Revogado em: {formatDateTime(status.revokedAt)}</Text>
            ) : null}
            {status?.version ? (
              <Text style={styles.statusVersion}>Versão da política: {status.version}</Text>
            ) : null}
          </Card>

          <Text style={[typography.sectionTitle, styles.section]}>Seus direitos (LGPD)</Text>
          <Card>
            {RIGHTS.map((right, i) => (
              <View key={right} style={[styles.rightRow, i < RIGHTS.length - 1 && styles.rightDivider]}>
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.brandDark} />
                <Text style={styles.rightText}>{right}</Text>
              </View>
            ))}
          </Card>

          <View style={styles.docs}>
            <Pressable style={styles.docRow} onPress={() => router.push('/privacy-policy')}>
              <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.docText}>Política de Privacidade</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
            <Pressable style={styles.docRow} onPress={() => router.push('/terms')}>
              <Ionicons name="reader-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.docText}>Termos de Uso</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text style={styles.revokedNote}>
            Para solicitar a exclusão completa dos seus dados, escreva para vanbora2026@gmail.com.
          </Text>
        </>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    loading: { marginTop: spacing.xxl },
    statusCard: { marginTop: spacing.md, gap: spacing.xs },
    statusHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
    statusTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary },
    statusLine: { fontSize: 13, color: colors.textSecondary },
    statusVersion: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
    section: { marginTop: spacing.xl, marginBottom: spacing.md },
    rightRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
    rightDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    rightText: { flex: 1, fontSize: 13, color: colors.textPrimary },
    docs: { marginTop: spacing.lg, gap: spacing.sm },
    docRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.white,
    },
    docText: { flex: 1, fontSize: 14, fontWeight: '500', color: colors.textPrimary },
    revokedNote: {
      fontSize: 12,
      lineHeight: 18,
      color: colors.textSecondary,
      marginTop: spacing.xl,
      textAlign: 'center',
    },
  });
