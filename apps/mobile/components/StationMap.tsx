/**
 * StationMap — interactive transit map for the active metro mode.
 *
 * - NYC / Rest of the World: Google basemap tiles (PROVIDER_GOOGLE).
 * - Shanghai: overlays AutoNavi (AMAP) raster tiles. China's GCJ-02 datum makes
 *   GPS coordinates drift ~300–600m on WGS-84 basemaps; AMAP tiles render in
 *   the correct frame and avoid the blank-map / offset-marker glitches.
 * - Renders colored Polyline overlays for each metro line (official colors).
 */
import { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT, PROVIDER_GOOGLE, UrlTile } from 'react-native-maps';
import type { City, Station } from '@metro/shared';
import { CITY_REGIONS, colors, lineColor } from '../lib/theme';
import { LINE_ROUTES } from '../lib/data';

/** AutoNavi / AMAP raster tile endpoint (GCJ-02 aligned, zh_cn labels). */
export const AMAP_TILE_URL =
  'https://wprd01.is.autonavi.com/appmaptile?x={x}&y={y}&z={z}&lang=zh_cn&size=1&scale=1&style=7';

interface StationMapProps {
  city: City;
  stations: Station[];
  checkIns: Record<string, string>;
}

export function StationMap({ city, stations, checkIns }: StationMapProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    mapRef.current?.animateToRegion(CITY_REGIONS[city], 400);
  }, [city]);

  const cityStations = stations.filter((s) => s.city === city);
  const routes = LINE_ROUTES[city] ?? [];
  const useAmapTiles = city === 'Shanghai';

  return (
    <MapView
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      initialRegion={CITY_REGIONS[city]}
      provider={useAmapTiles ? PROVIDER_DEFAULT : PROVIDER_GOOGLE}
      userInterfaceStyle="dark"
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
          coordinates={route.coordinates}
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
          coordinate={{ latitude: station.latitude, longitude: station.longitude }}
          title={station.name}
          description={station.line_name}
          pinColor={checkIns[station.id] ? colors.green : lineColor(station.line_name)}
        />
      ))}
    </MapView>
  );
}
