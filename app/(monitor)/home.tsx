import React, { useCallback, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Screen } from '@/components';
import { TripsSection } from '@/components/feature/TripsSection';
import { useAppState } from '@/context/AppState';
import { getMonitorProfile } from '@/api/monitor';
import { MonitorProfileDto } from '@/types';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Início do monitor: percursos em que está escalado e verificações de segurança pendentes. */
export default function MonitorHomeScreen() {
  const { typography, styles } = useThemedScreen(createStyles);
  const { token, user } = useAppState();
  const [profile, setProfile] = useState<MonitorProfileDto | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (token) {
        getMonitorProfile(token)
          .then((p) => active && setProfile(p))
          .catch(() => undefined);
      }
      return () => {
        active = false;
      };
    }, [token]),
  );

  return (
    <Screen>
      <Text style={[typography.screenTitle, styles.greeting]}>Olá, {profile?.name ?? user?.name ?? ''}</Text>
      {profile ? (
        <Text style={styles.subtitle}>Monitor(a) da equipe de {profile.transporterName}</Text>
      ) : null}
      <TripsSection />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  greeting: { marginBottom: spacing.xs },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginBottom: spacing.xl },
});
