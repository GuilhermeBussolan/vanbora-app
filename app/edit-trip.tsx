import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, CheckboxRow, Input, Screen } from '@/components';
import { useAppState } from '@/context/AppState';
import { createTrip, deleteTrip, listTrips, updateTrip } from '@/api/trips';
import { listHelpers } from '@/api/helpers';
import { listMyStudents, StudentDto } from '@/api/dashboard';
import { HelperDto } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

/**
 * Cadastro/edição de um percurso: nome, monitores escalados e alunos (todos ou escolhidos).
 * A escala define o que cada monitor enxerga — alunos, checklist e conversas.
 */
export default function EditTripScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const params = useLocalSearchParams<{ id?: string }>();
  const tripId = params.id ? Number(params.id) : null;

  const [name, setName] = useState('');
  const [monitors, setMonitors] = useState<HelperDto[]>([]);
  const [students, setStudents] = useState<StudentDto[]>([]);
  const [monitorIds, setMonitorIds] = useState<Set<number>>(new Set());
  const [allStudents, setAllStudents] = useState(true);
  const [studentIds, setStudentIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    Promise.all([listHelpers(token), listMyStudents(token), tripId ? listTrips(token) : Promise.resolve([])])
      .then(([helpers, studentList, trips]) => {
        // Só monitores com acesso ao app podem ser escalados.
        setMonitors(helpers.filter((h) => h.hasAccess));
        setStudents(studentList);
        const trip = trips.find((t) => t.id === tripId);
        if (trip) {
          setName(trip.name);
          setMonitorIds(new Set(trip.monitors.map((m) => m.helperId)));
          setAllStudents(trip.allStudents);
          setStudentIds(new Set(trip.studentIds ?? []));
        }
      })
      .catch((err) => setError(err?.message ?? 'Falha ao carregar os dados.'))
      .finally(() => setLoading(false));
  }, [token, tripId]);

  function toggle(set: Set<number>, id: number, apply: (next: Set<number>) => void) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    apply(next);
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Informe o nome do percurso.');
      return;
    }
    if (!allStudents && studentIds.size === 0) {
      setError('Selecione ao menos um aluno ou marque "Todos os alunos".');
      return;
    }
    if (!token) return;
    setSaving(true);
    setError(null);
    const body = {
      name: name.trim(),
      monitorIds: Array.from(monitorIds),
      allStudents,
      studentIds: allStudents ? [] : Array.from(studentIds),
    };
    try {
      if (tripId) await updateTrip(token, tripId, body);
      else await createTrip(token, body);
      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao salvar o percurso.');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    if (!tripId) return;
    Alert.alert(
      'Excluir percurso',
      `Excluir "${name}"? Os monitores escalados perdem o acesso aos alunos e ao chat deste percurso. O histórico de verificações é mantido.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            try {
              await deleteTrip(token, tripId);
              router.back();
            } catch (err: any) {
              Alert.alert('Erro', err?.message ?? 'Falha ao excluir.');
            }
          },
        },
      ],
    );
  }

  return (
    <Screen footer={<Button label="Salvar percurso" onPress={handleSave} loading={saving} />}>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>{tripId ? 'Editar Percurso' : 'Novo Percurso'}</Text>
      <Text style={styles.subtitle}>
        Cada monitor só acessa os alunos, as verificações e as conversas dos percursos em que está
        escalado.
      </Text>

      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : (
        <>
          <Text style={styles.fieldLabel}>Nome</Text>
          <Input
            icon="git-branch-outline"
            placeholder="Ex.: Ida — manhã"
            value={name}
            onChangeText={setName}
            containerStyle={styles.field}
          />

          <Text style={styles.fieldLabel}>Monitores</Text>
          {monitors.length === 0 ? (
            <Text style={styles.hint}>
              Nenhum monitor com acesso ao app. Libere o acesso no cadastro do ajudante (Perfil ›
              Meus Ajudantes). Sem monitor, o motorista faz a verificação sozinho.
            </Text>
          ) : (
            monitors.map((m) => (
              <CheckboxRow
                key={m.id}
                icon="person-outline"
                label={m.accessActive ? m.name : `${m.name} (acesso desativado)`}
                checked={monitorIds.has(m.id)}
                onToggle={() => toggle(monitorIds, m.id, setMonitorIds)}
              />
            ))
          )}

          <Text style={styles.fieldLabel}>Alunos</Text>
          <Pressable style={[styles.allRow, allStudents && styles.allRowActive]} onPress={() => setAllStudents(true)}>
            <Ionicons
              name={allStudents ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={allStudents ? colors.brandDark : colors.textMuted}
            />
            <View style={styles.flex1}>
              <Text style={styles.allText}>Todos os alunos</Text>
              <Text style={styles.allHint}>Inclui automaticamente os alunos contratados depois.</Text>
            </View>
          </Pressable>
          <Pressable
            style={[styles.allRow, styles.allRowSpaced, !allStudents && styles.allRowActive]}
            onPress={() => setAllStudents(false)}
          >
            <Ionicons
              name={!allStudents ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={!allStudents ? colors.brandDark : colors.textMuted}
            />
            <Text style={styles.allText}>Escolher alunos</Text>
          </Pressable>
          {!allStudents ? (
            <View style={styles.studentList}>
              {students.length === 0 ? (
                <Text style={styles.hint}>Nenhum aluno com contrato ativo.</Text>
              ) : (
                students.map((s) => (
                  <CheckboxRow
                    key={s.dependentId}
                    icon="school-outline"
                    label={`${s.name} · ${s.school}`}
                    checked={studentIds.has(s.dependentId)}
                    onToggle={() => toggle(studentIds, s.dependentId, setStudentIds)}
                  />
                ))
              )}
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {tripId ? (
            <Pressable onPress={handleDelete} style={styles.deleteRow}>
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={styles.deleteText}>Excluir percurso</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  title: { marginTop: spacing.md },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  loader: { marginTop: spacing.xxxl },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  field: { marginBottom: spacing.sm },
  hint: { fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  flex1: { flex: 1 },
  allRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  allRowSpaced: { marginTop: spacing.sm },
  allRowActive: { borderColor: colors.brand, backgroundColor: colors.brandSoft },
  allText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  allHint: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  studentList: { marginTop: spacing.md },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.md },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  deleteText: { fontSize: 15, fontWeight: '700', color: colors.danger },
});
