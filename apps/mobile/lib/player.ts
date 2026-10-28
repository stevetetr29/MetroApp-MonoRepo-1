/**
 * Offline-first player state: profile, XP, owned cards, task completions,
 * check-ins and feature flags — all persisted in AsyncStorage and synced
 * to Supabase on a best-effort basis when configured + authenticated.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  levelForXp,
  type Card,
  type City,
  type Station,
  type Task,
  type TaskCadence,
} from '@metro/shared';
import { SEED_CARDS, SEED_STATIONS, SEED_TASKS } from './data';
import { getSessionUserId, supabase } from './supabase';

const KEYS = {
  profile: 'metro:profile',
  ownedCards: 'metro:owned_cards',
  completions: 'metro:task_completions',
  checkIns: 'metro:check_ins',
  stepProgress: 'metro:step_progress',
  arNotify: 'metro:ar_notify',
  deviceId: 'metro:device_id',
} as const;

export interface LocalPlayer {
  username: string;
  primary_line: string;
  city: City;
  total_xp: number;
  level: number;
}

const DEFAULT_PLAYER: LocalPlayer = {
  username: 'rider_local',
  primary_line: '',
  city: 'NYC',
  total_xp: 0,
  level: 1,
};

// ── Profile ──────────────────────────────────────────────────────────────────

export async function loadPlayer(): Promise<LocalPlayer> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.profile);
    if (raw) return { ...DEFAULT_PLAYER, ...(JSON.parse(raw) as Partial<LocalPlayer>) };
  } catch {
    // fall through to default
  }
  return { ...DEFAULT_PLAYER };
}

export async function savePlayer(player: LocalPlayer): Promise<LocalPlayer> {
  const normalized = { ...player, level: levelForXp(player.total_xp) };
  await AsyncStorage.setItem(KEYS.profile, JSON.stringify(normalized)).catch(() => {});
  return normalized;
}

/**
 * Awards XP locally, then best-effort syncs to Supabase (profile XP +
 * faction line XP for Line Wars) when signed in.
 */
export async function awardXp(xp: number): Promise<LocalPlayer> {
  const player = await loadPlayer();
  const updated = await savePlayer({ ...player, total_xp: player.total_xp + xp });

  const userId = await getSessionUserId();
  if (supabase && userId) {
    try {
      await supabase.rpc('award_xp', { p_user_id: userId, p_xp: xp });
      if (player.primary_line) {
        await supabase.rpc('increment_line_xp', {
          p_city: player.city,
          p_line: player.primary_line,
          p_xp: xp,
        });
      }
    } catch {
      // offline — local XP already recorded, sync next session
    }
  }
  return updated;
}

// ── Card collection ──────────────────────────────────────────────────────────

export async function loadOwnedCardIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ownedCards);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function grantCards(cardIds: string[]): Promise<string[]> {
  const owned = await loadOwnedCardIds();
  const merged = Array.from(new Set([...owned, ...cardIds]));
  await AsyncStorage.setItem(KEYS.ownedCards, JSON.stringify(merged)).catch(() => {});

  const userId = await getSessionUserId();
  if (supabase && userId) {
    try {
      await supabase.from('user_cards').upsert(
        cardIds.map((card_id) => ({ user_id: userId, card_id, source: 'booster' })),
        { onConflict: 'user_id,card_id,source', ignoreDuplicates: true },
      );
    } catch {
      // offline — local grant already recorded
    }
  }
  return merged;
}

// ── Task completions (reset per cadence period) ──────────────────────────────

export function periodKey(cadence: TaskCadence, now: Date = new Date()): string {
  const iso = now.toISOString();
  if (cadence === 'daily') return iso.slice(0, 10);
  if (cadence === 'monthly') return iso.slice(0, 7);
  // ISO week
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

function completionKey(taskId: string, cadence: TaskCadence): string {
  return `${taskId}:${periodKey(cadence)}`;
}

export async function loadCompletions(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.completions);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export async function isTaskCompleted(taskId: string, cadence: TaskCadence): Promise<boolean> {
  const done = await loadCompletions();
  return done.includes(completionKey(taskId, cadence));
}

export async function markTaskCompleted(taskId: string, cadence: TaskCadence): Promise<void> {
  const done = await loadCompletions();
  const key = completionKey(taskId, cadence);
  if (!done.includes(key)) {
    await AsyncStorage.setItem(KEYS.completions, JSON.stringify([...done, key])).catch(() => {});
  }
}

// ── Step-counter task progress ───────────────────────────────────────────────

export async function loadStepProgress(taskId: string, cadence: TaskCadence): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.stepProgress);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    return map[completionKey(taskId, cadence)] ?? 0;
  } catch {
    return 0;
  }
}

export async function saveStepProgress(
  taskId: string,
  cadence: TaskCadence,
  steps: number,
): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.stepProgress);
    const map = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    map[completionKey(taskId, cadence)] = steps;
    await AsyncStorage.setItem(KEYS.stepProgress, JSON.stringify(map));
  } catch {
    // non-fatal
  }
}

// ── Check-ins ────────────────────────────────────────────────────────────────

export async function loadCheckIns(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(KEYS.checkIns);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export async function recordCheckIn(station: Station, method: 'gps' | 'manual'): Promise<void> {
  const existing = await loadCheckIns();
  existing[station.id] = new Date().toISOString();
  await AsyncStorage.setItem(KEYS.checkIns, JSON.stringify(existing)).catch(() => {});

  const userId = await getSessionUserId();
  if (supabase && userId) {
    try {
      await supabase
        .from('check_ins')
        .insert({ user_id: userId, station_id: station.id, method });
    } catch {
      // offline — cached locally
    }
  }
}

// ── AR scanner notify flag ───────────────────────────────────────────────────

export async function loadArNotify(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEYS.arNotify)) === '1';
  } catch {
    return false;
  }
}

export async function saveArNotify(optedIn: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.arNotify, optedIn ? '1' : '0').catch(() => {});
  const userId = await getSessionUserId();
  if (supabase) {
    try {
      await supabase
        .from('ar_scanner_interest')
        .insert({ user_id: userId, opted_in: optedIn });
    } catch {
      // telemetry is best-effort
    }
  }
}

// ── Remote data loaders with seed fallback ───────────────────────────────────

export async function fetchStations(): Promise<Station[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('stations').select('*');
      if (!error && data && data.length > 0) return data as Station[];
    } catch {
      // fall through
    }
  }
  return SEED_STATIONS;
}

export async function fetchTasks(): Promise<Task[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('tasks').select('*').eq('is_active', true);
      if (!error && data && data.length > 0) {
        return (data as Record<string, unknown>[]).map((row) => ({
          ...(row as unknown as Task),
          trivia_options: Array.isArray(row.trivia_options)
            ? (row.trivia_options as string[])
            : undefined,
        }));
      }
    } catch {
      // fall through
    }
  }
  return SEED_TASKS;
}

export async function fetchCards(): Promise<Card[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('cards').select('*');
      if (!error && data && data.length > 0) return data as Card[];
    } catch {
      // fall through
    }
  }
  return SEED_CARDS;
}
