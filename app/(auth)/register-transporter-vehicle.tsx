import React, { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader, Button, CheckboxRow, Screen, SectionTitle, StepProgress } from '@/components';
import { UploadFile } from '@/api/client';
import { pickVehiclePhoto } from '@/lib/imagePicker';
import { VEHICLE_ACCESSIBILITY_FEATURES, VEHICLE_CHARACTERISTICS } from '@/lib/vehicleFeatures';
import { VehicleAccessibilityFeature, VehicleCharacteristic } from '@/types';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

const MAX_PHOTOS = 3;

/**
 * Cadastro do transportador — Etapa 2: fotos e características do veículo.
 * Nada aqui é obrigatório: a conta ainda não existe (fotos só são enviadas após o
 * cadastro concluído, na etapa seguinte, quando já existe um token de autenticação).
 */
export default function RegisterTransporterVehicleScreen() {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const step1 = useLocalSearchParams<{
    name: string;
    email: string;
    phone: string;
    document?: string;
    cnh?: string;
    plate?: string;
    password: string;
  }>();

  const [photos, setPhotos] = useState<UploadFile[]>([]);
  const [characteristics, setCharacteristics] = useState<Set<VehicleCharacteristic>>(new Set());
  const [accessibility, setAccessibility] = useState<Set<VehicleAccessibilityFeature>>(new Set());

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
    if (photos.length >= MAX_PHOTOS) return;
    const file = await pickVehiclePhoto();
    if (!file) return;
    setPhotos((prev) => [...prev, file]);
  }

  async function handleReplacePhoto(index: number) {
    const file = await pickVehiclePhoto();
    if (!file) return;
    setPhotos((prev) => prev.map((p, i) => (i === index ? file : p)));
  }

  function handleDeletePhoto(index: number) {
    Alert.alert('Remover foto', 'Deseja remover esta foto do veículo?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => setPhotos((prev) => prev.filter((_, i) => i !== index)),
      },
    ]);
  }

  function handleSwapPhotos(a: number, b: number) {
    setPhotos((prev) => {
      const next = [...prev];
      [next[a], next[b]] = [next[b], next[a]];
      return next;
    });
  }

  function handleNext() {
    router.push({
      pathname: '/(auth)/register-transporter-zones',
      params: {
        ...step1,
        vehicleCharacteristics: JSON.stringify(Array.from(characteristics)),
        vehicleAccessibilityFeatures: JSON.stringify(Array.from(accessibility)),
        vehiclePhotos: JSON.stringify(photos),
      },
    });
  }

  return (
    <Screen footer={<Button label="Próximo" onPress={handleNext} />}>
      <AppHeader title="Criar Conta" showBack />
      <StepProgress steps={3} current={2} />
      <Text style={[typography.sectionTitle, styles.section]}>Seu Veículo</Text>
      <Text style={styles.subtitle}>
        Opcional — você pode preencher agora ou completar depois em Perfil → Meu Veículo.
      </Text>

      <View style={styles.photosHeader}>
        <SectionTitle title="Fotos do veículo" style={styles.sectionInner} />
        <Text style={styles.photoCounter}>{photos.length}/{MAX_PHOTOS} fotos</Text>
      </View>
      <View style={styles.photoRow}>
        {Array.from({ length: MAX_PHOTOS }).map((_, index) => {
          const file = photos[index];
          if (file) {
            return (
              <View key={index} style={styles.photoSlot}>
                <Image source={{ uri: file.uri }} style={styles.photoImage} />
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
                    <Ionicons name="chevron-back" size={16} color="#FFFFFF" />
                  </Pressable>
                ) : null}
                {index < photos.length - 1 ? (
                  <Pressable
                    onPress={() => handleSwapPhotos(index, index + 1)}
                    style={styles.moveRightBtn}
                    hitSlop={6}
                  >
                    <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                  </Pressable>
                ) : null}
                <View style={styles.photoActions}>
                  <Pressable onPress={() => handleReplacePhoto(index)} style={styles.photoActionBtn} hitSlop={4}>
                    <Ionicons name="camera" size={13} color="#FFFFFF" />
                  </Pressable>
                  <Pressable onPress={() => handleDeletePhoto(index)} style={styles.photoActionBtn} hitSlop={4}>
                    <Ionicons name="trash" size={13} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            );
          }
          if (index === photos.length) {
            return (
              <Pressable key={index} onPress={handleAddPhoto} style={styles.photoAddSlot}>
                <Ionicons name="add" size={22} color={colors.textSecondary} />
                <Text style={styles.photoAddText}>Adicionar foto</Text>
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
      {VEHICLE_ACCESSIBILITY_FEATURES.map((opt) => (
        <CheckboxRow
          key={opt.key}
          icon={opt.icon}
          label={opt.label}
          checked={accessibility.has(opt.key)}
          onToggle={() => toggleAccessibility(opt.key)}
        />
      ))}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  section: { marginTop: spacing.lg, marginBottom: spacing.md },
  sectionInner: { marginTop: spacing.lg, marginBottom: 0 },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.xs, marginBottom: spacing.xs, lineHeight: 19 },
  photosHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  photoCounter: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: spacing.lg },
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
});
