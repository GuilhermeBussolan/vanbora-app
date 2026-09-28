import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Alert } from 'react-native';
import { UploadFile } from '@/api/client';

/** Lado maior máximo da imagem enviada — suficiente para conferência e bem abaixo do limite da API. */
const MAX_DIMENSION = 1600;

/**
 * Reduz e recomprime a imagem antes do upload. Fotos da câmera saem em resolução cheia
 * (vários MB) e passavam do limite da API, que derrubava a conexão — no app isso aparecia
 * como "Não foi possível enviar a imagem". Em caso de falha, envia o original.
 */
async function toUploadFile(asset: ImagePicker.ImagePickerAsset, prefix: string): Promise<UploadFile> {
  try {
    const context = ImageManipulator.manipulate(asset.uri);
    const landscape = (asset.width ?? 0) >= (asset.height ?? 0);
    const largest = Math.max(asset.width ?? 0, asset.height ?? 0);
    if (largest > MAX_DIMENSION) {
      context.resize(landscape ? { width: MAX_DIMENSION } : { height: MAX_DIMENSION });
    }
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
    return { uri: saved.uri, name: `${prefix}_${Date.now()}.jpg`, type: 'image/jpeg' };
  } catch {
    return {
      uri: asset.uri,
      name: asset.fileName ?? `${prefix}_${Date.now()}.jpg`,
      type: asset.mimeType ?? 'image/jpeg',
    };
  }
}

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
  return toUploadFile(result.assets[0], 'photo');
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

/**
 * Tira uma foto NA HORA com a câmera do aparelho (sem opção de galeria), usada como
 * comprovação no checklist de segurança: a foto precisa ser do interior da van agora,
 * não uma imagem antiga. Devolve null se cancelado/sem permissão.
 */
export async function takeCameraPhoto(): Promise<UploadFile | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert(
      'Permissão necessária',
      'Autorize o acesso à câmera para fotografar o interior da van.',
    );
    return null;
  }

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsEditing: false,
    quality: 0.6,
  });

  if (result.canceled || result.assets.length === 0) return null;
  return toUploadFile(result.assets[0], 'checklist');
}
