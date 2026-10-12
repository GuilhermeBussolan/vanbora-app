import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Input } from '@/components';
import { formatPhone } from '@/lib/validation';
import { spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

export interface MonitorAccessValue {
  email: string;
  phone: string;
  password: string;
}

interface MonitorAccessFieldsProps {
  value: MonitorAccessValue;
  onChange: (value: MonitorAccessValue) => void;
  /** Na edição a senha é opcional (em branco mantém a atual). */
  passwordOptional?: boolean;
}

/** Campos de acesso ao app do monitor (e-mail de login, telefone e senha provisória). */
export function MonitorAccessFields({ value, onChange, passwordOptional = false }: MonitorAccessFieldsProps) {
  const { styles } = useThemedScreen(createStyles);
  const set = (key: keyof MonitorAccessValue) => (text: string) => onChange({ ...value, [key]: text });

  return (
    <View style={styles.form}>
      <Input
        icon="mail-outline"
        placeholder="E-mail de acesso"
        autoCapitalize="none"
        keyboardType="email-address"
        value={value.email}
        onChangeText={set('email')}
      />
      <Input
        icon="call-outline"
        placeholder="Telefone — (11) 9 1234-5678"
        keyboardType="phone-pad"
        value={value.phone}
        onChangeText={(v) => set('phone')(formatPhone(v))}
        maxLength={16}
      />
      <Input
        icon="lock-closed-outline"
        placeholder={passwordOptional ? 'Nova senha (deixe em branco para manter)' : 'Senha provisória'}
        password
        value={value.password}
        onChangeText={set('password')}
      />
      <Text style={styles.hint}>
        Informe ao monitor o e-mail e a senha. Ele poderá trocar a senha no próprio perfil.
      </Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  form: { gap: spacing.sm },
  hint: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
});
