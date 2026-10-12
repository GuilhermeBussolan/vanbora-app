import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Card, Screen, StepProgress } from '@/components';
import { useAppState } from '@/context/AppState';
import { ONBOARDING_CATALOG, currentOnboardingVersion, OnboardingRole } from '@/onboarding/content';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/**
 * Guia de funcionalidades (onboarding), por etapas. Aberto automaticamente pela Home
 * (via `useOnboardingGate`) no primeiro acesso ou quando há novidades, ou manualmente
 * pelo Perfil ("Conheça o Vanbora", com `?manual=1` — sempre mostra o guia completo).
 * Nunca bloqueia: fechar/pular a qualquer momento marca a versão como vista e volta
 * de onde veio.
 */
export default function OnboardingScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { role, user, markOnboardingSeen } = useAppState();
  const params = useLocalSearchParams<{ manual?: string }>();
  const manual = params.manual === '1';

  const effectiveRole: OnboardingRole = role === 'transporter' ? 'transporter' : 'guardian';
  const allSteps = ONBOARDING_CATALOG[effectiveRole];
  const current = useMemo(() => currentOnboardingVersion(effectiveRole), [effectiveRole]);
  const lastSeen = user?.onboardingLastSeenVersion ?? 0;

  // Manual ou primeiro acesso = guia completo. Senão, só as novidades desde a última
  // versão vista (nunca mostra uma tela vazia: se por algum motivo não sobrar nenhuma
  // novidade, cai de volta pro guia completo).
  const steps = useMemo(() => {
    if (manual || lastSeen <= 0) return allSteps;
    const onlyNew = allSteps.filter((step) => step.sinceVersion > lastSeen);
    return onlyNew.length > 0 ? onlyNew : allSteps;
  }, [allSteps, manual, lastSeen]);
  const isWhatsNew = !manual && lastSeen > 0 && steps.length < allSteps.length;

  const [index, setIndex] = useState(0);
  const step = steps[index];
  const isLast = index === steps.length - 1;

  function finish() {
    markOnboardingSeen(current).catch(() => undefined);
    router.back();
  }

  function next() {
    if (isLast) finish();
    else setIndex((i) => i + 1);
  }

  function goBack() {
    setIndex((i) => Math.max(0, i - 1));
  }

  function viewNow() {
    markOnboardingSeen(current).catch(() => undefined);
    if (step.targetScreen) router.replace(step.targetScreen as never);
  }

  return (
    <Screen
      footer={
        <View style={styles.footerRow}>
          <Button
            label="Voltar"
            variant="outline"
            onPress={goBack}
            disabled={index === 0}
            style={styles.footerBtn}
          />
          <Button label={isLast ? 'Concluir' : 'Próximo'} onPress={next} style={styles.footerBtn} />
        </View>
      }
    >
      <AppHeader
        title={isWhatsNew ? 'Novidades no Vanbora' : 'Conheça o Vanbora'}
        right={
          <Pressable onPress={finish} hitSlop={10} accessibilityLabel="Fechar guia">
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
        }
      />

      <Text style={styles.progressLabel}>
        {index + 1} de {steps.length}
      </Text>
      <StepProgress steps={steps.length} current={index + 1} />

      <Card style={styles.stepCard}>
        <View style={styles.iconWrap}>
          <Ionicons name={step.icon} size={36} color={colors.brandDark} />
        </View>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepDescription}>{step.description}</Text>
        {step.targetScreen ? (
          <Button
            label="Ver agora"
            variant="outline"
            icon="arrow-forward"
            onPress={viewNow}
            style={styles.targetBtn}
          />
        ) : null}
      </Card>

      <Pressable onPress={finish} hitSlop={8} style={styles.skipLink}>
        <Text style={styles.skipText}>Pular guia</Text>
      </Pressable>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  progressLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  stepCard: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginTop: spacing.xl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  stepTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  targetBtn: {
    marginTop: spacing.xl,
  },
  skipLink: {
    alignSelf: 'center',
    marginTop: spacing.xl,
    padding: spacing.sm,
  },
  skipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  footerBtn: {
    flex: 1,
    height: 44,
  },
});
