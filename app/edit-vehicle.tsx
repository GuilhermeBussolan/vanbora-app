import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, Button, Input, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { getMyProfile, updateVehicle } from '@/api/transporter';
import { formatCnh, formatPlate, isValidCnh, isValidPlate } from '@/lib/validation';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Edição dos dados do veículo do transportador (CNH, placa, capacidade). */
export default function EditVehicleScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [cnh, setCnh] = useState('');
  const [plate, setPlate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getMyProfile(token)
      .then((p) => {
        setCnh(p.cnh ?? '');
        setPlate(p.plate ?? '');
      })
      .catch((err) => setError(err?.message ?? 'Falha ao carregar os dados.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSave() {
    if (cnh.trim() && !isValidCnh(cnh)) {
      setError('CNH inválida. Informe os 11 dígitos do número de registro.');
      return;
    }
    if (plate.trim() && !isValidPlate(plate)) {
      setError('Placa inválida. Use até 7 caracteres (letras e números).');
      return;
    }
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await updateVehicle(token, {
        cnh: cnh.trim() || null,
        plate: plate.trim() || null,
      });
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
      <Text style={[typography.title, styles.title]}>Dados do Veículo</Text>
      <Text style={styles.subtitle}>Mantenha as informações do seu transporte atualizadas.</Text>

      <Text style={styles.fieldLabel}>CNH</Text>
      <Input
        icon="card-outline"
        placeholder="11 dígitos"
        value={cnh}
        onChangeText={(v) => setCnh(formatCnh(v))}
        keyboardType="numeric"
        maxLength={11}
        containerStyle={styles.field}
      />

      <Text style={styles.fieldLabel}>Placa</Text>
      <Input
        icon="car-outline"
        placeholder="ABC1D34"
        value={plate}
        onChangeText={(v) => setPlate(formatPlate(v))}
        autoCapitalize="characters"
        maxLength={7}
        containerStyle={styles.field}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxxl },
  title: { marginTop: spacing.md },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  field: { marginBottom: spacing.sm },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.sm },
});
