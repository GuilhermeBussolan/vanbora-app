import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { UploadFile } from '@/api/client';

async function pickWithAspect(aspect: [number, number]): Promise<UploadFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para escolher uma imagem.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect,
    quality: 0.7,
  });

  if (result.canceled || result.assets.length === 0) return null;

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    name: asset.fileName ?? `photo_${Date.now()}.jpg`,
    type: asset.mimeType ?? 'image/jpeg',
  };
}

/**
 * Abre a galeria para o usuário escolher uma foto quadrada (avatar).
 * Devolve o arquivo pronto para upload, ou null se cancelado/sem permissão.
 */
export function pickImage(): Promise<UploadFile | null> {
  return pickWithAspect([1, 1]);
}

/** Foto do veículo, recorte 4:3 (paisagem) — melhor enquadramento para uma van. */
export function pickVehiclePhoto(): Promise<UploadFile | null> {
  return pickWithAspect([4, 3]);
}
