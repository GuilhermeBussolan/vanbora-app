import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  AppHeader,
  Avatar,
  Button,
  Card,
  Screen,
  SectionTitle,
  StarRating,
} from '@/components';
import { useAppState } from '@/context/AppState';
import { getPublicProfile } from '@/api/transporter';
import { startConversation } from '@/api/chat';
import { mediaUrl } from '@/api/client';
import { TransporterDetailDto } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Perfil público do transportador, visto pelo responsável antes de contratar. */
export default function PublicTransporterProfile() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAppState();
  const [transporter, setTransporter] = useState<TransporterDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    let active = true;
    if (token && id) {
      setError(null);
      getPublicProfile(token, Number(id))
        .then((t) => active && setTransporter(t))
        .catch((err) => active && setError(err?.message ?? 'Falha ao carregar o perfil.'))
        .finally(() => active && setLoading(false));
    }
    return () => {
      active = false;
    };
  }, [token, id]);

  useFocusEffect(load);

  async function handleMessage() {
    if (!token || !transporter) return;
    setMessaging(true);
    try {
      const convo = await startConversation(token, transporter.id);
      router.push(`/chat/${convo.id}`);
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Não foi possível abrir a conversa.');
    } finally {
      setMessaging(false);
    }
  }

  function handleHire() {
    if (!transporter) return;
    router.push({
      pathname: '/hire/[id]',
      params: {
        id: String(transporter.id),
        name: transporter.name,
        fee: String(transporter.monthlyFee),
        proposals: transporter.acceptsProposals ? '1' : '0',
      },
    });
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

  if (error || !transporter) {
    return (
      <Screen>
        <AppHeader showBack />
        <Card style={styles.errorCard}>
          <Text style={styles.errorText}>{error ?? 'Transportador não encontrado.'}</Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button
            label="Mensagem"
            variant="outline"
            icon="chatbubble-outline"
            onPress={handleMessage}
            loading={messaging}
            style={styles.footerBtn}
          />
          <Button label="Contratar" onPress={handleHire} style={styles.footerBtn} />
        </View>
      }
    >
      <AppHeader showBack />

      <View style={styles.head}>
        <Avatar name={transporter.name} size={84} uri={mediaUrl(transporter.photoUrl)} />
        <Text style={[typography.title, styles.name]}>{transporter.name}</Text>
        <StarRating
          rating={transporter.rating}
          size={16}
          caption={`(${transporter.reviewsCount} avaliações)`}
        />
        <View style={styles.career}>
          <Ionicons name="briefcase-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.careerText}>{transporter.yearsExperience} anos de carreira</Text>
        </View>
        {transporter.phone ? (
          <View style={styles.career}>
            <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.careerText}>{transporter.phone}</Text>
          </View>
        ) : null}
      </View>

      {transporter.bio?.trim() ? (
        <>
          <SectionTitle title="Sobre" style={styles.section} />
          <Card>
            <Text style={styles.bioText}>{transporter.bio}</Text>
          </Card>
        </>
      ) : null}

      <SectionTitle title="Equipe (Ajudantes)" style={styles.section} />
      {transporter.helpers.length === 0 ? (
        <Text style={styles.empty}>Este transportador trabalha sem ajudantes cadastrados.</Text>
      ) : (
        <View style={styles.helpers}>
          {transporter.helpers.map((h) => (
            <Card key={h.id} style={styles.helperCard}>
              <Avatar name={h.name} size={44} tone="neutral" uri={mediaUrl(h.photoUrl)} />
              <View style={styles.helperInfo}>
                <Text style={styles.helperName}>{h.name}</Text>
                <Text style={styles.helperRole}>{h.role}</Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      <SectionTitle title="Escolas Atendidas" style={styles.section} />
      {transporter.schools.length === 0 ? (
        <Text style={styles.empty}>Nenhuma escola informada.</Text>
      ) : (
        <View style={styles.facList}>
          {transporter.schools.map((s) => (
            <View key={s} style={styles.facItem}>
              <View style={styles.facCircle}>
                <Ionicons name="school" size={15} color={colors.textOnBrand} />
              </View>
              <Text style={styles.facLabel}>{s}</Text>
            </View>
          ))}
        </View>
      )}

      <SectionTitle title="Bairros Atendidos" style={styles.section} />
      {transporter.neighborhoods.length === 0 ? (
        <Text style={styles.empty}>Nenhum bairro informado.</Text>
      ) : (
        <View style={styles.facList}>
          {transporter.neighborhoods.map((n) => (
            <View key={n} style={styles.facItem}>
              <View style={styles.facCircle}>
                <Ionicons name="location" size={15} color={colors.textOnBrand} />
              </View>
              <Text style={styles.facLabel}>{n}</Text>
            </View>
          ))}
        </View>
      )}

      <SectionTitle title="Avaliações de outros responsáveis" style={styles.section} />
      {transporter.reviews.length === 0 ? (
        <Text style={styles.empty}>Ainda não há avaliações.</Text>
      ) : (
        <View style={styles.reviews}>
          {transporter.reviews.map((r) => (
            <Card key={r.id}>
              <View style={styles.reviewHead}>
                <Text style={styles.reviewAuthor}>{r.authorName}</Text>
                <StarRating rating={r.rating} size={13} showValue={false} />
              </View>
              <Text style={styles.reviewComment}>{r.comment}</Text>
            </Card>
          ))}
        </View>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxxl },
  errorCard: { marginTop: spacing.lg, alignItems: 'center' },
  errorText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center' },
  head: { alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  name: { marginTop: spacing.sm },
  career: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  careerText: { fontSize: 13, color: colors.textSecondary },
  section: { marginTop: spacing.lg },
  empty: { fontSize: 13, color: colors.textSecondary },
  helpers: { gap: spacing.md },
  helperCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  helperInfo: { flex: 1, gap: 2 },
  helperName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  helperRole: { fontSize: 12, color: colors.textSecondary },
  facList: { gap: spacing.sm },
  facItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  facCircle: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  facLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  bioText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  reviews: { gap: spacing.md },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  reviewAuthor: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  reviewComment: { fontSize: 13, lineHeight: 19, color: colors.textSecondary },
  footer: { flexDirection: 'row', gap: spacing.md },
  footerBtn: { flex: 1 },
});
