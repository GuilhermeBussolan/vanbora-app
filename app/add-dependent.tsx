import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Input, Screen, SchoolPicker } from '@/components';
import { useAppState } from '@/context/AppState';
import { addDependent } from '@/api/dependents';
import { spacing, radius, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Cadastro de um novo dependente (aluno) do responsável. */
export default function AddDependentScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token, refreshDependents } = useAppState();
  const [name, setName] = useState('');
  const [schoolId, setSchoolId] = useState<number | null>(null);
  const [schoolName, setSchoolName] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim()) {
      setError('Informe o nome do aluno.');
      return;
    }
    if (!schoolId) {
      setError('Selecione a escola.');
      return;
    }
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await addDependent(token, { name: name.trim(), school: schoolName, schoolId });
      await refreshDependents();
      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao cadastrar dependente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen footer={<Button label="Salvar dependente" onPress={handleSave} loading={loading} />}>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Adicionar Dependente</Text>
      <Text style={styles.subtitle}>Cadastre o aluno que será transportado.</Text>

      <Input
        icon="person-outline"
        placeholder="Nome do aluno"
        value={name}
        onChangeText={setName}
        containerStyle={styles.field}
      />

      <Text style={styles.fieldLabel}>Escola</Text>
      <Pressable style={styles.picker} onPress={() => setPickerOpen(true)}>
        <Ionicons name="school-outline" size={18} color={colors.textMuted} />
        <Text style={[styles.pickerText, !schoolName && styles.pickerPlaceholder]}>
          {schoolName || 'Selecionar escola'}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <SchoolPicker
        visible={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(s) => {
          setSchoolId(s.id);
          setSchoolName(s.name);
        }}
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    title: { marginTop: spacing.md },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      marginBottom: spacing.xl,
    },
    field: { marginBottom: spacing.md },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    picker: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      height: 50,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.white,
    },
    pickerText: { flex: 1, fontSize: 14, color: colors.textPrimary },
    pickerPlaceholder: { color: colors.textMuted },
    error: { fontSize: 13, color: colors.danger, marginTop: spacing.md },
  });
