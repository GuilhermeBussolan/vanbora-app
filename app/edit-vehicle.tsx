import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, CheckboxRow, Input, Screen, SectionTitle } from '@/components';
import { useAppState } from '@/context/AppState';
import {
  addVehiclePhoto,
  deleteVehiclePhoto,
  getMyProfile,
  replaceVehiclePhoto,
  reorderVehiclePhotos,
  updateVehicle,
  updateVehicleCharacteristics,
} from '@/api/transporter';
import { mediaUrl } from '@/api/client';
import { pickVehiclePhoto } from '@/lib/imagePicker';
import { formatCnh, formatPlate, isValidCnh, isValidPlate } from '@/lib/validation';
import { VEHICLE_ACCESSIBILITY_FEATURES, VEHICLE_CHARACTERISTICS } from '@/lib/vehicleFeatures';
import { VehicleAccessibilityFeature, VehicleCharacteristic } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

const MAX_PHOTOS = 3;
/** Ícones sobre o overlay translúcido preto das fotos — sempre branco, independente do tema. */
const OVERLAY_ICON_COLOR = '#FFFFFF';

/** Edição dos dados do veículo: CNH/placa, fotos, características e acessibilidade. */
export default function EditVehicleScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const { token } = useAppState();
  const [cnh, setCnh] = useState('');
  const [plate, setPlate] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [characteristics, setCharacteristics] = useState<Set<VehicleCharacteristic>>(new Set());
  const [accessibility, setAccessibility] = useState<Set<VehicleAccessibilityFeature>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyPhoto, setBusyPhoto] = useState<number | 'add' | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getMyProfile(token)
      .then((p) => {
        setCnh(p.cnh ?? '');
        setPlate(p.plate ?? '');
        setPhotos(p.vehiclePhotoUrls);
        setCharacteristics(new Set(p.vehicleCharacteristics));
        setAccessibility(new Set(p.vehicleAccessibilityFeatures));
      })
      .catch((err) => setError(err?.message ?? 'Falha ao carregar os dados.'))
      .finally(() => setLoading(false));
  }, [token]);

  function toggleCharacteristic(key: VehicleCharacteristic) {
    setCharacteristics((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function toggleAccessibility(key: VehicleAccessibilityFeature) {
    setAccessibility((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function handleAddPhoto() {
    if (!token || photos.length >= MAX_PHOTOS) return;
    const file = await pickVehiclePhoto();
    if (!file) return;
    setBusyPhoto('add');
    try {
      const updated = await addVehiclePhoto(token, file);
      setPhotos(updated.vehiclePhotoUrls);
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Falha ao enviar a foto.');
    } finally {
      setBusyPhoto(null);
    }
  }

  async function handleReplacePhoto(index: number) {
    if (!token) return;
    const file = await pickVehiclePhoto();
    if (!file) return;
    setBusyPhoto(index);
    try {
      const updated = await replaceVehiclePhoto(token, index, file);
      setPhotos(updated.vehiclePhotoUrls);
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Falha ao enviar a foto.');
    } finally {
      setBusyPhoto(null);
    }
  }

  function handleDeletePhoto(index: number) {
    Alert.alert('Excluir foto', 'Deseja remover esta foto do veículo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => doDeletePhoto(index) },
    ]);
  }

  async function doDeletePhoto(index: number) {
    if (!token) return;
    setBusyPhoto(index);
    try {
      const updated = await deleteVehiclePhoto(token, index);
      setPhotos(updated.vehiclePhotoUrls);
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Falha ao excluir a foto.');
    } finally {
      setBusyPhoto(null);
    }
  }

  async function handleSwapPhotos(a: number, b: number) {
    if (!token) return;
    const order = photos.map((_, i) => i);
    [order[a], order[b]] = [order[b], order[a]];
    setBusyPhoto(a);
    try {
      const updated = await reorderVehiclePhotos(token, order);
      setPhotos(updated.vehiclePhotoUrls);
    } catch (err: any) {
      Alert.alert('Erro', err?.message ?? 'Falha ao reordenar as fotos.');
    } finally {
      setBusyPhoto(null);
    }
  }

  async function handleSave() {
    if (cnh.trim() && !isValidCnh(cnh)) {
      setError('CNH inválida. Informe os 11 dígitos do número de registro.');
      return;
    }
    if (plate.trim() && !isValidPlate(plate)) {
      setError('Placa inválida. Use até 7 caracteres (letras e números).');
      return;
    }
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await updateVehicle(token, {
        cnh: cnh.trim() || null,
        plate: plate.trim() || null,
      });
      await updateVehicleCharacteristics(token, {
        characteristics: Array.from(characteristics),
        accessibilityFeatures: Array.from(accessibility),
      });
      router.back();
    } catch (err: any) {
      setError(err?.message ?? 'Falha ao salvar.');
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
    <Screen footer={<Button label="Salvar" onPress={handleSave} loading={saving} />}>
      <AppHeader showBack />
      <Text style={[typography.title, styles.title]}>Meu Veículo</Text>
      <Text style={styles.subtitle}>Mantenha as informações do seu transporte atualizadas.</Text>

      <Text style={styles.fieldLabel}>CNH</Text>
      <Input
        icon="card-outline"
        placeholder="11 dígitos"
        value={cnh}
        onChangeText={(v) => setCnh(formatCnh(v))}
        keyboardType="numeric"
        maxLength={11}
        containerStyle={styles.field}
      />

      <Text style={styles.fieldLabel}>Placa</Text>
      <Input
        icon="car-outline"
        placeholder="ABC1D34"
        value={plate}
        onChangeText={(v) => setPlate(formatPlate(v))}
        autoCapitalize="characters"
        maxLength={7}
        containerStyle={styles.field}
      />

      <View style={styles.photosHeader}>
        <SectionTitle title="Fotos do veículo" style={styles.section} />
        <Text style={styles.photoCounter}>{photos.length}/{MAX_PHOTOS} fotos</Text>
      </View>
      <Text style={styles.helperText}>A primeira foto é a principal, exibida no perfil.</Text>
      <View style={styles.photoRow}>
        {Array.from({ length: MAX_PHOTOS }).map((_, index) => {
          const url = photos[index];
          const isBusy = busyPhoto === index;
          if (url) {
            return (
              <View key={index} style={styles.photoSlot}>
                <Image source={{ uri: mediaUrl(url) }} style={styles.photoImage} />
                {index === 0 ? (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>Principal</Text>
                  </View>
                ) : null}
                {index > 0 ? (
                  <Pressable
                    onPress={() => handleSwapPhotos(index, index - 1)}
                    style={styles.moveLeftBtn}
                    hitSlop={6}
                  >
                    <Ionicons name="chevron-back" size={16} color={OVERLAY_ICON_COLOR} />
                  </Pressable>
                ) : null}
                {index < photos.length - 1 ? (
                  <Pressable
                    onPress={() => handleSwapPhotos(index, index + 1)}
                    style={styles.moveRightBtn}
                    hitSlop={6}
                  >
                    <Ionicons name="chevron-forward" size={16} color={OVERLAY_ICON_COLOR} />
                  </Pressable>
                ) : null}
                <View style={styles.photoActions}>
                  <Pressable
                    onPress={() => handleReplacePhoto(index)}
                    style={styles.photoActionBtn}
                    hitSlop={4}
                  >
                    <Ionicons name="camera" size={13} color={OVERLAY_ICON_COLOR} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeletePhoto(index)}
                    style={styles.photoActionBtn}
                    hitSlop={4}
                  >
                    <Ionicons name="trash" size={13} color={OVERLAY_ICON_COLOR} />
                  </Pressable>
                </View>
                {isBusy ? (
                  <View style={styles.photoOverlay}>
                    <ActivityIndicator color={OVERLAY_ICON_COLOR} />
                  </View>
                ) : null}
              </View>
            );
          }
          if (index === photos.length) {
            return (
              <Pressable key={index} onPress={handleAddPhoto} style={styles.photoAddSlot}>
                {busyPhoto === 'add' ? (
                  <ActivityIndicator color={colors.brand} />
                ) : (
                  <>
                    <Ionicons name="add" size={22} color={colors.textSecondary} />
                    <Text style={styles.photoAddText}>Adicionar foto</Text>
                  </>
                )}
              </Pressable>
            );
          }
          return <View key={index} style={[styles.photoSlot, styles.photoSlotEmpty]} />;
        })}
      </View>

      <SectionTitle title="Características do veículo" style={styles.section} />
      {VEHICLE_CHARACTERISTICS.map((opt) => (
        <CheckboxRow
          key={opt.key}
          icon={opt.icon}
          label={opt.label}
          checked={characteristics.has(opt.key)}
          onToggle={() => toggleCharacteristic(opt.key)}
        />
      ))}

      <SectionTitle title="Acessibilidade" style={styles.section} />
      <Text style={styles.helperText}>
        Marque apenas o que se aplica de fato ao seu veículo. "Transporta alunos com
        deficiência" não significa que o veículo é adaptado — são informações diferentes.
      </Text>
      {VEHICLE_ACCESSIBILITY_FEATURES.map((opt) => (
        <CheckboxRow
          key={opt.key}
          icon={opt.icon}
          label={opt.label}
          checked={accessibility.has(opt.key)}
          onToggle={() => toggleAccessibility(opt.key)}
        />
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xxxl },
  title: { marginTop: spacing.md },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.lg },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.xs, marginTop: spacing.md },
  field: { marginBottom: spacing.sm },
  section: { marginTop: spacing.lg, marginBottom: 0 },
  photosHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  photoCounter: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.lg },
  helperText: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.sm, lineHeight: 17 },
  photoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  photoSlot: {
    width: '31%',
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photoSlotEmpty: { borderStyle: 'dashed', opacity: 0.4 },
  photoImage: { width: '100%', height: '100%' },
  mainBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  mainBadgeText: { fontSize: 9, fontWeight: '700', color: '#FFFFFF' },
  photoActions: { position: 'absolute', bottom: 4, right: 4, flexDirection: 'row', gap: 4 },
  photoActionBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveLeftBtn: {
    position: 'absolute',
    top: '50%',
    left: 2,
    marginTop: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moveRightBtn: {
    position: 'absolute',
    top: '50%',
    right: 2,
    marginTop: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddSlot: {
    width: '31%',
    aspectRatio: 4 / 3,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoAddText: { fontSize: 10, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  error: { fontSize: 13, color: colors.danger, marginTop: spacing.sm },
});
