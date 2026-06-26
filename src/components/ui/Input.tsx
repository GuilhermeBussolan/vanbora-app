import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

interface InputProps extends TextInputProps {
  icon?: keyof typeof Ionicons.glyphMap;
  /** Exibe botão de mostrar/ocultar (para senhas). */
  password?: boolean;
  containerStyle?: ViewStyle;
}

/** Campo de texto padrão com ícone opcional e modo senha. */
export function Input({
  icon,
  password = false,
  containerStyle,
  style,
  ...rest
}: InputProps) {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const [hidden, setHidden] = useState(password);

  return (
    <View style={[styles.container, containerStyle]}>
      {icon ? (
        <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.leadingIcon} />
      ) : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[typography.body, styles.input, style]}
        secureTextEntry={hidden}
        {...rest}
      />
      {password ? (
        <Pressable onPress={() => setHidden((v) => !v)} hitSlop={8}>
          <Ionicons
            name={hidden ? 'eye-off-outline' : 'eye-outline'}
            size={18}
            color={colors.textMuted}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
  },
  leadingIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 0,
  },
});
