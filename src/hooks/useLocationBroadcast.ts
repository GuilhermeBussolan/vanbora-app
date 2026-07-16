import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { postMyLocation } from '@/api/tracking';
import { LocationSharingDto } from '@/types';
import { isSharingActiveNow } from '@/lib/locationSchedule';

export type LocationPermission = 'undetermined' | 'granted' | 'denied';

export interface LocationBroadcastState {
  permission: LocationPermission;
  current: { latitude: number; longitude: number } | null;
  error: string | null;
  /** true enquanto está de fato compartilhando (interruptor ligado + dentro da janela). */
  active: boolean;
}

/**
 * [Transportador] Compartilha a posição do aparelho respeitando a configuração:
 * interruptor mestre + janelas agendadas. Reavalia a agenda a cada 30s (com o app
 * aberto) e envia a posição à API a cada poucos segundos enquanto estiver ativo.
 */
export function useLocationBroadcast(
  token: string | null,
  sharing: LocationSharingDto | null,
): LocationBroadcastState {
  const [permission, setPermission] = useState<LocationPermission>('undetermined');
  const [current, setCurrent] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const lastSentAt = useRef(0);

  // Reavalia "deve compartilhar agora?" imediatamente e a cada 30s (janelas da agenda).
  useEffect(() => {
    const evaluate = () => setActive(isSharingActiveNow(sharing));
    evaluate();
    const interval = setInterval(evaluate, 30000);
    return () => clearInterval(interval);
  }, [sharing]);

  useEffect(() => {
    if (!active || !token) {
      setCurrent(null);
      return;
    }
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
  }, [active, token]);

  return { permission, current, error, active };
}
