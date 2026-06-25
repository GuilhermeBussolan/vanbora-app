import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { postMyLocation } from '@/api/tracking';

export type LocationPermission = 'undetermined' | 'granted' | 'denied';

export interface LocationBroadcastState {
  permission: LocationPermission;
  current: { latitude: number; longitude: number } | null;
  error: string | null;
}

/**
 * [Transportador] Pede permissão de localização, acompanha o GPS do aparelho e
 * envia a posição à API a cada poucos segundos enquanto `enabled` for true.
 */
export function useLocationBroadcast(token: string | null, enabled: boolean): LocationBroadcastState {
  const [permission, setPermission] = useState<LocationPermission>('undetermined');
  const [current, setCurrent] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastSentAt = useRef(0);

  useEffect(() => {
    if (!enabled || !token) return;
    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        setPermission('denied');
        setError('Permissão de localização negada.');
        return;
      }
      setPermission('granted');

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrent({ latitude, longitude });

          // Limita o envio à API a no máximo 1x a cada 4s.
          const now = Date.now();
          if (now - lastSentAt.current < 4000) return;
          lastSentAt.current = now;
          postMyLocation(token, latitude, longitude).catch((err) => {
            setError(err?.message ?? 'Falha ao enviar localização.');
          });
        },
      );
    })().catch((err) => {
      if (!cancelled) setError(err?.message ?? 'Erro ao acessar localização.');
    });

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled, token]);

  return { permission, current, error };
}
