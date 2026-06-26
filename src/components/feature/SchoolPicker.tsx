import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppState } from '@/context/AppState';
import { SchoolDto, searchSchools } from '@/api/schools';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

interface SchoolPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (school: { id: number; name: string }) => void;
}

/** Seletor de escola do catálogo: busca dinâmica + scroll infinito (10 por vez). */
export function SchoolPicker({ visible, onClose, onSelect }: SchoolPickerProps) {
  const { colors, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SchoolDto[]>([]);
  const [page, setPage] = useState(0);
  const [last, setLast] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(
    async (pageToLoad: number, q: string, replace: boolean) => {
      if (!token) return;
      if (replace) setLoading(true);
      else setLoadingMore(true);
      try {
        const res = await searchSchools(token, q, pageToLoad, 10);
        setItems((prev) => (replace ? res.content : [...prev, ...res.content]));
        setPage(res.number);
        setLast(res.last);
      } catch {
        if (replace) setItems([]);
      } finally {
        if (replace) setLoading(false);
        else setLoadingMore(false);
      }
    },
    [token],
  );

  // Recarrega ao abrir e ao digitar (com debounce dinâmico).
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => load(0, query, true), 300);
    return () => clearTimeout(t);
  }, [visible, query, load]);

  function loadMore() {
    if (!last && !loadingMore && !loading) {
      load(page + 1, query, false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Selecionar escola</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar escola pelo nome..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
            />
            {query ? (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.brand} />
            </View>
          ) : (
            <FlatList
              data={items}
              keyExtractor={(s) => String(s.id)}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={styles.row}
                  onPress={() => {
                    onSelect({ id: item.id, name: item.name });
                    onClose();
                  }}
                >
                  <View style={styles.iconCircle}>
                    <Ionicons name="school" size={16} color={colors.textOnBrand} />
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.name}>{item.name}</Text>
                    {item.address || item.city ? (
                      <Text style={styles.addr} numberOfLines={1}>
                        {item.address || item.city}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              )}
              onEndReached={loadMore}
              onEndReachedThreshold={0.4}
              ListEmptyComponent={
                <Text style={styles.empty}>Nenhuma escola encontrada.</Text>
              }
              ListFooterComponent={
                loadingMore ? <ActivityIndicator color={colors.brand} style={styles.footerLoad} /> : null
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.35)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      height: '85%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    title: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      height: 46,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.white,
      marginBottom: spacing.md,
    },
    searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, paddingVertical: 0 },
    center: { paddingTop: spacing.xxxl, alignItems: 'center' },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: radius.pill,
      backgroundColor: colors.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
    flex: { flex: 1 },
    name: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
    addr: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    empty: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xxxl },
    footerLoad: { marginVertical: spacing.md },
  });
