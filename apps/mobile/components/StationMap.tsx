/**
 * StationMap — interactive transit map for the active metro mode.
 *
 * Provider strategy:
 * - iOS: Apple Maps (default provider). PROVIDER_GOOGLE must NOT be used on
 *   iOS without an embedded Google API key — the Google native components
 *   (AIRGoogleMap / AIRMapPolyline) aren't registered and the map renders
 *   blank or crashes.
 * - Android: PROVIDER_GOOGLE for NYC / Rest of the World.
 * - Shanghai (all platforms): AutoNavi (AMAP) raster tiles via UrlTile.
 *   Mainland China uses the GCJ-02 datum; WGS-84 GPS coordinates drift
 *   ~300–600m on WGS-84 basemaps, so station/route coordinates are shifted
 *   into GCJ-02 before rendering on the AMAP tiles.
 *
 * Also renders a Polyline per metro line in official colors, and centers on
 * the live GPS position on load (Pokémon GO style) with city-center fallback.
 */
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { TRANSIT_ROUTES, type City, type LatLng, type Station } from '@metro/shared';
import { CITY_REGIONS, colors, lineColor } from '../lib/theme';

/** AutoNavi / AMAP raster tile endpoint (GCJ-02 aligned, zh_cn labels). */
export const AMAP_TILE_URL =
  'https://wprd01.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=7';

/**
 * Minimalist Google map style — hides POIs, business icons, transit clutter
 * and road icons so metro polylines + station pins stay legible. Dark, muted
 * surfaces to match the app theme. (Ignored by the Apple basemap on iOS.)
 */
const CLEAN_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9a8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.attraction', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'administrative.country',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9e9e9e' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d4d4d4' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#2c3954' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#28334a' }],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [{ color: '#232c40' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#0e1626' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#161f33' }],
  },
];

// ── GCJ-02 ("Mars coordinates") shift — China-only ────────────────────────────

const GCJ_A = 6378245.0;
const GCJ_EE = 0.00669342162296594323;

function outOfChina(lat: number, lng: number): boolean {
  return lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271;
}

function transformLat(x: number, y: number): number {
  let ret =
    -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin((y / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret += ((160.0 * Math.sin((y / 12.0) * Math.PI) + 320 * Math.sin((y * Math.PI) / 30.0)) * 2.0) / 3.0;
  return ret;
}

function transformLng(x: number, y: number): number {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
  ret += ((20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0) / 3.0;
  ret += ((20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin((x / 3.0) * Math.PI)) * 2.0) / 3.0;
  ret += ((150.0 * Math.sin((x / 12.0) * Math.PI) + 300.0 * Math.sin((x / 30.0) * Math.PI)) * 2.0) / 3.0;
  return ret;
}

/** Convert WGS-84 → GCJ-02 so markers line up with AMAP tiles. */
export function wgs84ToGcj02(lat: number, lng: number): LatLng {
  if (outOfChina(lat, lng)) return { latitude: lat, longitude: lng };
  let dLat = transformLat(lng - 105.0, lat - 35.0);
  let dLng = transformLng(lng - 105.0, lat - 35.0);
  const radLat = (lat / 180.0) * Math.PI;
  let magic = Math.sin(radLat);
  magic = 1 - GCJ_EE * magic * magic;
  const sqrtMagic = Math.sqrt(magic);
  dLat = (dLat * 180.0) / (((GCJ_A * (1 - GCJ_EE)) / (magic * sqrtMagic)) * Math.PI);
  dLng = (dLng * 180.0) / ((GCJ_A / sqrtMagic) * Math.cos(radLat) * Math.PI);
  return { latitude: lat + dLat, longitude: lng + dLng };
}

interface StationMapProps {
  city: City;
  stations: Station[];
  checkIns: Record<string, string>;
}

export function StationMap({ city, stations, checkIns }: StationMapProps) {
  const mapRef = useRef<MapView>(null);
  const gpsCenteredRef = useRef(false);
  // Follow-me mode is on at launch; a manual city switch turns it off so the
  // camera doesn't snap back to the user while browsing other cities.
  const [followUser, setFollowUser] = useState(true);
  const firstCity = useRef(city);

  // Pokémon GO style: on first load, snap the camera to live GPS (with a
  // graceful fallback to the city center when GPS is off/denied).
  useEffect(() => {
    if (gpsCenteredRef.current) return;
    gpsCenteredRef.current = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const position = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('gps_timeout')), 8000)),
        ]);
        mapRef.current?.animateToRegion(
          {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            latitudeDelta: 0.06,
            longitudeDelta: 0.06,
          },
          700,
        );
      } catch {
        // GPS unavailable (underground / denied) — city center stays.
      }
    })();
  }, []);

  // City switcher changes always re-center on that city's core.
  useEffect(() => {
    if (!gpsCenteredRef.current || city === firstCity.current) return;
    setFollowUser(false);
    mapRef.current?.animateToRegion(CITY_REGIONS[city], 400);
  }, [city]);

  const cityStations = stations.filter((s) => s.city === city);
  const routes = TRANSIT_ROUTES[city] ?? [];
  const useAmapTiles = city === 'Shanghai';
  const shift = (c: LatLng): LatLng => (useAmapTiles ? wgs84ToGcj02(c.latitude, c.longitude) : c);

  // iOS: undefined → Apple Maps (Google provider needs an embedded API key).
  // Android: Google provider, except Shanghai which uses AMAP tile overlay.
  const provider =
    Platform.OS === 'android' && !useAmapTiles ? PROVIDER_GOOGLE : undefined;

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={CITY_REGIONS[city]}
      provider={provider}
      customMapStyle={CLEAN_MAP_STYLE}
      userInterfaceStyle="dark"
      showsUserLocation
      showsMyLocationButton
      followsUserLocation={followUser}
      showsCompass={false}
      toolbarEnabled={false}
    >
      {useAmapTiles && (
        <UrlTile
          urlTemplate={AMAP_TILE_URL}
          maximumZ={19}
          flipY={false}
          zIndex={-1}
          tileSize={256}
        />
      )}

      {routes.map((route) => (
        <Polyline
          key={`${city}-${route.line}`}
          coordinates={route.coordinates.map(shift)}
          strokeColor={route.color}
          strokeWidth={4}
          lineJoin="round"
          lineCap="round"
          zIndex={1}
        />
      ))}

      {cityStations.map((station) => (
        <Marker
          key={station.id}
          coordinate={shift({ latitude: station.latitude, longitude: station.longitude })}
          title={station.name}
          description={station.line_name}
          pinColor={checkIns[station.id] ? colors.green : lineColor(station.line_name)}
        />
      ))}
    </MapView>
  );
}
