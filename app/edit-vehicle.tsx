import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, Button, Input, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { getMyProfile, updateVehicle } from '@/api/transporter';
import { colors, spacing, typography } from '@/theme';

/** Edição dos dados do veículo do transportador (CNH, placa, capacidade). */
export default function EditVehicleScreen() {
  const { token } = useAppState();
  const [cnh, setCnh] = useState('');
  const [plate, setPlate] = useState('');
  const [capacity, setCapacity] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getMyProfile(token)
      .then((p) => {
        setCnh(p.cnh ?? '');
        setPlate(p.plate ?? '');
        setCapacity(p.capacity != null ? String(p.capacity) : '');
      })
      .catch((err) => setError(err?.message ?? 'Falha ao carregar os dados.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSave() {
    const capacityValue = capacity.trim() ? Math.round(Number(capacity.trim())) : null;
    if (capacity.trim() && (capacityValue == null || Number.isNaN(capacityValue) || capacityValue < 1)) {
      setError('Capacidade inválida.');
      return;
    }
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await updateVehicle(token, {
        cnh: cnh.trim() || null,
        plate: plate.trim() || null,
        capacity: capacityValue,
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
      <Input icon="card-outline" placeholder="Número da CNH" value={cnh} onChangeText={setCnh} containerStyle={styles.field} />

      <Text style={styles.fieldLabel}>Placa</Text>
      <Input
        icon="car-outline"
        placeholder="ABC-1D34"
        value={plate}
        onChangeText={setPlate}
        autoCapitalize="characters"
        containerStyle={styles.field}
      />

      <Text style={styles.fieldLabel}>Capacidade (lugares)</Text>
      <Input
        icon="people-outline"
        placeholder="Ex.: 15"
        value={capacity}
        onChangeText={setCapacity}
        keyboardType="numeric"
        containerStyle={styles.field}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxxl },
  title: { marginTop: spacing.md },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  field: { marginBottom: spacing.sm },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.sm },
});
