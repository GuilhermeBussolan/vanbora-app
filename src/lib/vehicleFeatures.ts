/** Rótulos e ícones das características/acessibilidade do veículo (lista fixa, sem texto livre). */
import { Ionicons } from '@expo/vector-icons';
import { VehicleAccessibilityFeature, VehicleCharacteristic } from '@/types';

export interface FeatureOption<T extends string> {
  key: T;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

/** Categoria de exibição — agrupa os chips no perfil (ordem de prioridade: segurança > conforto). */
export type VehicleCharacteristicCategory = 'safety' | 'comfort';

export interface CharacteristicOption extends FeatureOption<VehicleCharacteristic> {
  category: VehicleCharacteristicCategory;
}

export const VEHICLE_CHARACTERISTICS: CharacteristicOption[] = [
  { key: 'SEATBELT_ALL_SEATS', label: 'Cintos de segurança em todos os assentos', icon: 'shield-checkmark-outline', category: 'safety' },
  { key: 'CHILD_SEAT', label: 'Cadeirinha para crianças pequenas', icon: 'happy-outline', category: 'safety' },
  { key: 'CHILD_LOCK_WINDOWS', label: 'Janelas com trava infantil', icon: 'lock-closed-outline', category: 'safety' },
  { key: 'FREQUENT_SANITIZATION', label: 'Higienização frequente', icon: 'sparkles-outline', category: 'safety' },
  { key: 'AIR_CONDITIONING', label: 'Ar-condicionado', icon: 'snow-outline', category: 'comfort' },
  { key: 'TV', label: 'TV', icon: 'tv-outline', category: 'comfort' },
  { key: 'COMFORTABLE_SEATS', label: 'Assentos confortáveis', icon: 'body-outline', category: 'comfort' },
  { key: 'SOUND_SYSTEM', label: 'Sistema de som', icon: 'musical-notes-outline', category: 'comfort' },
];

export const CHARACTERISTIC_CATEGORY_LABELS: Record<VehicleCharacteristicCategory, string> = {
  safety: 'Segurança',
  comfort: 'Conforto',
};

/**
 * Deliberadamente detalhado (em vez de um único "Aceita PCD" ambíguo). Marcar
 * TRANSPORTS_STUDENTS_WITH_DISABILITY não significa que o veículo é adaptado — são
 * informações independentes e exibidas como itens separados.
 */
export const VEHICLE_ACCESSIBILITY_FEATURES: FeatureOption<VehicleAccessibilityFeature>[] = [
  { key: 'WHEELCHAIR_ADAPTED', label: 'Veículo adaptado para cadeira de rodas', icon: 'accessibility-outline' },
  { key: 'WHEELCHAIR_SPACE', label: 'Possui espaço para cadeira de rodas', icon: 'cube-outline' },
  { key: 'ACCESSIBLE_BOARDING_EQUIPMENT', label: 'Possui equipamento de embarque acessível', icon: 'construct-outline' },
  { key: 'TRANSPORTS_STUDENTS_WITH_DISABILITY', label: 'Transporta alunos com deficiência', icon: 'people-outline' },
];

const CHARACTERISTIC_LABELS = Object.fromEntries(VEHICLE_CHARACTERISTICS.map((o) => [o.key, o]));
const ACCESSIBILITY_LABELS = Object.fromEntries(VEHICLE_ACCESSIBILITY_FEATURES.map((o) => [o.key, o]));

export function characteristicOption(key: string): CharacteristicOption | undefined {
  return CHARACTERISTIC_LABELS[key];
}

/** Agrupa as chaves presentes por categoria, na ordem de prioridade (segurança, depois conforto). */
export function groupCharacteristics(keys: string[]): { category: VehicleCharacteristicCategory; options: CharacteristicOption[] }[] {
  const order: VehicleCharacteristicCategory[] = ['safety', 'comfort'];
  return order
    .map((category) => ({
      category,
      options: keys
        .map(characteristicOption)
        .filter((o): o is CharacteristicOption => !!o && o.category === category),
    }))
    .filter((group) => group.options.length > 0);
}

export function accessibilityOption(key: string): FeatureOption<VehicleAccessibilityFeature> | undefined {
  return ACCESSIBILITY_LABELS[key];
}
