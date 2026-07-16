import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Card, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { createReview } from '@/api/reviews';
import { cancelContract, getCancellationPreview } from '@/api/contracts';
import { listPaymentMethods } from '@/api/payments';
import { formatCurrency } from '@/data/mockData';
import { CancellationPreviewDto, PaymentMethodDto } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/**
 * Avaliação do transportador. Usada em 4 momentos: após assinar (opcional),
 * pesquisa de 3 em 3 meses, "Reavaliar" no perfil e cancelamento (obrigatória).
 */
export default function ReviewTransporterScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const params = useLocalSearchParams<{
    transporterId?: string;
    name?: string;
    mode?: string;
    contractId?: string;
    skippable?: string;
    returnHome?: string;
  }>();
  const isCancel = params.mode === 'cancel';
  const skippable = params.skippable === '1';
  const returnHome = params.returnHome === '1';

  function leave() {
    if (returnHome) router.replace('/(guardian)/home');
    else router.back();
  }
  const name = params.name ?? 'o transportador';

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CancellationPreviewDto | null>(null);
  const [methods, setMethods] = useState<PaymentMethodDto[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<number | null>(null);

  // No cancelamento, carrega a prévia (multa/reembolso) e, se houver multa, os meios de pagamento.
  useEffect(() => {
    if (!isCancel || !token || !params.contractId) return;
    let active = true;
    getCancellationPreview(token, Number(params.contractId))
      .then((p) => {
        if (!active) return;
        setPreview(p);
        if (p.requiresPayment) {
          listPaymentMethods(token)
            .then((m) => {
              if (!active) return;
              setMethods(m);
              setSelectedMethod(m[0]?.id ?? null);
            })
            .catch(() => undefined);
        }
      })
      .catch((e) => active && setError(e?.message ?? 'Falha ao calcular a rescisão.'));
    return () => {
      active = false;
    };
  }, [isCancel, token, params.contractId]);

  async function submit() {
    if (rating < 1) {
      setError('Toque nas estrelas para dar uma nota.');
      return;
    }
    if (isCancel && preview?.requiresPayment && !selectedMethod) {
      setError('Escolha a forma de pagamento da multa para cancelar.');
      return;
    }
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      if (isCancel) {
        await cancelContract(token, Number(params.contractId), rating, comment, selectedMethod);
        Alert.alert('Contrato cancelado', 'Seu transporte foi encerrado e sua avaliação registrada.');
        router.replace('/(guardian)/home');
      } else {
        await createReview(token, Number(params.transporterId), rating, comment);
        Alert.alert('Obrigado!', 'Sua avaliação foi registrada.');
        leave();
      }
    } catch (e: any) {
      setError(e?.message ?? 'Não foi possível enviar a avaliação.');
    } finally {
      setSaving(false);
    }
  }

  function confirmCancel() {
    const extra = preview?.requiresPayment
      ? ` Será cobrada uma multa de ${formatCurrency(preview.fineAmount)}.`
      : preview && preview.refundAmount > 0
        ? ` Você receberá ${formatCurrency(preview.refundAmount)} de reembolso.`
        : '';
    Alert.alert(
      'Cancelar transporte',
      `Tem certeza que deseja encerrar o transporte com ${name}?${extra} Esta ação não pode ser desfeita.`,
      [
        { text: 'Voltar', style: 'cancel' },
        { text: 'Cancelar transporte', style: 'destructive', onPress: submit },
      ],
    );
  }

  return (
    <Screen
      footer={
        <View style={styles.footer}>
          <Button
            label={isCancel ? 'Cancelar transporte' : 'Enviar avaliação'}
            variant={isCancel ? 'secondary' : 'primary'}
            loading={saving}
            onPress={isCancel ? confirmCancel : submit}
          />
          {skippable && !isCancel ? (
            <Pressable style={styles.skip} onPress={leave}>
              <Text style={styles.skipText}>Agora não</Text>
            </Pressable>
          ) : null}
        </View>
      }
    >
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>
        {isCancel ? 'Avalie antes de cancelar' : 'Avaliar transportador'}
      </Text>
      <Text style={styles.subtitle}>
        {isCancel
          ? `Para encerrar o transporte com ${name}, conte como foi a experiência.`
          : `Como está sendo a experiência com ${name}?`}
      </Text>

      {isCancel && preview ? (
        <Card style={styles.previewCard}>
          <View style={styles.previewRow}>
            <Ionicons
              name={
                preview.requiresPayment
                  ? 'alert-circle'
                  : preview.refundAmount > 0
                    ? 'cash-outline'
                    : 'information-circle-outline'
              }
              size={20}
              color={preview.requiresPayment ? colors.danger : colors.brandDark}
            />
            <Text style={styles.previewText}>{preview.message}</Text>
          </View>
          {preview.requiresPayment ? (
            <View style={styles.methodList}>
              <Text style={styles.fieldLabel}>Forma de pagamento da multa</Text>
              {methods.length === 0 ? (
                <Text style={styles.previewMuted}>
                  Nenhum cartão cadastrado. Cadastre um meio de pagamento (no contrato) antes de cancelar.
                </Text>
              ) : (
                methods.map((m) => {
                  const sel = m.id === selectedMethod;
                  return (
                    <Pressable key={m.id} onPress={() => setSelectedMethod(m.id)}>
                      <View style={[styles.methodCard, sel && styles.methodSelected]}>
                        <Ionicons
                          name={m.type === 'AUTO_DEBIT' ? 'sync-outline' : 'card-outline'}
                          size={18}
                          color={colors.textPrimary}
                        />
                        <Text style={styles.methodText}>
                          {m.brand} •••• {m.last4}
                        </Text>
                        <Ionicons
                          name={sel ? 'radio-button-on' : 'radio-button-off'}
                          size={18}
                          color={sel ? colors.brandDark : colors.textMuted}
                        />
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          ) : null}
        </Card>
      ) : null}

      <Card style={styles.starCard}>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Pressable key={s} onPress={() => setRating(s)} hitSlop={6}>
              <Ionicons
                name={rating >= s ? 'star' : 'star-outline'}
                size={40}
                color={colors.star}
              />
            </Pressable>
          ))}
        </View>
        {rating > 0 ? <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text> : null}
      </Card>

      <Text style={styles.fieldLabel}>Comentário (opcional)</Text>
      <TextInput
        style={styles.commentInput}
        placeholder="Conte mais sobre o atendimento, pontualidade, cuidado..."
        placeholderTextColor={colors.textMuted}
        value={comment}
        onChangeText={setComment}
        multiline
        maxLength={500}
      />

      {!isCancel ? (
        <View style={styles.infoRow}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            Pediremos sua avaliação a cada 3 meses. Você pode reavaliar quando quiser em Perfil →
            Reavaliar Transportador.
          </Text>
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const RATING_LABELS: Record<number, string> = {
  1: 'Ruim',
  2: 'Regular',
  3: 'Bom',
  4: 'Muito bom',
  5: 'Excelente',
};

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
    previewCard: { marginBottom: spacing.lg, gap: spacing.md },
    previewRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
    previewText: { flex: 1, fontSize: 13, color: colors.textPrimary, lineHeight: 19 },
    previewMuted: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
    methodList: { gap: spacing.sm },
    methodCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.white,
    },
    methodSelected: { borderColor: colors.brand, borderWidth: 2 },
    methodText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
    starCard: { alignItems: 'center', paddingVertical: spacing.xl },
    stars: { flexDirection: 'row', gap: spacing.sm },
    ratingLabel: {
      marginTop: spacing.md,
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    commentInput: {
      minHeight: 96,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      padding: spacing.md,
      fontSize: 14,
      color: colors.textPrimary,
      backgroundColor: colors.white,
      textAlignVertical: 'top',
    },
    infoRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
      alignItems: 'flex-start',
    },
    infoText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
    error: { fontSize: 13, color: colors.danger, marginTop: spacing.lg },
    footer: { gap: spacing.sm },
    skip: { alignItems: 'center', paddingVertical: spacing.sm },
    skipText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  });
