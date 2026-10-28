/**
 * @metro/shared — shared TypeScript contracts for the MetroApp monorepo.
 * Consumed by apps/mobile (Expo), apps/admin (Next.js) and mirrored by
 * the Supabase schema in supabase/migrations.
 */

// ── Enums / unions ────────────────────────────────────────────────────────────

export type City = 'NYC' | 'Shanghai' | 'Generic';
export const CITIES: readonly City[] = ['NYC', 'Shanghai', 'Generic'] as const;

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
  return Math.floor(totalXp / XP_PER_LEVEL) + 1;
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
