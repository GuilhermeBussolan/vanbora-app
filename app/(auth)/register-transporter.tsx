import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, Button, Input, Screen, StepProgress } from '@/components';
import { getSignupDraft, updateSignupDraft } from '@/state/signupDraft';
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
  // Cadastro vindo do Google/Facebook: nome e e-mail já vêm do provedor e não há
  // senha a criar. Lido só no primeiro render, para não desfazer edições.
  const [social] = useState(() => getSignupDraft());
  const isSocial = Boolean(social.socialTicket);
  const [form, setForm] = useState({
    name: social.name ?? '',
    phone: '',
    document: '',
    email: social.email ?? '',
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
    if (!isSocial) {
      if (form.password.length < 6) {
        setError('A senha deve ter ao menos 6 caracteres.');
        return;
      }
      if (form.password !== form.confirmPassword) {
        setError('As senhas não conferem.');
        return;
      }
    }
    // A senha fica fora dos parâmetros de rota: eles viram query string (visível
    // na barra de endereços na web) e entram no estado de navegação registrado em
    // logs. Ver `@/state/signupDraft`.
    updateSignupDraft({ password: isSocial ? undefined : form.password });
    // Leva os demais dados da etapa 1 para a etapa 2 (veículo).
    router.push({
      pathname: '/(auth)/register-transporter-vehicle',
      params: {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        document: form.document.trim(),
        cnh: form.cnh.trim(),
        plate: form.plate.trim(),
      },
    });
  }

  return (
    <Screen footer={<Button label="Próximo" onPress={handleNext} />}>
      <AppHeader title="Criar Conta" showBack />
      <StepProgress steps={3} current={1} />
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
          editable={!isSocial}
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
        {!isSocial ? (
          <>
            <Input
              placeholder="Senha"
              password
              value={form.password}
              onChangeText={update('password')}
            />
            <Input
              placeholder="Confirmar Senha"
              password
              value={form.confirmPassword}
              onChangeText={update('confirmPassword')}
            />
          </>
        ) : null}
      </View>

      {isSocial ? (
        <Text style={styles.socialHint}>
          Conta conectada com {social.provider === 'facebook' ? 'Facebook' : 'Google'}. Você entra
          por lá — não precisa criar senha.
        </Text>
      ) : null}

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
  socialHint: {
    marginTop: spacing.md,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  error: {
    fontSize: 13,
    color: colors.danger,
    marginTop: spacing.lg,
  },
});
