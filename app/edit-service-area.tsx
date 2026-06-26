import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, Input, Screen, SchoolRegisterModal } from '@/components';
import { useAppState } from '@/context/AppState';
import { getMyProfile, updateServiceArea } from '@/api/transporter';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/** Edição da área de atendimento: escolas e bairros atendidos. */
export default function EditServiceAreaScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [schools, setSchools] = useState<string[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [schoolModalOpen, setSchoolModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getMyProfile(token)
      .then((p) => {
        setSchools(p.schools);
        setNeighborhoods(p.neighborhoods);
      })
      .catch((err) => setError(err?.message ?? 'Falha ao carregar a área.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSave() {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await updateServiceArea(token, { schools, neighborhoods });
      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao salvar a área.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader showBack />
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen footer={<Button label="Salvar área" onPress={handleSave} loading={saving} />}>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Área de Atendimento</Text>
      <Text style={styles.subtitle}>
        Os responsáveis veem estas escolas e bairros no seu perfil. As mudanças aparecem para eles na hora.
      </Text>

      <View style={styles.section}>
        <Text style={styles.fieldLabel}>Escolas atendidas</Text>
        <Button
          label="Adicionar escola por CEP"
          variant="outline"
          icon="add"
          onPress={() => setSchoolModalOpen(true)}
        />
        <View style={styles.chips}>
          {schools.length === 0 ? (
            <Text style={styles.empty}>Nenhuma escola adicionada.</Text>
          ) : (
            schools.map((item) => (
              <Pressable
                key={item}
                onPress={() => setSchools(schools.filter((s) => s !== item))}
                style={styles.chip}
              >
                <Text style={styles.chipText}>{item}</Text>
                <Ionicons name="close" size={14} color={colors.textSecondary} />
              </Pressable>
            ))
          )}
        </View>
      </View>

      <EditableList
        label="Bairros atendidos"
        icon="location-outline"
        placeholder="Adicionar bairro"
        items={neighborhoods}
        onChange={setNeighborhoods}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <SchoolRegisterModal
        visible={schoolModalOpen}
        onClose={() => setSchoolModalOpen(false)}
        onAdded={(schoolName) =>
          setSchools((prev) =>
            prev.some((s) => s.toLowerCase() === schoolName.toLowerCase())
              ? prev
              : [...prev, schoolName],
          )
        }
      />
    </Screen>
  );
}

function EditableList({
  label,
  icon,
  placeholder,
  items,
  onChange,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  items: string[];
  onChange: (next: string[]) => void;
}) {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const [draft, setDraft] = useState('');

  function add() {
    const value = draft.trim();
    if (!value) return;
    if (!items.some((i) => i.toLowerCase() === value.toLowerCase())) {
      onChange([...items, value]);
    }
    setDraft('');
  }

  function remove(item: string) {
    onChange(items.filter((i) => i !== item));
  }

  return (
    <View style={styles.section}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.addRow}>
        <Input
          icon={icon}
          placeholder={placeholder}
          value={draft}
          onChangeText={setDraft}
          onSubmitEditing={add}
          returnKeyType="done"
          containerStyle={styles.flex1}
        />
        <Pressable onPress={add} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={colors.textOnBrand} />
        </Pressable>
      </View>
      <View style={styles.chips}>
        {items.length === 0 ? (
          <Text style={styles.empty}>Nenhum item adicionado.</Text>
        ) : (
          items.map((item) => (
            <Pressable key={item} onPress={() => remove(item)} style={styles.chip}>
              <Text style={styles.chipText}>{item}</Text>
              <Ionicons name="close" size={14} color={colors.textSecondary} />
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxxl },
  title: { marginTop: spacing.md },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg, lineHeight: 19 },
  section: { marginTop: spacing.lg },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex1: { flex: 1 },
  addBtn: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  empty: { fontSize: 13, color: colors.textSecondary },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.brandSoft,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.lg },
});
