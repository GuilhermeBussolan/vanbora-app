import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

export interface MapPoint {
  id: string | number;
  latitude: number;
  longitude: number;
  label?: string;
  /** Número da ordem na rota (mostrado dentro do marcador). */
  order?: number;
  kind?: 'pickup' | 'school' | 'inactive';
}

export interface LiveMarker {
  latitude: number;
  longitude: number;
  label?: string;
}

interface LeafletMapProps {
  /** Paradas a plotar. */
  points?: MapPoint[];
  /** Posição ao vivo (transportador). */
  live?: LiveMarker | null;
  /** Desenha a polilinha conectando os pontos na ordem informada. */
  drawPath?: boolean;
  height?: number;
  style?: ViewStyle;
  /** Mostra o botão de tela cheia (padrão: true). */
  expandable?: boolean;
}

interface Payload {
  points: MapPoint[];
  live: LiveMarker | null;
  drawPath: boolean;
}

/** HTML base do mapa (Leaflet + OSM via CDN). Os dados são injetados por JS. */
const HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #EFEFF2; }
    .pin { border-radius: 50%; width: 26px; height: 26px; display: flex; align-items: center;
      justify-content: center; color: #1A1A1A; font: 700 13px sans-serif; border: 2px solid #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,.3); }
    .pin-pickup { background: #F5C518; }
    .pin-inactive { background: #C9C9CF; color: #fff; }
    .pin-school { background: #111; color: #fff; }
    .pin-live { background: #2D7FF9; color: #fff; width: 30px; height: 30px; font-size: 16px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', { zoomControl: true, attributionControl: false })
      .setView([-23.55, -46.63], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

    var layer = L.layerGroup().addTo(map);

    function icon(cls, text) {
      return L.divIcon({ html: '<div class="pin ' + cls + '">' + (text || '') + '</div>',
        className: '', iconSize: [26, 26], iconAnchor: [13, 13] });
    }

    window.VanBora = {
      update: function (data) {
        layer.clearLayers();
        var bounds = [];
        var pathPts = [];
        (data.points || []).forEach(function (p) {
          if (p.latitude == null || p.longitude == null) return;
          var cls = p.kind === 'school' ? 'pin-school' : (p.kind === 'inactive' ? 'pin-inactive' : 'pin-pickup');
          var text = p.kind === 'school' ? '★' : (p.order != null ? String(p.order) : '');
          L.marker([p.latitude, p.longitude], { icon: icon(cls, text) })
            .bindPopup((p.order != null ? p.order + '. ' : '') + (p.label || ''))
            .addTo(layer);
          bounds.push([p.latitude, p.longitude]);
          if (data.drawPath && p.kind !== 'inactive') pathPts.push([p.latitude, p.longitude]);
        });
        if (data.drawPath && pathPts.length > 1) {
          L.polyline(pathPts, { color: '#E0B200', weight: 4, opacity: 0.85 }).addTo(layer);
        }
        if (data.live && data.live.latitude != null) {
          L.marker([data.live.latitude, data.live.longitude], { icon: icon('pin-live', '🚐') })
            .bindPopup(data.live.label || 'Transportador').addTo(layer);
          bounds.push([data.live.latitude, data.live.longitude]);
        }
        if (bounds.length === 1) {
          map.setView(bounds[0], 15);
        } else if (bounds.length > 1) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
        }
        setTimeout(function () { map.invalidateSize(); }, 100);
      }
    };

    if (window.__INITIAL__) { window.VanBora.update(window.__INITIAL__); }
    document.addEventListener('message', function (e) {
      try { window.VanBora.update(JSON.parse(e.data)); } catch (err) {}
    });
    window.addEventListener('message', function (e) {
      try { window.VanBora.update(JSON.parse(e.data)); } catch (err) {}
    });
  </script>
</body>
</html>`;

/** Canvas do mapa: WebView (nativo) ou iframe (web). Atualiza sem recarregar no nativo. */
function MapCanvas({ payload }: { payload: Payload }) {
  const { colors, styles } = useThemedScreen(createStyles);
  const webRef = useRef<WebView>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' || !loaded || !webRef.current) return;
    webRef.current.injectJavaScript(
      `window.VanBora && window.VanBora.update(${JSON.stringify(payload)}); true;`,
    );
  }, [payload, loaded]);

  if (Platform.OS === 'web') {
    const html = HTML.replace(
      '<script>\n    var map',
      `<script>window.__INITIAL__ = ${JSON.stringify(payload)};\n    var map`,
    );
    return React.createElement('iframe', {
      srcDoc: html,
      style: { height: '100%', width: '100%', border: 0, background: colors.mapBg },
    });
  }

  return (
    <WebView
      ref={webRef}
      originWhitelist={['*']}
      source={{ html: HTML }}
      onLoadEnd={() => setLoaded(true)}
      style={styles.web}
      javaScriptEnabled
      domStorageEnabled
      mixedContentMode="always"
    />
  );
}

/** Mapa interativo (Leaflet/OpenStreetMap) com opção de tela cheia. */
export function LeafletMap({
  points = [],
  live = null,
  drawPath = false,
  height = 240,
  style,
  expandable = true,
}: LeafletMapProps) {
  const { colors, typography, styles } = useThemedScreen(createStyles);
  const [fullscreen, setFullscreen] = useState(false);

  const payload: Payload = useMemo(() => ({ points, live, drawPath }), [points, live, drawPath]);

  return (
    <>
      <View style={[styles.container, { height }, style]}>
        {/* key força nova instância ao voltar da tela cheia, garantindo render correto */}
        <MapCanvas key={fullscreen ? 'hidden' : 'inline'} payload={payload} />
        {expandable ? (
          <Pressable
            style={styles.expandBtn}
            hitSlop={8}
            onPress={() => setFullscreen(true)}
            accessibilityLabel="Ampliar mapa"
          >
            <Ionicons name="expand-outline" size={18} color={colors.textPrimary} />
          </Pressable>
        ) : null}
      </View>

      <Modal
        visible={fullscreen}
        animationType="slide"
        onRequestClose={() => setFullscreen(false)}
        supportedOrientations={['portrait', 'landscape']}
      >
        <SafeAreaView style={styles.modalRoot} edges={['top', 'bottom']}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Mapa</Text>
            <Pressable
              style={styles.closeBtn}
              hitSlop={8}
              onPress={() => setFullscreen(false)}
              accessibilityLabel="Fechar mapa"
            >
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>
          <View style={styles.modalMap}>
            {fullscreen ? <MapCanvas key="fullscreen" payload={payload} /> : null}
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const createStyles = (colors: ThemeColors, typography: Typography) =>
  StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.mapBg,
  },
  web: {
    flex: 1,
    backgroundColor: colors.mapBg,
  },
  expandBtn: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  modalRoot: {
    flex: 1,
    backgroundColor: colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalMap: {
    flex: 1,
    backgroundColor: colors.mapBg,
  },
});
