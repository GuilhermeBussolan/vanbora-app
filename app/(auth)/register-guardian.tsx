import React, { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppHeader, Button, Input, Screen } from '@/components';
import { AddressFields, AddressValue, EMPTY_ADDRESS } from '@/components/feature/AddressFields';
import { useAppState } from '@/context/AppState';
import { registerGuardian } from '@/api/auth';
import { formatCpf, formatPhone, isValidCpf, isValidEmail, isValidPhone } from '@/lib/validation';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Cadastro do responsável. Cria a conta na API (com endereços) e entra logado. */
export default function RegisterGuardianScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { applySession } = useAppState();
  const [form, setForm] = useState({
    name: '',
    phone: '',
    cpf: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [pickup, setPickup] = useState<AddressValue>(EMPTY_ADDRESS);
  const [deliverySame, setDeliverySame] = useState(true);
  const [delivery, setDelivery] = useState<AddressValue>(EMPTY_ADDRESS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleRegister() {
    if (!form.name.trim()) {
      setError('Informe seu nome completo.');
      return;
    }
    if (!isValidPhone(form.phone)) {
      setError('Telefone inválido. Informe DDD + número, ex.: (11) 9 1234-5678.');
      return;
    }
    if (!isValidCpf(form.cpf)) {
      setError('CPF inválido. Confira os números digitados.');
      return;
    }
    if (!isValidEmail(form.email)) {
      setError('E-mail inválido. Ex.: nome@exemplo.com.');
      return;
    }
    if (!pickup.cep.trim() || !pickup.street.trim() || !pickup.number.trim()) {
      setError('Informe o endereço de embarque (CEP, rua e número).');
      return;
    }
    if (!deliverySame && (!delivery.cep.trim() || !delivery.street.trim() || !delivery.number.trim())) {
      setError('Informe o endereço de entrega ou marque "mesmo endereço".');
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
    setLoading(true);
    setError(null);
    try {
      const session = await registerGuardian({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone.trim(),
        cpf: form.cpf.trim(),
        pickup,
        deliverySameAsPickup: deliverySame,
        delivery: deliverySame ? null : delivery,
      });
      await applySession(session);
      router.replace('/(guardian)/home');
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao cadastrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen footer={<Button label="Cadastrar" onPress={handleRegister} loading={loading} />}>
      <AppHeader title="Criar Conta" showBack />
      <Text style={[typography.sectionTitle, styles.section]}>Dados do Responsável</Text>

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
          value={form.cpf}
          onChangeText={(v) => update('cpf')(formatCpf(v))}
          maxLength={14}
        />
        <Input
          placeholder="E-mail"
          autoCapitalize="none"
          keyboardType="email-address"
          value={form.email}
          onChangeText={update('email')}
        />
      </View>

      <Text style={[typography.sectionTitle, styles.section]}>Endereço de Embarque</Text>
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
          <Text style={[typography.sectionTitle, styles.section]}>Endereço de Entrega</Text>
          <Text style={styles.sectionHint}>Onde a criança será deixada.</Text>
          <AddressFields value={delivery} onChange={setDelivery} />
        </>
      ) : null}

      <Text style={[typography.sectionTitle, styles.section]}>Senha</Text>
      <View style={styles.form}>
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
  section: { marginTop: spacing.xl, marginBottom: spacing.xs },
  sectionHint: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.md },
  form: { gap: spacing.md },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  toggleText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.lg },
});
