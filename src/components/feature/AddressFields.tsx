import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Input } from '@/components';
import { formatCep, lookupCep } from '@/lib/cepLookup';
import { colors, spacing } from '@/theme';

export interface AddressValue {
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
}

export const EMPTY_ADDRESS: AddressValue = {
  cep: '',
  street: '',
  number: '',
  neighborhood: '',
  city: '',
};

/** Campos de endereço com autopreenchimento por CEP (ViaCEP). */
export function AddressFields({
  value,
  onChange,
}: {
  value: AddressValue;
  onChange: (next: AddressValue) => void;
}) {
  const [looking, setLooking] = useState(false);
  const [lastCep, setLastCep] = useState('');

  async function handleCepChange(raw: string) {
    const cep = formatCep(raw);
    onChange({ ...value, cep });
    const digits = cep.replace(/\D/g, '');
    if (digits.length === 8 && digits !== lastCep) {
      setLastCep(digits);
      setLooking(true);
      const result = await lookupCep(digits);
      setLooking(false);
      if (result) {
        onChange({
          ...value,
          cep,
          street: result.street || value.street,
          neighborhood: result.neighborhood || value.neighborhood,
          city: result.city || value.city,
        });
      }
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.cepRow}>
        <Input
          icon="location-outline"
          placeholder="CEP"
          keyboardType="number-pad"
          maxLength={9}
          value={value.cep}
          onChangeText={handleCepChange}
          containerStyle={styles.flex1}
        />
        {looking ? <ActivityIndicator color={colors.brand} style={styles.spinner} /> : null}
      </View>
      <Text style={styles.hint}>Digite o CEP para preencher o endereço automaticamente.</Text>

      <Input
        placeholder="Rua / Logradouro"
        value={value.street}
        onChangeText={(v) => onChange({ ...value, street: v })}
        containerStyle={styles.field}
      />
      <View style={styles.row}>
        <Input
          placeholder="Número"
          keyboardType="numeric"
          value={value.number}
          onChangeText={(v) => onChange({ ...value, number: v })}
          containerStyle={styles.numberField}
        />
        <Input
          placeholder="Bairro"
          value={value.neighborhood}
          onChangeText={(v) => onChange({ ...value, neighborhood: v })}
          containerStyle={styles.flex1}
        />
      </View>
      <Input
        placeholder="Cidade"
        value={value.city}
        onChangeText={(v) => onChange({ ...value, city: v })}
        containerStyle={styles.field}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  cepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex1: { flex: 1 },
  spinner: { width: 24 },
  hint: { fontSize: 12, color: colors.textMuted, marginTop: -spacing.sm },
  field: {},
  row: { flexDirection: 'row', gap: spacing.md },
  numberField: { flex: 1 },
});
