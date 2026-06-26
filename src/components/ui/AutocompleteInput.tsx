import React, { useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

interface AutocompleteInputProps {
  icon?: keyof typeof Ionicons.glyphMap;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  /** Opções disponíveis (já em ordem alfabética). */
  options: string[];
  /** Disparado ao escolher uma opção da lista (além de atualizar o texto). */
  onSelect?: (option: string) => void;
}

/** Remove acentos e caixa para casar "São" com "sao". */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Campo de texto com autocomplete: ao focar, mostra todas as opções armazenadas;
 * conforme o usuário digita, filtra apenas as que contêm o texto (ignora acentos/caixa).
 * Selecionar uma opção garante que o filtro casa exatamente com o que está salvo.
 */
export function AutocompleteInput({
  icon,
  placeholder,
  value,
  onChangeText,
  options,
  onSelect,
}: AutocompleteInputProps) {
  const { colors, styles } = useThemedScreen(createStyles);
  const [focused, setFocused] = useState(false);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    const q = normalize(value);
    if (!q) return options;
    return options.filter((o) => normalize(o).includes(q));
  }, [options, value]);

  function choose(option: string) {
    onChangeText(option);
    onSelect?.(option);
    setFocused(false);
  }

  const showList = focused && filtered.length > 0;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.inputBox, focused && styles.inputBoxFocused]}>
        {icon ? (
          <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.leadingIcon} />
        ) : null}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          autoCorrect={false}
          onFocus={() => {
            if (blurTimeout.current) clearTimeout(blurTimeout.current);
            setFocused(true);
          }}
          // Atraso para a seleção de uma opção registrar antes de esconder a lista.
          onBlur={() => {
            blurTimeout.current = setTimeout(() => setFocused(false), 150);
          }}
        />
        {value ? (
          <Pressable onPress={() => onChangeText('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : (
          <Ionicons name={focused ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
        )}
      </View>

      {showList ? (
        <View style={styles.dropdown}>
          <ScrollView
            style={styles.dropdownScroll}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {filtered.map((option, index) => (
              <Pressable
                key={option}
                style={[styles.row, index < filtered.length - 1 && styles.rowDivider]}
                onPress={() => choose(option)}
              >
                <Ionicons name={icon ?? 'pricetag-outline'} size={15} color={colors.textMuted} />
                <Text style={styles.rowText} numberOfLines={1}>
                  {option}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    wrapper: { position: 'relative', zIndex: 10 },
    inputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 50,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.white,
    },
    inputBoxFocused: { borderColor: colors.brand },
    leadingIcon: { marginRight: spacing.sm },
    input: { flex: 1, fontSize: 14, color: colors.textPrimary, paddingVertical: 0 },
    dropdown: {
      marginTop: 4,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.white,
      overflow: 'hidden',
      // Sobrepõe o conteúdo seguinte em vez de empurrá-lo (Android).
      elevation: 4,
    },
    dropdownScroll: { maxHeight: 220 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    rowText: { flex: 1, fontSize: 14, color: colors.textPrimary },
  });
