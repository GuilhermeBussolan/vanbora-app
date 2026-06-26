import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppState } from '@/context/AppState';
import { registerSchool } from '@/api/schools';
import { formatCep, lookupCep } from '@/lib/cepLookup';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdded: (name: string) => void;
}

/** [Transportador] Cadastra uma escola no catálogo por CEP (autofill ViaCEP). */
export function SchoolRegisterModal({ visible, onClose, onAdded }: Props) {
  const { colors, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [name, setName] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [uf, setUf] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setName('');
    setCep('');
    setStreet('');
    setNumber('');
    setNeighborhood('');
    setCity('');
    setUf('');
    setError(null);
  }

  async function onCepChange(raw: string) {
    const masked = formatCep(raw);
    setCep(masked);
    if (masked.replace(/\D/g, '').length === 8) {
      const found = await lookupCep(masked);
      if (found) {
        setStreet(found.street);
        setNeighborhood(found.neighborhood);
        setCity(found.city);
        setUf(found.uf);
      }
    }
  }

  async function save() {
    if (!name.trim()) {
      setError('Informe o nome da escola.');
      return;
    }
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const created = await registerSchool(token, {
        name: name.trim(),
        cep: cep || undefined,
        street: street || undefined,
        number: number || undefined,
        neighborhood: neighborhood || undefined,
        city: city || undefined,
        uf: uf || undefined,
      });
      onAdded(created.name);
      reset();
      onClose();
    } catch (e: any) {
      setError(e?.message ?? 'Falha ao cadastrar a escola.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Cadastrar escola</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          <Input
            icon="school-outline"
            placeholder="Nome da escola"
            value={name}
            onChangeText={setName}
            containerStyle={styles.field}
          />
          <Input
            icon="location-outline"
            placeholder="CEP"
            keyboardType="numeric"
            value={cep}
            onChangeText={onCepChange}
            maxLength={9}
            containerStyle={styles.field}
          />
          <Input placeholder="Rua" value={street} onChangeText={setStreet} containerStyle={styles.field} />
          <View style={styles.row}>
            <Input
              placeholder="Número"
              value={number}
              onChangeText={setNumber}
              keyboardType="numeric"
              containerStyle={styles.flexSmall}
            />
            <Input
              placeholder="Bairro"
              value={neighborhood}
              onChangeText={setNeighborhood}
              containerStyle={styles.flex}
            />
          </View>
          <View style={styles.row}>
            <Input placeholder="Cidade" value={city} onChangeText={setCity} containerStyle={styles.flex} />
            <Input
              placeholder="UF"
              value={uf}
              onChangeText={setUf}
              autoCapitalize="characters"
              maxLength={2}
              containerStyle={styles.flexSmall}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button label="Cadastrar escola" onPress={save} loading={saving} style={styles.saveBtn} />
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      padding: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    title: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
    field: { marginBottom: spacing.md },
    row: { flexDirection: 'row', gap: spacing.md },
    flex: { flex: 1, marginBottom: spacing.md },
    flexSmall: { width: 90, marginBottom: spacing.md },
    error: { fontSize: 13, color: colors.danger, marginBottom: spacing.sm },
    saveBtn: { marginTop: spacing.sm },
  });
