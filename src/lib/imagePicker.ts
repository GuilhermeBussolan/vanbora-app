import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';
import { UploadFile } from '@/api/client';

/**
 * Abre a galeria para o usuário escolher uma foto quadrada.
 * Devolve o arquivo pronto para upload, ou null se cancelado/sem permissão.
 */
export async function pickImage(): Promise<UploadFile | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permissão necessária', 'Autorize o acesso às fotos para escolher uma imagem.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
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
