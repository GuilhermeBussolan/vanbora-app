import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, Button, Input, Screen, StepProgress } from '@/components';
import {
  formatCnh,
  formatCpf,
  formatPhone,
  formatPlate,
  isValidCnh,
  isValidCpf,
  isValidEmail,
  isValidPhone,
  isValidPlate,
} from '@/lib/validation';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Cadastro do transportador — Etapa 1: dados pessoais, veículo e senha. */
export default function RegisterTransporterScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    document: '',
    email: '',
    cnh: '',
    plate: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function handleNext() {
    if (!form.name.trim()) {
      setError('Informe seu nome completo.');
      return;
    }
    if (!isValidPhone(form.phone)) {
      setError('Telefone inválido. Informe DDD + número, ex.: (11) 9 1234-5678.');
      return;
    }
    if (!isValidCpf(form.document)) {
      setError('CPF inválido. Confira os números digitados.');
      return;
    }
    if (!isValidEmail(form.email)) {
      setError('E-mail inválido. Ex.: nome@exemplo.com.');
      return;
    }
    if (!isValidCnh(form.cnh)) {
      setError('CNH inválida. Informe os 11 dígitos do número de registro.');
      return;
    }
    if (!isValidPlate(form.plate)) {
      setError('Placa inválida. Use até 7 caracteres (letras e números).');
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
          placeholder="Telefone — (11) 9 1234-5678"
          keyboardType="phone-pad"
          value={form.phone}
          onChangeText={(v) => update('phone')(formatPhone(v))}
          maxLength={16}
        />
        <Input
          placeholder="CPF — 123.456.789-10"
          keyboardType="numeric"
          value={form.document}
          onChangeText={(v) => update('document')(formatCpf(v))}
          maxLength={14}
        />
        <Input
          placeholder="E-mail"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={update('email')}
        />
        <Input
          placeholder="CNH — 11 dígitos"
          keyboardType="numeric"
          value={form.cnh}
          onChangeText={(v) => update('cnh')(formatCnh(v))}
          maxLength={11}
        />
        <Input
          placeholder="Placa do Veículo"
          autoCapitalize="characters"
          value={form.plate}
          onChangeText={(v) => update('plate')(formatPlate(v))}
          maxLength={7}
        />
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

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
  },
  form: {
    gap: spacing.md,
  },
  error: {
    fontSize: 13,
    color: colors.danger,
    marginTop: spacing.lg,
  },
});
