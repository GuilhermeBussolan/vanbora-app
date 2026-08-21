import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { radius, spacing, useThemedScreen } from '@/theme';
import type { ThemeColors, Typography } from '@/theme';

export interface MapPoint {
  id: string | number;
  latitude: number;
  longitude: number;
  label?: string;
  /** Número da ordem de embarque ativa hoje (mostrado dentro do marcador). */
  order?: number;
  /** 'my-pickup' = ponto de embarque do próprio dependente (visão do responsável). */
  kind?: 'pickup' | 'my-pickup' | 'school' | 'inactive';
}

export interface LiveMarker {
  latitude: number;
  longitude: number;
  label?: string;
  /** Direção do deslocamento em graus (0-360); marcador gira quando disponível. */
  heading?: number | null;
}

interface VanboraMapProps {
  /** Paradas a plotar (casas dos alunos + escola). */
  points?: MapPoint[];
  /** Posição ao vivo da van. */
  live?: LiveMarker | null;
  /** Desenha o trajeto da rota. */
  drawPath?: boolean;
  /**
   * Trajeto real seguindo ruas (lista de [latitude, longitude], vinda do backend). Ausente
   * ou vazio ⇒ desenha uma linha reta conectando os pontos ativos, na ordem recebida.
   */
  routeGeometry?: [number, number][] | null;
  height?: number;
  style?: ViewStyle;
  /** Mostra o botão de tela cheia (padrão: true). */
  expandable?: boolean;
}

interface Payload {
  points: MapPoint[];
  live: LiveMarker | null;
  drawPath: boolean;
  routeGeometry: [number, number][] | null;
}

/**
 * HTML base do mapa: MapLibre GL JS + tiles vetoriais do OpenFreeMap (gratuito, sem
 * chave, sem limite) com um estilo próprio minimalista (sem POIs, ruas discretas) —
 * pensado para transporte escolar, não para navegação genérica cheia de informação.
 * Os dados são injetados via `window.VanBora.update(...)`.
 */
const HTML = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" />
  <script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
  <style>
    html, body, #map { height: 100%; margin: 0; padding: 0; background: #EFEFF2; }
    .maplibregl-ctrl-attrib { font-size: 9px; }
    .pin {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 50%;
      color: #1A1A1A; font: 700 13px -apple-system, sans-serif;
      border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.3);
      background: #F5C518;
    }
    .pin-mine { background: #F5C518; box-shadow: 0 0 0 3px rgba(245,197,24,.35), 0 1px 4px rgba(0,0,0,.3); }
    .pin-inactive {
      width: 22px; height: 22px; background: transparent; color: transparent;
      border: 2px dashed #B9B9C0; box-shadow: none;
    }
    .van-badge {
      width: 34px; height: 34px; filter: drop-shadow(0 2px 4px rgba(0,0,0,.35));
    }
    .school-badge { width: 30px; height: 38px; filter: drop-shadow(0 2px 3px rgba(0,0,0,.3)); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var STYLE = {
      version: 8,
      sources: {
        ofm: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' }
      },
      glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
      layers: [
        { id: 'bg', type: 'background', paint: { 'background-color': '#EFEFF2' } },
        { id: 'water', type: 'fill', source: 'ofm', 'source-layer': 'water',
          paint: { 'fill-color': '#DCE3EA' } },
        { id: 'road-minor', type: 'line', source: 'ofm', 'source-layer': 'transportation',
          filter: ['match', ['get', 'class'], ['minor', 'service', 'path', 'track'], true, false],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#D6D6DC',
            'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.5, 18, 2.5] } },
        { id: 'road-major', type: 'line', source: 'ofm', 'source-layer': 'transportation',
          filter: ['match', ['get', 'class'],
            ['motorway', 'trunk', 'primary', 'secondary', 'tertiary'], true, false],
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#C7C7CE',
            'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 18, 5] } },
        { id: 'road-label', type: 'symbol', source: 'ofm', 'source-layer': 'transportation_name',
          minzoom: 14,
          layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'],
            'text-size': 10, 'symbol-placement': 'line' },
          paint: { 'text-color': '#9C9CA6', 'text-halo-color': '#EFEFF2', 'text-halo-width': 1.2 } },
        { id: 'place-label', type: 'symbol', source: 'ofm', 'source-layer': 'place',
          filter: ['match', ['get', 'class'],
            ['city', 'town', 'village', 'suburb', 'neighbourhood'], true, false],
          layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'],
            'text-size': ['interpolate', ['linear'], ['zoom'], 8, 10, 14, 13] },
          paint: { 'text-color': '#A8A8B2', 'text-halo-color': '#EFEFF2', 'text-halo-width': 1.4 } }
      ]
    };

    var map = new maplibregl.Map({
      container: 'map',
      style: STYLE,
      center: [-46.63, -23.55],
      zoom: 12,
      attributionControl: false,
    });
    map.addControl(new maplibregl.AttributionControl({ compact: true, customAttribution: '© OpenStreetMap' }));

    var mapReady = false;
    var pendingUpdate = null;
    var pointMarkers = [];
    var vanMarker = null;
    var followMode = true;
    var hasFittedOnce = false;
    var lastLive = null;

    function svgVan() {
      // Kombi/van vista de cima: carroceria quadrada (não um carro comum), para-brisa,
      // retrovisores salientes e faixa de janelas laterais — silhueta reconhecível como
      // van escolar, não um carro genérico. Aponta pra cima (heading 0); gira com o GPS.
      // Cores invertidas: fundo preto, van amarela, faixas brancas.
      var el = document.createElement('div');
      el.innerHTML = '<svg class="van-badge" viewBox="0 0 34 34" xmlns="http://www.w3.org/2000/svg">' +
        '<circle cx="17" cy="17" r="16" fill="#1A1A1A" stroke="#fff" stroke-width="2"/>' +
        '<g transform="translate(17,17)">' +
        '<rect x="-6.5" y="-9.5" width="13" height="19" rx="2.5" fill="#F5C518"/>' +
        '<rect x="-5" y="-8.5" width="10" height="3.4" rx="1" fill="#FFFFFF"/>' +
        '<rect x="-8" y="-6.6" width="1.8" height="2.2" rx="0.5" fill="#1A1A1A"/>' +
        '<rect x="6.2" y="-6.6" width="1.8" height="2.2" rx="0.5" fill="#1A1A1A"/>' +
        '<rect x="-5.5" y="-2.6" width="11" height="2.1" fill="#FFFFFF"/>' +
        '<circle cx="-4" cy="7.6" r="1" fill="#1A1A1A"/>' +
        '<circle cx="4" cy="7.6" r="1" fill="#1A1A1A"/>' +
        '</g></svg>';
      return el.firstChild;
    }

    function svgSchool() {
      var el = document.createElement('div');
      el.innerHTML = '<svg class="school-badge" viewBox="0 0 30 38" xmlns="http://www.w3.org/2000/svg">' +
        '<path d="M15 0C6.7 0 0 6.7 0 15c0 10 15 23 15 23s15-13 15-23C30 6.7 23.3 0 15 0z" fill="#1A1A1A"/>' +
        '<g transform="translate(15,14)" fill="#F5C518">' +
        '<polygon points="-7,-1 0,-8 7,-1"/>' +
        '<rect x="-6" y="-1" width="12" height="8"/>' +
        '<rect x="-1.6" y="2" width="3.2" height="5" fill="#1A1A1A"/>' +
        '</g></svg>';
      return el.firstChild;
    }

    function pointEl(p) {
      if (p.kind === 'school') return svgSchool();
      var div = document.createElement('div');
      if (p.kind === 'inactive') {
        div.className = 'pin pin-inactive';
        return div;
      }
      div.className = 'pin' + (p.kind === 'my-pickup' ? ' pin-mine' : '');
      div.textContent = p.order != null ? String(p.order) : '';
      return div;
    }

    /** Reduz sobreposição: pontos muito próximos na tela ganham um pequeno deslocamento
     *  visual (offset de pixel), sem mudar a coordenada real do marcador. */
    function separateOverlaps() {
      var THRESHOLD = 26;
      var placed = [];
      pointMarkers.forEach(function (m) {
        m.setOffset([0, 0]);
        var p = map.project(m.getLngLat());
        var dx = 0, dy = 0;
        placed.forEach(function (o) {
          var ddx = p.x - o.x, ddy = p.y - o.y;
          var dist = Math.sqrt(ddx * ddx + ddy * ddy) || 0.001;
          if (dist < THRESHOLD) {
            dx += (ddx / dist) * (THRESHOLD - dist);
            dy += (ddy / dist) * (THRESHOLD - dist);
          }
        });
        if (dx !== 0 || dy !== 0) m.setOffset([dx, dy]);
        placed.push({ x: p.x + dx, y: p.y + dy });
      });
    }

    function applyUpdate(data) {
      pointMarkers.forEach(function (m) { m.remove(); });
      pointMarkers = [];
      var bounds = new maplibregl.LngLatBounds();
      var hasBounds = false;

      (data.points || []).forEach(function (p) {
        if (p.latitude == null || p.longitude == null) return;
        var marker = new maplibregl.Marker({ element: pointEl(p), anchor: 'center' })
          .setLngLat([p.longitude, p.latitude])
          .addTo(map);
        pointMarkers.push(marker);
        bounds.extend([p.longitude, p.latitude]);
        hasBounds = true;
      });

      lastLive = data.live && data.live.latitude != null ? data.live : null;
      if (lastLive) {
        var lngLat = [lastLive.longitude, lastLive.latitude];
        if (!vanMarker) {
          vanMarker = new maplibregl.Marker({ element: svgVan(), anchor: 'center', rotationAlignment: 'map' })
            .setLngLat(lngLat)
            .addTo(map);
        } else {
          vanMarker.setLngLat(lngLat);
        }
        if (lastLive.heading != null) vanMarker.setRotation(lastLive.heading);
        bounds.extend(lngLat);
        hasBounds = true;
      } else if (vanMarker) {
        vanMarker.remove();
        vanMarker = null;
      }

      var lineCoords = [];
      if (data.drawPath) {
        if (data.routeGeometry && data.routeGeometry.length > 1) {
          lineCoords = data.routeGeometry.map(function (p) { return [p[1], p[0]]; });
        } else {
          (data.points || []).forEach(function (p) {
            if (p.latitude != null && p.longitude != null && p.kind !== 'inactive') {
              lineCoords.push([p.longitude, p.latitude]);
            }
          });
        }
      }
      var routeSource = map.getSource('route');
      if (routeSource) {
        routeSource.setData({
          type: 'Feature', properties: {},
          geometry: { type: 'LineString', coordinates: lineCoords },
        });
      }

      if (!hasFittedOnce && hasBounds) {
        hasFittedOnce = true;
        var total = pointMarkers.length + (vanMarker ? 1 : 0);
        if (total <= 1) {
          map.jumpTo({ center: bounds.getCenter(), zoom: 15 });
        } else {
          map.fitBounds(bounds, { padding: 56, maxZoom: 16, duration: 0 });
        }
      } else if (followMode && lastLive) {
        map.easeTo({ center: [lastLive.longitude, lastLive.latitude], duration: 800 });
      }

      setTimeout(function () { map.resize(); separateOverlaps(); }, 60);
    }

    function addRouteLayer() {
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [] } },
      });
      map.addLayer({
        id: 'route-line', type: 'line', source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#E0B200', 'line-width': 5, 'line-opacity': 0.9 },
      });
    }

    map.on('load', function () {
      addRouteLayer();
      mapReady = true;
      if (pendingUpdate) { applyUpdate(pendingUpdate); pendingUpdate = null; }
    });
    map.on('moveend', separateOverlaps);
    map.on('movestart', function (e) {
      if (e.originalEvent) {
        followMode = false;
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'follow_lost' }));
        }
      }
    });

    window.VanBora = {
      update: function (data) {
        if (!mapReady) { pendingUpdate = data; return; }
        applyUpdate(data);
      },
      recenter: function () {
        followMode = true;
        if (lastLive) {
          map.easeTo({ center: [lastLive.longitude, lastLive.latitude], duration: 800 });
        } else {
          map.easeTo({ zoom: Math.max(map.getZoom(), 14) });
        }
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
function MapCanvas({
  payload,
  onFollowLost,
  webRef,
}: {
  payload: Payload;
  onFollowLost: () => void;
  webRef: React.RefObject<WebView | null>;
}) {
  const { colors, styles } = useThemedScreen(createStyles);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' || !loaded || !webRef.current) return;
    webRef.current.injectJavaScript(
      `window.VanBora && window.VanBora.update(${JSON.stringify(payload)}); true;`,
    );
  }, [payload, loaded, webRef]);

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg?.type === 'follow_lost') onFollowLost();
    } catch {
      /* ignora mensagens que não são do bridge */
    }
  }

  if (Platform.OS === 'web') {
    const html = HTML.replace(
      '<script>\n    var STYLE',
      `<script>window.__INITIAL__ = ${JSON.stringify(payload)};\n    var STYLE`,
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
      onMessage={handleMessage}
      style={styles.web}
      javaScriptEnabled
      domStorageEnabled
      mixedContentMode="always"
    />
  );
}

/** Mapa "estilo Uber" para transporte escolar: van, rota e paradas, sem poluição visual. */
export function VanboraMap({
  points = [],
  live = null,
  drawPath = false,
  routeGeometry = null,
  height = 240,
  style,
  expandable = true,
}: VanboraMapProps) {
  const { colors, styles } = useThemedScreen(createStyles);
  const insets = useSafeAreaInsets();
  const [fullscreen, setFullscreen] = useState(false);
  const [showRecenter, setShowRecenter] = useState(false);
  const webRef = useRef<WebView>(null);
  const fullscreenWebRef = useRef<WebView>(null);

  const payload: Payload = useMemo(
    () => ({ points, live, drawPath, routeGeometry: routeGeometry ?? null }),
    [points, live, drawPath, routeGeometry],
  );

  function recenter(ref: React.RefObject<WebView | null>) {
    setShowRecenter(false);
    ref.current?.injectJavaScript('window.VanBora && window.VanBora.recenter(); true;');
  }

  return (
    <>
      <View style={[styles.container, { height }, style]}>
        {/* key força nova instância ao voltar da tela cheia, garantindo render correto */}
        <MapCanvas
          key={fullscreen ? 'hidden' : 'inline'}
          payload={payload}
          webRef={webRef}
          onFollowLost={() => setShowRecenter(true)}
        />
        {showRecenter ? (
          <Pressable
            style={styles.recenterBtn}
            hitSlop={8}
            onPress={() => recenter(webRef)}
            accessibilityLabel="Centralizar na van"
          >
            <Ionicons name="locate" size={18} color={colors.brandDark} />
          </Pressable>
        ) : null}
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
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setFullscreen(false)}
        supportedOrientations={['portrait', 'landscape']}
      >
        <View style={styles.modalRoot}>
          <View style={styles.modalMap}>
            {fullscreen ? (
              <MapCanvas
                key="fullscreen"
                payload={payload}
                webRef={fullscreenWebRef}
                onFollowLost={() => setShowRecenter(true)}
              />
            ) : null}
          </View>
          {/* Barra renderizada DEPOIS do WebView e com zIndex/elevation altos:
              garante que o "X" fique acima do mapa e receba o toque no iOS. */}
          <View style={[styles.modalBar, { paddingTop: insets.top + spacing.sm }]}>
            <Text style={styles.modalTitle}>Mapa</Text>
            <Pressable
              style={styles.closeBtn}
              hitSlop={12}
              onPress={() => setFullscreen(false)}
              accessibilityLabel="Fechar mapa"
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
          </View>
        </View>
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
    width: 44,
    height: 44,
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
  recenterBtn: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    width: 44,
    height: 44,
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
  modalBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    // Fica acima do WebView (iOS: zIndex; Android: elevation).
    zIndex: 30,
    elevation: 30,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  modalMap: {
    flex: 1,
    backgroundColor: colors.mapBg,
  },
});
