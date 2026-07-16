/**
 * Navegação turn-by-turn delegada ao app de mapas do aparelho (Google Maps / Maps),
 * que já entrega a experiência tipo Waze. Montamos a URL universal do Google Maps
 * com origem, paradas intermediárias (waypoints) e destino na ordem da rota.
 */
import { Linking } from 'react-native';
import { ApiRouteStop } from '@/types';

export interface LatLng {
  latitude: number;
  longitude: number;
}

const MAPS_DIR = 'https://www.google.com/maps/dir/?api=1';

function coord(lat: number, lon: number): string {
  return `${lat},${lon}`;
}

/**
 * Abre a rota completa no app de mapas: origem → paradas → escola (destino final).
 * `origin` é a posição atual do transportador; se ausente, parte da 1ª parada.
 */
export async function openRouteInMaps(
  stops: ApiRouteStop[],
  origin?: LatLng | null,
): Promise<boolean> {
  const geo = stops.filter(
    (s): s is ApiRouteStop & { latitude: number; longitude: number } =>
      s.latitude != null && s.longitude != null,
  );
  if (geo.length === 0) return false;

  const destination = geo[geo.length - 1];
  let originStr: string;
  let waypoints: typeof geo;
  if (origin) {
    originStr = coord(origin.latitude, origin.longitude);
    waypoints = geo.slice(0, geo.length - 1);
  } else {
    originStr = coord(geo[0].latitude, geo[0].longitude);
    waypoints = geo.slice(1, geo.length - 1);
  }

  const params = [
    `origin=${originStr}`,
    `destination=${coord(destination.latitude, destination.longitude)}`,
    'travelmode=driving',
  ];
  if (waypoints.length > 0) {
    const wp = waypoints.map((s) => coord(s.latitude, s.longitude)).join('|');
    params.push(`waypoints=${encodeURIComponent(wp)}`);
  }
  return open(`${MAPS_DIR}&${params.join('&')}`);
}

/** Abre a navegação até uma única parada. */
export async function openStopInMaps(stop: ApiRouteStop): Promise<boolean> {
  if (stop.latitude == null || stop.longitude == null) return false;
  return open(
    `${MAPS_DIR}&destination=${coord(stop.latitude, stop.longitude)}&travelmode=driving`,
  );
}

async function open(url: string): Promise<boolean> {
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
