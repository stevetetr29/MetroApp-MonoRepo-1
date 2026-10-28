/**
 * @metro/shared — shared TypeScript contracts for the MetroApp monorepo.
 * Consumed by apps/mobile (Expo), apps/admin (Next.js) and mirrored by
 * the Supabase schema in supabase/migrations.
 */

// ── Enums / unions ────────────────────────────────────────────────────────────

export type City = 'NYC' | 'Shanghai' | 'Rest of the World';
export const CITIES: readonly City[] = ['NYC', 'Shanghai', 'Rest of the World'] as const;

/** Short labels for compact UI (tab pills, badges). */
export const CITY_SHORT: Record<City, string> = {
  NYC: 'NYC',
  Shanghai: 'Shanghai',
  'Rest of the World': 'World',
};

export type TaskType = 'photo_ai' | 'trivia' | 'step_count';
export type TaskCadence = 'daily' | 'weekly' | 'monthly';
export type CardRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';
export type CheckInMethod = 'gps' | 'manual';

// ── Database-mirrored entities ────────────────────────────────────────────────

export interface Station {
  id: string;
  name: string;
  city: City;
  line_name: string;
  latitude: number;
  longitude: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  task_type: TaskType;
  /** Prompt sent to Gemini to judge a photo submission. Required for photo_ai. */
  ai_prompt_criteria?: string;
  points: number;
  cadence: TaskCadence;
  city: string;
  is_rush_hour_only: boolean;
  /** For trivia tasks: 2–4 answer options. */
  trivia_options?: string[];
  /** For trivia tasks: index into trivia_options of the correct answer. */
  trivia_answer_idx?: number;
  /** For step_count tasks: number of steps required. */
  step_goal?: number;
}

export interface Card {
  id: string;
  name: string;
  artwork_url: string;
  rarity: CardRarity;
  attack: number;
  defense: number;
  description: string;
  /**
   * Name of the Character Champion this card belongs to. Champion cards have
   * `champion === name` and lead a collectible set shown together in the binder.
   */
  champion?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  primary_line: string;
  total_xp: number;
  level: number;
  city?: City;
  avatar_url?: string;
}

export interface PromoCode {
  id: string;
  /** 8-character single-use scratch code printed in physical card packs. */
  code: string;
  card_id: string;
  is_redeemed: boolean;
  redeemed_by?: string | null;
  redeemed_at?: string | null;
}

export interface UserCard {
  id: string;
  user_id: string;
  card_id: string;
  acquired_at: string;
  source: 'booster' | 'promo_code' | 'reward';
  card?: Card;
}

export interface CheckIn {
  id: string;
  user_id: string;
  station_id: string;
  checked_in_at: string;
  method: CheckInMethod;
}

// ── API / RPC contracts ───────────────────────────────────────────────────────

export interface VerifyTaskRequest {
  imageBase64: string;
  taskCriteria: string;
}

export interface VerifyTaskResponse {
  verified: boolean;
  /** 0.0 – 1.0 */
  confidence: number;
  reason: string;
}

export interface LineStanding {
  line_name: string;
  city: City;
  weekly_xp: number;
  rank: number;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  primary_line: string;
  total_xp: number;
  level: number;
  avatar_url?: string;
}

// ── Line Wars factions & events ───────────────────────────────────────────────

/** Every metro line a player can pledge to, per city. */
export const LINE_FACTIONS: Record<City, string[]> = {
  NYC: [
    '1', '2', '3', '4', '5', '6', '7',
    'A', 'C', 'E', 'B', 'D', 'F', 'M',
    'G', 'J', 'Z', 'L', 'N', 'Q', 'R', 'W', 'S',
  ],
  Shanghai: [
    'Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5', 'Line 6',
    'Line 7', 'Line 8', 'Line 9', 'Line 10', 'Line 11', 'Line 12',
    'Line 13', 'Line 14', 'Line 15', 'Line 16', 'Line 17', 'Line 18',
  ],
  'Rest of the World': ['Line A', 'Line B', 'Line C'],
};

/** Official line colors — MTA / Shanghai Metro palettes. */
export const LINE_COLORS: Record<string, string> = {
  // NYC MTA
  '1': '#EE352E', '2': '#EE352E', '3': '#EE352E',
  '4': '#00933C', '5': '#00933C', '6': '#00933C',
  '7': '#B933AD',
  'A': '#0039A6', 'C': '#0039A6', 'E': '#0039A6',
  'B': '#FF6319', 'D': '#FF6319', 'F': '#FF6319', 'M': '#FF6319',
  'G': '#6CBE45',
  'J': '#996633', 'Z': '#996633',
  'L': '#A7A9AC',
  'N': '#FCCC0A', 'Q': '#FCCC0A', 'R': '#FCCC0A', 'W': '#FCCC0A',
  'S': '#808183',
  // Shanghai Metro
  'Line 1': '#E4002B', 'Line 2': '#00A0E9', 'Line 3': '#F9D616',
  'Line 4': '#6B2D90', 'Line 5': '#B07CC6', 'Line 6': '#D4017D',
  'Line 7': '#F18A00', 'Line 8': '#009CDA', 'Line 9': '#8DC8E8',
  'Line 10': '#C1A7E2', 'Line 11': '#76232F', 'Line 12': '#00A03E',
  'Line 13': '#E877C4', 'Line 14': '#7C5830', 'Line 15': '#C4975F',
  'Line 16': '#3BB44A', 'Line 17': '#D8C6A0', 'Line 18': '#008D86',
  // Rest of the World
  'Line A': '#E11D48', 'Line B': '#3B82F6', 'Line C': '#22C55E',
};

export interface LineEvent {
  id: string;
  city: City;
  title: string;
  description: string;
  /** e.g. "2x XP", "+500 bonus" */
  bonus_label: string;
  /** Lines this event applies to — empty means all lines in the city. */
  lines: string[];
  ends_label: string;
}

export const LINE_EVENTS: LineEvent[] = [
  {
    id: 'ev-nyc-rush',
    city: 'NYC',
    title: 'Rush Hour Control Battle',
    description: 'Check in at Union Sq–14 St before 7 PM for double XP.',
    bonus_label: '2x XP',
    lines: ['L', 'N', 'Q', 'R', 'W', '4', '5', '6'],
    ends_label: 'Ends 7:00 PM',
  },
  {
    id: 'ev-nyc-phantom',
    city: 'NYC',
    title: 'Express Phantom Run',
    description: 'Complete any A/C/E station check-in after 9 PM.',
    bonus_label: '+300 XP',
    lines: ['A', 'C', 'E'],
    ends_label: 'Tonight',
  },
  {
    id: 'ev-nyc-crosstown',
    city: 'NYC',
    title: 'Crosstown Challenge',
    description: 'Ride the full L line — check in at both 8 Av and Bedford Av.',
    bonus_label: '+500 XP',
    lines: ['L'],
    ends_label: 'This week',
  },
  {
    id: 'ev-sh-maglev',
    city: 'Shanghai',
    title: 'Maglev Sprint',
    description: 'Photo-verify a Line 2 train between People’s Square and Longyang Rd.',
    bonus_label: '2x XP',
    lines: ['Line 2'],
    ends_label: 'Ends 9:00 PM',
  },
  {
    id: 'ev-sh-disney',
    city: 'Shanghai',
    title: 'Disney Dash',
    description: 'Check in at Disney Resort station for a bonus card drop.',
    bonus_label: 'Booster pack',
    lines: ['Line 11'],
    ends_label: 'This weekend',
  },
  {
    id: 'ev-row-wanderer',
    city: 'Rest of the World',
    title: 'Worldwide Wanderer',
    description: 'Check in at any 3 different stations this week.',
    bonus_label: '+400 XP',
    lines: [],
    ends_label: 'This week',
  },
];

// ── Shared game constants ─────────────────────────────────────────────────────

export const RARITY_COLORS: Record<CardRarity, string> = {
  Common: '#9CA3AF',
  Rare: '#3B82F6',
  Epic: '#A855F7',
  Legendary: '#F59E0B',
};

/** XP required per level — level N starts at N * XP_PER_LEVEL. */
export const XP_PER_LEVEL = 1000;

export function levelForXp(totalXp: number): number {
  return Math.floor(Math.max(0, totalXp) / XP_PER_LEVEL) + 1;
}

/** Rush-hour windows (local device time): 7–10 AM and 5–8 PM. */
export function isRushHour(date: Date = new Date()): boolean {
  const h = date.getHours();
  return (h >= 7 && h < 10) || (h >= 17 && h < 20);
}

/** Distance in meters between two lat/lng points (haversine). */
export function distanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
