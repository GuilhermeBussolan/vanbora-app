import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, Button, Input, Screen, StepProgress } from '@/components';
import { colors, spacing, typography } from '@/theme';

/** Cadastro do transportador — Etapa 1: dados pessoais, veículo e senha. */
export default function RegisterTransporterScreen() {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    document: '',
    email: '',
    cnh: '',
    plate: '',
    capacity: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function handleNext() {
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError('Preencha nome, e-mail e telefone.');
      return;
    }
    if (form.password.length < 6) {
      setError('A senha deve ter ao menos 6 caracteres.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('As senhas não conferem.');
      return;
    }
    // Leva os dados da etapa 1 para a etapa 2 (área e preço), onde a conta é criada.
    router.push({
      pathname: '/(auth)/register-transporter-zones',
      params: {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        document: form.document.trim(),
        cnh: form.cnh.trim(),
        plate: form.plate.trim(),
        capacity: form.capacity.trim(),
        password: form.password,
      },
    });
  }

  return (
    <Screen footer={<Button label="Próximo" onPress={handleNext} />}>
      <AppHeader title="Criar Conta" showBack />
      <StepProgress steps={2} current={1} />
      <Text style={[typography.sectionTitle, styles.section]}>Dados do Transportador</Text>

      <View style={styles.form}>
        <Input placeholder="Nome Completo" value={form.name} onChangeText={update('name')} />
        <Input
          placeholder="Telefone (Celular)"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={update('phone')}
        />
        <Input
          placeholder="CPF / CNPJ"
          keyboardType="numeric"
          value={form.document}
          onChangeText={update('document')}
        />
        <Input
          placeholder="E-mail"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={update('email')}
        />
        <Input placeholder="CNH" keyboardType="numeric" value={form.cnh} onChangeText={update('cnh')} />
        <View style={styles.row}>
          <Input
            placeholder="Placa do Veículo"
            autoCapitalize="characters"
            value={form.plate}
            onChangeText={update('plate')}
            containerStyle={styles.rowItem}
          />
          <Input
            placeholder="Lotação Máx."
            keyboardType="numeric"
            value={form.capacity}
            onChangeText={update('capacity')}
            containerStyle={styles.rowItem}
          />
        </View>
        <Input placeholder="Senha" password value={form.password} onChangeText={update('password')} />
        <Input
          placeholder="Confirmar Senha"
          password
          value={form.confirmPassword}
          onChangeText={update('confirmPassword')}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  error: {
    fontSize: 13,
    color: colors.danger,
    marginTop: spacing.lg,
  },
});
