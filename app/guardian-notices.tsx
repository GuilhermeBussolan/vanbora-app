import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Card, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { listGuardianNotices } from '@/api/notices';
import { GuardianNoticeDto } from '@/types';
import { colors, radius, spacing } from '@/theme';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Lista de avisos do responsável; cada um abre em tela cheia. */
export default function GuardianNoticesScreen() {
  const { token } = useAppState();
  const [notices, setNotices] = useState<GuardianNoticeDto[]>([]);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (token) {
        listGuardianNotices(token)
          .then((list) => active && setNotices(list))
          .catch(() => active && setNotices([]))
          .finally(() => active && setLoaded(true));
      }
      return () => {
        active = false;
      };
    }, [token]),
  );

  return (
    <Screen>
      <AppHeader title="Avisos" showBack />

      {loaded && notices.length === 0 ? (
        <Text style={styles.empty}>Nenhum aviso por enquanto.</Text>
      ) : (
        <View style={styles.list}>
          {notices.map((notice) => (
            <Pressable key={notice.id} onPress={() => router.push(`/notice/${notice.id}`)}>
              <Card>
                <View style={styles.head}>
                  <Text style={styles.from}>{notice.transporterName}</Text>
                  <Text style={styles.date}>{formatDate(notice.publishAt)}</Text>
                </View>
                {notice.title ? (
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {notice.title}
                  </Text>
                ) : null}
                <Text style={styles.message} numberOfLines={2}>
                  {notice.message}
                </Text>
                <View style={styles.footer}>
                  {notice.myReaction ? (
                    <Text style={styles.myReaction}>{notice.myReaction}</Text>
                  ) : (
                    <Text style={styles.react}>Toque para reagir</Text>
                  )}
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxl },
  list: { gap: spacing.md },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  from: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  date: { fontSize: 11, color: colors.textMuted },
  cardTitle: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 2 },
  message: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  myReaction: { fontSize: 18 },
  react: { fontSize: 12, color: colors.brandDark, fontWeight: '600' },
});
