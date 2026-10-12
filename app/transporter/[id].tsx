import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  AppHeader,
  Avatar,
  Button,
  Card,
  Chip,
  Screen,
  SectionTitle,
  StarRating,
} from '@/components';
import { useAppState } from '@/context/AppState';
import { getPublicProfile } from '@/api/transporter';
import { startConversation } from '@/api/chat';
import { mediaUrl } from '@/api/client';
import { accessibilityOption, groupCharacteristics } from '@/lib/vehicleFeatures';
import { TransporterDetailDto } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Perfil público do transportador, visto pelo responsável antes de contratar. */
export default function PublicTransporterProfile() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAppState();
  const { width } = useWindowDimensions();
  const [transporter, setTransporter] = useState<TransporterDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const galleryWidth = width - spacing.lg * 2;
  const isWide = width >= 600;

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

      <SectionTitle title="Sobre o veículo" style={styles.section} />
      {transporter.vehiclePhotoUrls.length === 0 ? (
        <View style={styles.galleryPlaceholder}>
          <Ionicons name="car-outline" size={28} color={colors.textMuted} />
          <Text style={styles.galleryPlaceholderText}>Nenhuma foto do veículo disponível.</Text>
        </View>
      ) : (
        <>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) =>
              setGalleryIndex(Math.round(e.nativeEvent.contentOffset.x / galleryWidth))
            }
            style={{ width: galleryWidth }}
          >
            {transporter.vehiclePhotoUrls.map((url, i) => (
              <Pressable key={i} onPress={() => setPreviewOpen(true)} style={{ width: galleryWidth }}>
                <Image source={{ uri: mediaUrl(url) }} style={styles.galleryImage} />
              </Pressable>
            ))}
          </ScrollView>
          {transporter.vehiclePhotoUrls.length > 1 ? (
            <View style={styles.dots}>
              {transporter.vehiclePhotoUrls.map((_, i) => (
                <View key={i} style={[styles.dot, i === galleryIndex && styles.dotActive]} />
              ))}
            </View>
          ) : null}
        </>
      )}

      {(() => {
        const groups = groupCharacteristics(transporter.vehicleCharacteristics);
        const safety = groups.find((g) => g.category === 'safety');
        const comfort = groups.find((g) => g.category === 'comfort');
        const accessibility = transporter.vehicleAccessibilityFeatures
          .map(accessibilityOption)
          .filter((o): o is NonNullable<typeof o> => !!o);
        return (
          <>
            {safety ? <FeatureGroup label="Segurança" options={safety.options} /> : null}
            {accessibility.length > 0 ? <FeatureGroup label="Acessibilidade" options={accessibility} /> : null}
            {comfort ? <FeatureGroup label="Conforto" options={comfort.options} /> : null}
          </>
        );
      })()}

      <Modal visible={previewOpen} transparent animationType="fade" onRequestClose={() => setPreviewOpen(false)}>
        <View style={styles.previewBackdrop}>
          <Pressable style={styles.previewClose} onPress={() => setPreviewOpen(false)} hitSlop={10}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </Pressable>
          {transporter.vehiclePhotoUrls[galleryIndex] ? (
            <Image
              source={{ uri: mediaUrl(transporter.vehiclePhotoUrls[galleryIndex]) }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>

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

      <SectionTitle title="Atendimento" style={styles.section} />
      <View style={[styles.attendanceRow, isWide && styles.attendanceRowWide]}>
        <View style={styles.attendanceCol}>
          <View style={styles.attendanceHeader}>
            <Ionicons name="location" size={15} color={colors.brandDark} />
            <Text style={styles.attendanceHeaderText}>Bairros atendidos</Text>
          </View>
          {transporter.neighborhoods.length === 0 ? (
            <Text style={styles.empty}>Nenhum bairro informado.</Text>
          ) : (
            <View style={styles.chipsRow}>
              {transporter.neighborhoods.map((n) => (
                <Chip key={n} label={n} selected />
              ))}
            </View>
          )}
        </View>
        <View style={styles.attendanceCol}>
          <View style={styles.attendanceHeader}>
            <Ionicons name="school" size={15} color={colors.brandDark} />
            <Text style={styles.attendanceHeaderText}>Escolas atendidas</Text>
          </View>
          {transporter.schools.length === 0 ? (
            <Text style={styles.empty}>Nenhuma escola informada.</Text>
          ) : (
            <View style={styles.chipsRow}>
              {transporter.schools.map((s) => (
                <Chip key={s} label={s} selected />
              ))}
            </View>
          )}
        </View>
      </View>

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

/** Grupo de recursos do veículo (rótulo pequeno + chips), usado para Segurança/Acessibilidade/Conforto. */
function FeatureGroup({
  label,
  options,
}: {
  label: string;
  options: { key: string; label: string; icon: keyof typeof Ionicons.glyphMap }[];
}) {
  const { styles } = useThemedScreen(createStyles);
  return (
    <View style={styles.featureGroup}>
      <Text style={styles.featureGroupLabel}>{label}</Text>
      <View style={styles.chipsRow}>
        {options.map((o) => (
          <Chip key={o.key} label={o.label} icon={o.icon} selected />
        ))}
      </View>
    </View>
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
  bioText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  featureGroup: { marginTop: spacing.md },
  featureGroupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  attendanceRow: { gap: spacing.lg },
  attendanceRowWide: { flexDirection: 'row' },
  attendanceCol: { flex: 1 },
  attendanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm },
  attendanceHeaderText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  galleryPlaceholder: {
    height: 120,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  galleryPlaceholderText: { fontSize: 12, color: colors.textSecondary },
  galleryImage: {
    width: '100%',
    height: 190,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { backgroundColor: colors.brand, width: 16 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap' },
  previewBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewClose: {
    position: 'absolute',
    top: 56,
    right: spacing.lg,
    zIndex: 1,
  },
  previewImage: { width: '100%', height: '80%' },
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
