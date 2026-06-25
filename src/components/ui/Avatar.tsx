import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/theme';

interface AvatarProps {
  name?: string;
  size?: number;
  /** Usa ícone genérico de pessoa em vez das iniciais. */
  icon?: boolean;
  tone?: 'brand' | 'neutral';
  /** Foto (URL absoluta). Quando presente, é exibida no lugar das iniciais. */
  uri?: string | null;
}

function initials(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

/** Avatar circular com foto, iniciais ou ícone de pessoa. */
export function Avatar({ name, size = 44, icon = false, tone = 'brand', uri }: AvatarProps) {
  const bg = tone === 'brand' ? colors.brandSoft : colors.border;
  const dimension = { width: size, height: size, borderRadius: radius.pill };

  if (uri) {
    return <Image source={{ uri }} style={[styles.circle, dimension]} />;
  }

  return (
    <View style={[styles.circle, dimension, { backgroundColor: bg }]}>
      {icon || !name ? (
        <Ionicons name="person" size={size * 0.5} color={colors.textSecondary} />
      ) : (
        <Text style={[styles.text, { fontSize: size * 0.36 }]}>{initials(name)}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  text: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
