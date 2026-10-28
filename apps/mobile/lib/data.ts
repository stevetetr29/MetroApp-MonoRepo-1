/**
 * Local seed data — the offline-first fallback used whenever Supabase is
 * unreachable or unconfigured (e.g. underground with no signal).
 * Mirrors supabase/migrations seed rows.
 */
import type {
  Card,
  City,
  LeaderboardEntry,
  Station,
  Task,
} from '@metro/shared';

export const SEED_STATIONS: Station[] = [
  { id: 'st-nyc-union', name: 'Union Square', city: 'NYC', line_name: 'L / 4 / 5 / 6', latitude: 40.7359, longitude: -73.9911 },
  { id: 'st-nyc-bedford', name: 'Bedford Ave', city: 'NYC', line_name: 'L', latitude: 40.7173, longitude: -73.9569 },
  { id: 'st-nyc-grand-central', name: 'Grand Central', city: 'NYC', line_name: '4 / 5 / 6 / 7', latitude: 40.7527, longitude: -73.9772 },
  { id: 'st-nyc-times', name: 'Times Square', city: 'NYC', line_name: '1 / 2 / 3 / N / Q / R / W', latitude: 40.7553, longitude: -73.9877 },
  { id: 'st-nyc-fulton', name: 'Fulton Center', city: 'NYC', line_name: '2 / 3 / 4 / 5 / A / C / J / Z', latitude: 40.7102, longitude: -74.0076 },
  { id: 'st-nyc-atlantic', name: 'Atlantic Ave–Barclays', city: 'NYC', line_name: '2 / 3 / 4 / 5 / B / Q', latitude: 40.6844, longitude: -73.9777 },
  { id: 'st-nyc-jackson', name: 'Jackson Hts–Roosevelt', city: 'NYC', line_name: 'E / F / M / R / 7', latitude: 40.7466, longitude: -73.8913 },
  { id: 'st-sh-people', name: "People's Square", city: 'Shanghai', line_name: 'Line 1 / 2 / 8', latitude: 31.2335, longitude: 121.469 },
  { id: 'st-sh-lujiazui', name: 'Lujiazui', city: 'Shanghai', line_name: 'Line 2 / 14', latitude: 31.2386, longitude: 121.5014 },
  { id: 'st-sh-xujiahui', name: 'Xujiahui', city: 'Shanghai', line_name: 'Line 1 / 9 / 11', latitude: 31.194, longitude: 121.4374 },
  { id: 'st-sh-jingan', name: "Jing'an Temple", city: 'Shanghai', line_name: 'Line 2 / 7 / 14', latitude: 31.2234, longitude: 121.4453 },
  { id: 'st-sh-century', name: 'Century Avenue', city: 'Shanghai', line_name: 'Line 2 / 4 / 6 / 9', latitude: 31.2337, longitude: 121.5264 },
  { id: 'st-gn-central', name: 'Central Station', city: 'Generic', line_name: 'Line A', latitude: 40.0, longitude: -74.0 },
  { id: 'st-gn-riverside', name: 'Riverside', city: 'Generic', line_name: 'Line A', latitude: 40.005, longitude: -74.01 },
  { id: 'st-gn-oldtown', name: 'Old Town', city: 'Generic', line_name: 'Line B', latitude: 39.995, longitude: -73.99 },
  { id: 'st-gn-university', name: 'University', city: 'Generic', line_name: 'Line B', latitude: 40.008, longitude: -73.995 },
  { id: 'st-gn-harbor', name: 'Harbor Point', city: 'Generic', line_name: 'Line C', latitude: 39.99, longitude: -74.005 },
];

export const SEED_TASKS: Task[] = [
  {
    id: 'tk-photo-sign',
    title: 'Platform Portrait',
    description: 'Snap a photo of any station name sign on the platform.',
    task_type: 'photo_ai',
    ai_prompt_criteria:
      'A photo clearly showing a subway/metro station name sign or platform signage.',
    points: 150,
    cadence: 'daily',
    city: 'NYC',
    is_rush_hour_only: false,
  },
  {
    id: 'tk-photo-ticket',
    title: 'Ticket to Ride',
    description: 'Photograph a valid metro ticket, metro card, or QR turnstile.',
    task_type: 'photo_ai',
    ai_prompt_criteria:
      'A photo showing a transit ticket, metro card, or station turnstile/QR gate.',
    points: 150,
    cadence: 'daily',
    city: 'Shanghai',
    is_rush_hour_only: false,
  },
  {
    id: 'tk-photo-train',
    title: 'Train Spotting',
    description: 'Capture a photo of a train arriving at or leaving the platform.',
    task_type: 'photo_ai',
    ai_prompt_criteria: 'A photo showing a subway or metro train at a station platform.',
    points: 250,
    cadence: 'weekly',
    city: 'NYC',
    is_rush_hour_only: false,
  },
  {
    id: 'tk-photo-map',
    title: 'Map Master',
    description: 'Photograph the official system map inside a train or station.',
    task_type: 'photo_ai',
    ai_prompt_criteria:
      'A photo showing an official subway/metro system map poster or display.',
    points: 200,
    cadence: 'weekly',
    city: 'Generic',
    is_rush_hour_only: false,
  },
  {
    id: 'tk-photo-mosaic',
    title: 'Transit Historian',
    description: 'Photograph an old or decorative tile mosaic inside a station.',
    task_type: 'photo_ai',
    ai_prompt_criteria:
      'A photo showing decorative tilework, mosaic, or art inside a metro station.',
    points: 500,
    cadence: 'monthly',
    city: 'NYC',
    is_rush_hour_only: false,
  },
  {
    id: 'tk-trivia-nyc',
    title: 'Rush Quiz: Lines',
    description: 'Which NYC trunk line does the A train run on?',
    task_type: 'trivia',
    points: 100,
    cadence: 'daily',
    city: 'NYC',
    is_rush_hour_only: true,
    trivia_options: [
      '8th Avenue Express',
      'Lexington Avenue Local',
      'Broadway Express',
      'Flushing Local',
    ],
    trivia_answer_idx: 0,
  },
  {
    id: 'tk-trivia-sh',
    title: 'Rush Quiz: Shanghai',
    description: 'Which Shanghai line serves Lujiazui (Oriental Pearl Tower)?',
    task_type: 'trivia',
    points: 100,
    cadence: 'daily',
    city: 'Shanghai',
    is_rush_hour_only: true,
    trivia_options: ['Line 1', 'Line 2', 'Line 11', 'Line 16'],
    trivia_answer_idx: 1,
  },
  {
    id: 'tk-trivia-world',
    title: 'Rush Quiz: Records',
    description: "Which system is the world's busiest by annual ridership?",
    task_type: 'trivia',
    points: 100,
    cadence: 'daily',
    city: 'Generic',
    is_rush_hour_only: true,
    trivia_options: ['NYC Subway', 'London Underground', 'Shanghai Metro', 'Tokyo Metro'],
    trivia_answer_idx: 2,
  },
  {
    id: 'tk-steps-stairs',
    title: 'Stair Climber',
    description: 'Take the stairs, not the escalator — log 200 steps between platforms.',
    task_type: 'step_count',
    points: 100,
    cadence: 'daily',
    city: 'Generic',
    is_rush_hour_only: true,
    step_goal: 200,
  },
  {
    id: 'tk-steps-marathon',
    title: 'Marathon Commuter',
    description: 'Log 1,000 steps underground this week.',
    task_type: 'step_count',
    points: 300,
    cadence: 'weekly',
    city: 'Generic',
    is_rush_hour_only: false,
    step_goal: 1000,
  },
];

export const SEED_CARDS: Card[] = [
  { id: 'cd-rookie', name: 'Metro Rookie', artwork_url: '', rarity: 'Common', attack: 12, defense: 8, description: 'Every journey begins with a single swipe.' },
  { id: 'cd-turnstile', name: 'Turnstile Guard', artwork_url: '', rarity: 'Common', attack: 10, defense: 15, description: 'Holds the line at the fare gates.' },
  { id: 'cd-signal', name: 'Signal Keeper', artwork_url: '', rarity: 'Common', attack: 14, defense: 12, description: 'Keeps the lights green down the tunnel.' },
  { id: 'cd-phantom', name: 'Express Phantom', artwork_url: '', rarity: 'Rare', attack: 28, defense: 18, description: 'Skips every local stop. Catches nobody.' },
  { id: 'cd-owl', name: 'Night Owl Conductor', artwork_url: '', rarity: 'Rare', attack: 24, defense: 26, description: 'Commands the last train out of Brooklyn.' },
  { id: 'cd-titan', name: 'Rush Hour Titan', artwork_url: '', rarity: 'Epic', attack: 42, defense: 35, description: 'Thrives when the platform overflows.' },
  { id: 'cd-wraith', name: 'Ghost Line Wraith', artwork_url: '', rarity: 'Epic', attack: 38, defense: 44, description: 'Haunts abandoned stations of the IND.' },
  { id: 'cd-dragon', name: 'Grand Central Dragon', artwork_url: '', rarity: 'Legendary', attack: 65, defense: 58, description: 'Sleeps beneath the celestial ceiling.' },
  { id: 'cd-maglev', name: 'The Maglev Empress', artwork_url: '', rarity: 'Legendary', attack: 70, defense: 50, description: "Shanghai's 430 km/h sovereign of steel." },
];

/** Faction lines competing in Line Wars, per city. */
export const FACTIONS: Record<City, string[]> = {
  NYC: ['L Train', '4/5/6 Express', 'A/C/E'],
  Shanghai: ['Line 1', 'Line 2', 'Line 11'],
  Generic: ['Line A', 'Line B', 'Line C'],
};

/** Offline baseline weekly XP per faction (player XP is added on top). */
export const FACTION_BASE_XP: Record<string, number> = {
  'L Train': 12450,
  '4/5/6 Express': 15820,
  'A/C/E': 9310,
  'Line 1': 18400,
  'Line 2': 20150,
  'Line 11': 7680,
  'Line A': 4200,
  'Line B': 5150,
  'Line C': 3890,
};

export const SEED_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 0, user_id: 'u-ana', username: 'anatransit', primary_line: '4/5/6 Express', total_xp: 14820, level: 15 },
  { rank: 0, user_id: 'u-bo', username: 'bojack_line2', primary_line: 'Line 2', total_xp: 12440, level: 13 },
  { rank: 0, user_id: 'u-cleo', username: 'cleo_rides_L', primary_line: 'L Train', total_xp: 10210, level: 11 },
  { rank: 0, user_id: 'u-dev', username: 'devgansu', primary_line: 'Line 1', total_xp: 8430, level: 9 },
  { rank: 0, user_id: 'u-eli', username: 'eli_local', primary_line: 'A/C/E', total_xp: 6980, level: 7 },
  { rank: 0, user_id: 'u-faye', username: 'faye_falcon', primary_line: '4/5/6 Express', total_xp: 5340, level: 6 },
  { rank: 0, user_id: 'u-gus', username: 'gus_underground', primary_line: 'L Train', total_xp: 4120, level: 5 },
  { rank: 0, user_id: 'u-hana', username: 'hana_xujiahui', primary_line: 'Line 11', total_xp: 2870, level: 3 },
];

/** Draws `count` cards weighted by rarity — the booster pack reward. */
export function drawBoosterPack(catalog: Card[], count = 3): Card[] {
  const weights: Record<Card['rarity'], number> = {
    Common: 60,
    Rare: 25,
    Epic: 12,
    Legendary: 3,
  };
  const draw = (): Card => {
    const roll = Math.random() * 100;
    let rarity: Card['rarity'] = 'Common';
    let acc = 0;
    for (const [r, w] of Object.entries(weights) as [Card['rarity'], number][]) {
      acc += w;
      if (roll < acc) {
        rarity = r;
        break;
      }
    }
    const pool = catalog.filter((c) => c.rarity === rarity);
    const source = pool.length > 0 ? pool : catalog;
    return source[Math.floor(Math.random() * source.length)];
  };
  const picked: Card[] = [];
  const seen = new Set<string>();
  while (picked.length < count && catalog.length > 0) {
    const card = draw();
    if (!seen.has(card.id) || catalog.length < count) {
      picked.push(card);
      seen.add(card.id);
    }
  }
  return picked;
}
