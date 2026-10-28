import type { City } from '@metro/shared';

export const colors = {
  bg: '#0B1020',
  surface: '#151B30',
  surfaceAlt: '#1C2440',
  border: '#2A3354',
  text: '#F4F6FB',
  muted: '#8B93B0',
  accent: '#4F8CFF',
  green: '#34D399',
  gold: '#F59E0B',
  red: '#F87171',
  purple: '#A855F7',
};

/** Deterministic pin color per metro line name. */
const LINE_PALETTE = [
  '#4F8CFF',
  '#34D399',
  '#F59E0B',
  '#A855F7',
  '#F87171',
  '#22D3EE',
  '#F472B6',
  '#A3E635',
];

export function lineColor(lineName: string): string {
  let hash = 0;
  for (let i = 0; i < lineName.length; i += 1) {
    hash = (hash * 31 + lineName.charCodeAt(i)) | 0;
  }
  return LINE_PALETTE[Math.abs(hash) % LINE_PALETTE.length];
}

export const CITY_REGIONS: Record<
  City,
  { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }
> = {
  NYC: { latitude: 40.7359, longitude: -73.9911, latitudeDelta: 0.12, longitudeDelta: 0.12 },
  Shanghai: {
    latitude: 31.2304,
    longitude: 121.4737,
    latitudeDelta: 0.16,
    longitudeDelta: 0.16,
  },
  Generic: {
    latitude: 40.0,
    longitude: -74.0,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  },
};
