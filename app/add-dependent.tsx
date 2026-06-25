import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, Button, Input, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { addDependent } from '@/api/dependents';
import { colors, spacing, typography } from '@/theme';

/** Cadastro de um novo dependente (aluno) do responsável. */
export default function AddDependentScreen() {
  const { token } = useAppState();
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!name.trim() || !school.trim()) {
      setError('Preencha o nome e a escola.');
      return;
    }
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      await addDependent(token, { name: name.trim(), school: school.trim() });
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
      <Input
        icon="school-outline"
        placeholder="Escola"
        value={school}
        onChangeText={setSchool}
        containerStyle={styles.field}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: spacing.md },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xl },
  field: { marginBottom: spacing.md },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.sm },
});
