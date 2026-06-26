import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, Button, Screen } from '@/components';
import { AddressFields, AddressValue, EMPTY_ADDRESS } from '@/components/feature/AddressFields';
import { useAppState } from '@/context/AppState';
import { AddressDto, getMyGuardianProfile, updateAddress } from '@/api/guardian';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

function toValue(a: AddressDto | null | undefined): AddressValue {
  if (!a) return EMPTY_ADDRESS;
  return {
    cep: a.cep ?? '',
    street: a.street ?? '',
    number: a.number ?? '',
    neighborhood: a.neighborhood ?? '',
    city: a.city ?? '',
  };
}

/** Edição dos endereços de embarque e entrega do responsável (com regeocodificação). */
export default function EditAddressScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [pickup, setPickup] = useState<AddressValue>(EMPTY_ADDRESS);
  const [deliverySame, setDeliverySame] = useState(true);
  const [delivery, setDelivery] = useState<AddressValue>(EMPTY_ADDRESS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getMyGuardianProfile(token)
      .then((p) => {
        setPickup(toValue(p.pickup));
        setDelivery(toValue(p.delivery));
        setDeliverySame(p.deliverySameAsPickup);
      })
      .catch((err) => setError(err?.message ?? 'Falha ao carregar o endereço.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSave() {
    if (!pickup.cep.trim() || !pickup.street.trim() || !pickup.number.trim()) {
      setError('Informe o endereço de embarque (CEP, rua e número).');
      return;
    }
    if (!deliverySame && (!delivery.cep.trim() || !delivery.street.trim() || !delivery.number.trim())) {
      setError('Informe o endereço de entrega ou marque "mesmo endereço".');
      return;
    }
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await updateAddress(token, {
        pickup,
        deliverySameAsPickup: deliverySame,
        delivery: deliverySame ? null : delivery,
      });
      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao salvar o endereço.');
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
    <Screen footer={<Button label="Salvar endereço" onPress={handleSave} loading={saving} />}>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Meu Endereço</Text>

      <Text style={[typography.sectionTitle, styles.section]}>Embarque</Text>
      <Text style={styles.sectionHint}>Onde a criança será buscada.</Text>
      <AddressFields value={pickup} onChange={setPickup} />

      <View style={styles.toggleRow}>
        <Text style={styles.toggleText}>Entregar no mesmo endereço</Text>
        <Switch
          value={deliverySame}
          onValueChange={setDeliverySame}
          trackColor={{ true: colors.brand, false: colors.border }}
          thumbColor={colors.white}
        />
      </View>

      {!deliverySame ? (
        <>
          <Text style={[typography.sectionTitle, styles.section]}>Entrega</Text>
          <Text style={styles.sectionHint}>Onde a criança será deixada.</Text>
          <AddressFields value={delivery} onChange={setDelivery} />
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxxl },
  title: { marginTop: spacing.md, marginBottom: spacing.sm },
  section: { marginTop: spacing.lg, marginBottom: spacing.xs },
  sectionHint: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.md },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  toggleText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.lg },
});
