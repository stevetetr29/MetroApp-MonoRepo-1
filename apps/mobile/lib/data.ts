/**
 * Local seed data — the offline-first fallback used whenever Supabase is
 * unreachable or unconfigured (e.g. underground with no signal).
 * Mirrors supabase/migrations seed rows.
 */
import {
  LINE_COLORS,
  LINE_FACTIONS,
  type Card,
  type City,
  type LeaderboardEntry,
  type Station,
  type Task,
} from '@metro/shared';

// ── Stations (mirror of supabase/migrations seeds) ────────────────────────────

export const SEED_STATIONS: Station[] = [
  // NYC MTA
  { id: 'st-nyc-times', name: 'Times Sq–42 St', city: 'NYC', line_name: '1/2/3/7/N/Q/R/W/S', latitude: 40.7553, longitude: -73.9877 },
  { id: 'st-nyc-gc', name: 'Grand Central–42 St', city: 'NYC', line_name: '4/5/6/7/S', latitude: 40.7527, longitude: -73.9772 },
  { id: 'st-nyc-union', name: 'Union Sq–14 St', city: 'NYC', line_name: 'L/N/Q/R/W/4/5/6', latitude: 40.7359, longitude: -73.9911 },
  { id: 'st-nyc-herald', name: 'Herald Sq–34 St', city: 'NYC', line_name: 'B/D/F/M/N/Q/R/W', latitude: 40.7497, longitude: -73.9879 },
  { id: 'st-nyc-penn123', name: '34 St–Penn Station', city: 'NYC', line_name: '1/2/3', latitude: 40.7504, longitude: -73.9912 },
  { id: 'st-nyc-pennace', name: '34 St–Penn Station', city: 'NYC', line_name: 'A/C/E', latitude: 40.7522, longitude: -73.9934 },
  { id: 'st-nyc-columbus', name: 'Columbus Circle–59 St', city: 'NYC', line_name: 'A/B/C/D/1', latitude: 40.7682, longitude: -73.9819 },
  { id: 'st-nyc-fulton', name: 'Fulton Center', city: 'NYC', line_name: '2/3/4/5/A/C/J/Z', latitude: 40.7102, longitude: -74.0076 },
  { id: 'st-nyc-atlantic', name: 'Atlantic Ave–Barclays', city: 'NYC', line_name: '2/3/4/5/B/D/N/Q/R', latitude: 40.6844, longitude: -73.9777 },
  { id: 'st-nyc-bedford', name: 'Bedford Ave', city: 'NYC', line_name: 'L', latitude: 40.7173, longitude: -73.9569 },
  { id: 'st-nyc-1av', name: '1 Av', city: 'NYC', line_name: 'L', latitude: 40.7309, longitude: -73.9816 },
  { id: 'st-nyc-3av', name: '3 Av', city: 'NYC', line_name: 'L', latitude: 40.7328, longitude: -73.9862 },
  { id: 'st-nyc-14s6', name: '14 St/6 Av', city: 'NYC', line_name: 'L/F/M/1/2/3', latitude: 40.7397, longitude: -74.0003 },
  { id: 'st-nyc-8av', name: '8 Av–14 St', city: 'NYC', line_name: 'L/A/C/E', latitude: 40.7403, longitude: -74.0023 },
  { id: 'st-nyc-w4', name: 'W 4 St–Wash Sq', city: 'NYC', line_name: 'A/B/C/D/E/F/M', latitude: 40.7323, longitude: -74.0007 },
  { id: 'st-nyc-jackson', name: 'Jackson Hts–Roosevelt', city: 'NYC', line_name: 'E/F/M/R/7', latitude: 40.7466, longitude: -73.8913 },
  { id: 'st-nyc-flushing', name: 'Flushing–Main St', city: 'NYC', line_name: '7', latitude: 40.7596, longitude: -73.83 },
  { id: 'st-nyc-hudson', name: 'Hudson Yards–34 St', city: 'NYC', line_name: '7', latitude: 40.7558, longitude: -74.0019 },
  { id: 'st-nyc-5av', name: '5 Av', city: 'NYC', line_name: '7', latitude: 40.7538, longitude: -73.981 },
  { id: 'st-nyc-72', name: '72 St', city: 'NYC', line_name: '1/2/3', latitude: 40.7784, longitude: -73.9819 },
  { id: 'st-nyc-96', name: '96 St', city: 'NYC', line_name: '1/2/3', latitude: 40.7939, longitude: -73.9723 },
  { id: 'st-nyc-canal', name: 'Canal St', city: 'NYC', line_name: 'N/Q/R/W/J/Z/6', latitude: 40.718, longitude: -74.0001 },
  { id: 'st-nyc-bkbridge', name: 'Brooklyn Bridge–City Hall', city: 'NYC', line_name: '4/5/6/J/Z', latitude: 40.7131, longitude: -74.004 },
  { id: 'st-nyc-lex59', name: 'Lexington Av–59 St', city: 'NYC', line_name: 'N/R/W/4/5/6', latitude: 40.7626, longitude: -73.9676 },
  { id: 'st-nyc-86', name: '86 St', city: 'NYC', line_name: '4/5/6', latitude: 40.7795, longitude: -73.9555 },
  { id: 'st-nyc-125', name: '125 St', city: 'NYC', line_name: '4/5/6', latitude: 40.8041, longitude: -73.9374 },
  { id: 'st-nyc-bryant', name: '42 St–Bryant Park', city: 'NYC', line_name: 'B/D/F/M/7', latitude: 40.7538, longitude: -73.9834 },
  { id: 'st-nyc-forest', name: 'Forest Hills–71 Av', city: 'NYC', line_name: 'E/F/M/R', latitude: 40.7216, longitude: -73.8447 },
  // Shanghai Metro
  { id: 'st-sh-people', name: "People's Square", city: 'Shanghai', line_name: 'Line 1 / 2 / 8', latitude: 31.2335, longitude: 121.469 },
  { id: 'st-sh-lujiazui', name: 'Lujiazui', city: 'Shanghai', line_name: 'Line 2 / 14', latitude: 31.2386, longitude: 121.5014 },
  { id: 'st-sh-century', name: 'Century Avenue', city: 'Shanghai', line_name: 'Line 2 / 4 / 6 / 9', latitude: 31.2337, longitude: 121.5264 },
  { id: 'st-sh-xujiahui', name: 'Xujiahui', city: 'Shanghai', line_name: 'Line 1 / 9 / 11', latitude: 31.194, longitude: 121.4374 },
  { id: 'st-sh-jingan', name: "Jing'an Temple", city: 'Shanghai', line_name: 'Line 2 / 7 / 14', latitude: 31.2234, longitude: 121.4453 },
  { id: 'st-sh-railway', name: 'Shanghai Railway Station', city: 'Shanghai', line_name: 'Line 1 / 3 / 4', latitude: 31.2494, longitude: 121.4557 },
  { id: 'st-sh-shaanxi', name: 'South Shaanxi Road', city: 'Shanghai', line_name: 'Line 1 / 10 / 12', latitude: 31.217, longitude: 121.4574 },
  { id: 'st-sh-south', name: 'Shanghai South', city: 'Shanghai', line_name: 'Line 1 / 3 / 15', latitude: 31.1544, longitude: 121.4297 },
  { id: 'st-sh-hongqiao', name: 'Hongqiao Railway Station', city: 'Shanghai', line_name: 'Line 2 / 10 / 17', latitude: 31.1943, longitude: 121.3207 },
  { id: 'st-sh-enanjing', name: 'East Nanjing Road', city: 'Shanghai', line_name: 'Line 2 / 10', latitude: 31.2406, longitude: 121.4839 },
  { id: 'st-sh-longyang', name: 'Longyang Road', city: 'Shanghai', line_name: 'Line 2 / 7 / 16 / 18 / Maglev', latitude: 31.2033, longitude: 121.5564 },
  { id: 'st-sh-yuyuan', name: 'Yuyuan Garden', city: 'Shanghai', line_name: 'Line 10 / 14', latitude: 31.2273, longitude: 121.4922 },
  { id: 'st-sh-zhongshan', name: 'Zhongshan Park', city: 'Shanghai', line_name: 'Line 2 / 3 / 4', latitude: 31.2185, longitude: 121.4164 },
  { id: 'st-sh-xintiandi', name: 'Xintiandi', city: 'Shanghai', line_name: 'Line 10 / 13', latitude: 31.2159, longitude: 121.4756 },
  { id: 'st-sh-wnanjing', name: 'West Nanjing Road', city: 'Shanghai', line_name: 'Line 2 / 12 / 13', latitude: 31.2297, longitude: 121.4599 },
  { id: 'st-sh-jiangsu', name: 'Jiangsu Road', city: 'Shanghai', line_name: 'Line 2 / 11', latitude: 31.2206, longitude: 121.4272 },
  { id: 'st-sh-disney', name: 'Disney Resort', city: 'Shanghai', line_name: 'Line 11', latitude: 31.1493, longitude: 121.6688 },
  { id: 'st-sh-oriental', name: 'Oriental Sports Center', city: 'Shanghai', line_name: 'Line 6 / 8 / 11', latitude: 31.1528, longitude: 121.4822 },
  // Rest of the World (demo loop)
  { id: 'st-row-central', name: 'Central Station', city: 'Rest of the World', line_name: 'Line A', latitude: 40.0, longitude: -74.0 },
  { id: 'st-row-riverside', name: 'Riverside', city: 'Rest of the World', line_name: 'Line A', latitude: 40.005, longitude: -74.01 },
  { id: 'st-row-airport', name: 'Airport Terminal', city: 'Rest of the World', line_name: 'Line A', latitude: 40.012, longitude: -74.02 },
  { id: 'st-row-museum', name: 'Museum District', city: 'Rest of the World', line_name: 'Line B', latitude: 39.99, longitude: -73.98 },
  { id: 'st-row-oldtown', name: 'Old Town', city: 'Rest of the World', line_name: 'Line B', latitude: 39.995, longitude: -73.99 },
  { id: 'st-row-university', name: 'University', city: 'Rest of the World', line_name: 'Line B', latitude: 40.008, longitude: -73.995 },
  { id: 'st-row-harbor', name: 'Harbor Point', city: 'Rest of the World', line_name: 'Line C', latitude: 39.99, longitude: -74.005 },
  { id: 'st-row-stadium', name: 'Stadium', city: 'Rest of the World', line_name: 'Line C', latitude: 39.985, longitude: -74.015 },
];

// ── Metro line polylines (official line colors) ───────────────────────────────

export interface LineRoute {
  line: string;
  color: string;
  coordinates: { latitude: number; longitude: number }[];
}

export const LINE_ROUTES: Record<City, LineRoute[]> = {
  NYC: [
    {
      line: '1/2/3',
      color: LINE_COLORS['1'],
      coordinates: [
        { latitude: 40.7939, longitude: -73.9723 }, // 96 St
        { latitude: 40.7784, longitude: -73.9819 }, // 72 St
        { latitude: 40.7682, longitude: -73.9819 }, // Columbus Circle
        { latitude: 40.7553, longitude: -73.9877 }, // Times Sq
        { latitude: 40.7504, longitude: -73.9912 }, // Penn
        { latitude: 40.7397, longitude: -74.0003 }, // 14 St/6 Av
        { latitude: 40.7102, longitude: -74.0076 }, // Fulton
      ],
    },
    {
      line: '4/5/6',
      color: LINE_COLORS['4'],
      coordinates: [
        { latitude: 40.8041, longitude: -73.9374 }, // 125 St
        { latitude: 40.7795, longitude: -73.9555 }, // 86 St
        { latitude: 40.7626, longitude: -73.9676 }, // Lex 59
        { latitude: 40.7527, longitude: -73.9772 }, // Grand Central
        { latitude: 40.7359, longitude: -73.9911 }, // Union Sq
        { latitude: 40.7131, longitude: -74.004 },  // Brooklyn Bridge
        { latitude: 40.7102, longitude: -74.0076 }, // Fulton
        { latitude: 40.6844, longitude: -73.9777 }, // Atlantic–Barclays
      ],
    },
    {
      line: '7',
      color: LINE_COLORS['7'],
      coordinates: [
        { latitude: 40.7558, longitude: -74.0019 }, // Hudson Yards
        { latitude: 40.7553, longitude: -73.9877 }, // Times Sq
        { latitude: 40.7538, longitude: -73.981 },  // 5 Av
        { latitude: 40.7527, longitude: -73.9772 }, // Grand Central
        { latitude: 40.7466, longitude: -73.8913 }, // Jackson Hts
        { latitude: 40.7596, longitude: -73.83 },   // Flushing–Main
      ],
    },
    {
      line: 'A/C/E',
      color: LINE_COLORS['A'],
      coordinates: [
        { latitude: 40.7682, longitude: -73.9819 }, // Columbus Circle
        { latitude: 40.7522, longitude: -73.9934 }, // Penn
        { latitude: 40.7403, longitude: -74.0023 }, // 8 Av–14 St
        { latitude: 40.7323, longitude: -74.0007 }, // W 4 St
        { latitude: 40.7102, longitude: -74.0076 }, // Fulton
      ],
    },
    {
      line: 'B/D/F/M',
      color: LINE_COLORS['B'],
      coordinates: [
        { latitude: 40.7538, longitude: -73.9834 }, // Bryant Park
        { latitude: 40.7497, longitude: -73.9879 }, // Herald Sq
        { latitude: 40.7397, longitude: -74.0003 }, // 14 St/6 Av
        { latitude: 40.7323, longitude: -74.0007 }, // W 4 St
      ],
    },
    {
      line: 'N/Q/R/W',
      color: LINE_COLORS['N'],
      coordinates: [
        { latitude: 40.7626, longitude: -73.9676 }, // Lex 59
        { latitude: 40.7553, longitude: -73.9877 }, // Times Sq
        { latitude: 40.7497, longitude: -73.9879 }, // Herald Sq
        { latitude: 40.7359, longitude: -73.9911 }, // Union Sq
        { latitude: 40.718, longitude: -74.0001 },  // Canal St
        { latitude: 40.6844, longitude: -73.9777 }, // Atlantic–Barclays
      ],
    },
    {
      line: 'L',
      color: LINE_COLORS['L'],
      coordinates: [
        { latitude: 40.7403, longitude: -74.0023 }, // 8 Av
        { latitude: 40.7397, longitude: -74.0003 }, // 6 Av
        { latitude: 40.7359, longitude: -73.9911 }, // Union Sq
        { latitude: 40.7328, longitude: -73.9862 }, // 3 Av
        { latitude: 40.7309, longitude: -73.9816 }, // 1 Av
        { latitude: 40.7173, longitude: -73.9569 }, // Bedford
      ],
    },
  ],
  Shanghai: [
    {
      line: 'Line 1',
      color: LINE_COLORS['Line 1'],
      coordinates: [
        { latitude: 31.2494, longitude: 121.4557 }, // Railway Station
        { latitude: 31.2335, longitude: 121.469 },  // People's Square
        { latitude: 31.217, longitude: 121.4574 },  // South Shaanxi
        { latitude: 31.194, longitude: 121.4374 },  // Xujiahui
        { latitude: 31.1544, longitude: 121.4297 }, // Shanghai South
      ],
    },
    {
      line: 'Line 2',
      color: LINE_COLORS['Line 2'],
      coordinates: [
        { latitude: 31.1943, longitude: 121.3207 }, // Hongqiao
        { latitude: 31.2185, longitude: 121.4164 }, // Zhongshan Park
        { latitude: 31.2206, longitude: 121.4272 }, // Jiangsu Rd
        { latitude: 31.2234, longitude: 121.4453 }, // Jing'an Temple
        { latitude: 31.2297, longitude: 121.4599 }, // W Nanjing Rd
        { latitude: 31.2335, longitude: 121.469 },  // People's Square
        { latitude: 31.2406, longitude: 121.4839 }, // E Nanjing Rd
        { latitude: 31.2386, longitude: 121.5014 }, // Lujiazui
        { latitude: 31.2337, longitude: 121.5264 }, // Century Ave
        { latitude: 31.2033, longitude: 121.5564 }, // Longyang Rd
      ],
    },
    {
      line: 'Line 10',
      color: LINE_COLORS['Line 10'],
      coordinates: [
        { latitude: 31.1943, longitude: 121.3207 }, // Hongqiao
        { latitude: 31.217, longitude: 121.4574 },  // South Shaanxi
        { latitude: 31.2159, longitude: 121.4756 }, // Xintiandi
        { latitude: 31.2273, longitude: 121.4922 }, // Yuyuan Garden
        { latitude: 31.2406, longitude: 121.4839 }, // E Nanjing Rd
      ],
    },
    {
      line: 'Line 11',
      color: LINE_COLORS['Line 11'],
      coordinates: [
        { latitude: 31.2206, longitude: 121.4272 }, // Jiangsu Rd
        { latitude: 31.194, longitude: 121.4374 },  // Xujiahui
        { latitude: 31.1528, longitude: 121.4822 }, // Oriental Sports
        { latitude: 31.1493, longitude: 121.6688 }, // Disney Resort
      ],
    },
  ],
  'Rest of the World': [
    {
      line: 'Line A',
      color: LINE_COLORS['Line A'],
      coordinates: [
        { latitude: 40.0, longitude: -74.0 },
        { latitude: 40.005, longitude: -74.01 },
        { latitude: 40.012, longitude: -74.02 },
      ],
    },
    {
      line: 'Line B',
      color: LINE_COLORS['Line B'],
      coordinates: [
        { latitude: 39.99, longitude: -73.98 },
        { latitude: 39.995, longitude: -73.99 },
        { latitude: 40.008, longitude: -73.995 },
      ],
    },
    {
      line: 'Line C',
      color: LINE_COLORS['Line C'],
      coordinates: [
        { latitude: 39.99, longitude: -74.005 },
        { latitude: 39.985, longitude: -74.015 },
      ],
    },
  ],
};

// ── Tasks ─────────────────────────────────────────────────────────────────────

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
    city: 'Rest of the World',
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
    city: 'Rest of the World',
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
    city: 'Rest of the World',
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
    city: 'Rest of the World',
    is_rush_hour_only: false,
    step_goal: 1000,
  },
];

// ── Cards & Character Champions ───────────────────────────────────────────────

export const CHAMPION_NAMES = [
  'Grand Central Dragon',
  'The Maglev Empress',
  'Express Phantom',
] as const;

export const SEED_CARDS: Card[] = [
  // Grand Central Dragon set (NYC)
  { id: 'cd-rookie', name: 'Metro Rookie', artwork_url: '', rarity: 'Common', attack: 12, defense: 8, description: 'Every journey begins with a single swipe.', champion: 'Grand Central Dragon' },
  { id: 'cd-turnstile', name: 'Turnstile Guard', artwork_url: '', rarity: 'Common', attack: 10, defense: 15, description: 'Holds the line at the fare gates.', champion: 'Grand Central Dragon' },
  { id: 'cd-owl', name: 'Night Owl Conductor', artwork_url: '', rarity: 'Rare', attack: 24, defense: 26, description: 'Commands the last train out of Brooklyn.', champion: 'Grand Central Dragon' },
  { id: 'cd-wraith', name: 'Ghost Line Wraith', artwork_url: '', rarity: 'Epic', attack: 38, defense: 44, description: 'Haunts abandoned stations of the IND.', champion: 'Grand Central Dragon' },
  { id: 'cd-dragon', name: 'Grand Central Dragon', artwork_url: '', rarity: 'Legendary', attack: 65, defense: 58, description: 'Sleeps beneath the celestial ceiling.', champion: 'Grand Central Dragon' },
  // The Maglev Empress set (Shanghai)
  { id: 'cd-signal', name: 'Signal Keeper', artwork_url: '', rarity: 'Common', attack: 14, defense: 12, description: 'Keeps the lights green down the tunnel.', champion: 'The Maglev Empress' },
  { id: 'cd-sprite', name: 'Shanghai Sprite', artwork_url: '', rarity: 'Common', attack: 16, defense: 12, description: 'Darts between Line 2 carriages at dawn.', champion: 'The Maglev Empress' },
  { id: 'cd-bund', name: 'Bund Sentinel', artwork_url: '', rarity: 'Epic', attack: 45, defense: 40, description: 'Watches the river from the Bund promenade.', champion: 'The Maglev Empress' },
  { id: 'cd-maglev', name: 'The Maglev Empress', artwork_url: '', rarity: 'Legendary', attack: 70, defense: 50, description: "Shanghai's 430 km/h sovereign of steel.", champion: 'The Maglev Empress' },
  // Express Phantom set
  { id: 'cd-imp', name: 'Switchyard Imp', artwork_url: '', rarity: 'Common', attack: 11, defense: 10, description: 'Mischief on the crossovers, harmless to locals.', champion: 'Express Phantom' },
  { id: 'cd-midnight', name: 'Midnight Express', artwork_url: '', rarity: 'Rare', attack: 30, defense: 22, description: 'The train that never appears on the countdown clock.', champion: 'Express Phantom' },
  { id: 'cd-herald', name: 'Iron Herald', artwork_url: '', rarity: 'Epic', attack: 40, defense: 48, description: "Announces the Phantom's arrival in sparks.", champion: 'Express Phantom' },
  { id: 'cd-phantom', name: 'Express Phantom', artwork_url: '', rarity: 'Rare', attack: 28, defense: 18, description: 'Skips every local stop. Catches nobody.', champion: 'Express Phantom' },
];

// ── Line Wars factions ────────────────────────────────────────────────────────

/** Faction lines competing in Line Wars, per city (shared with admin). */
export const FACTIONS = LINE_FACTIONS;

/** Offline baseline weekly XP per faction (player XP is added on top). */
export const FACTION_BASE_XP: Record<string, number> = {
  // NYC — headline rivalries get bigger numbers
  '1': 9800, '2': 9400, '3': 7200,
  '4': 15200, '5': 14100, '6': 16800,
  '7': 11300,
  'A': 13400, 'C': 8900, 'E': 11700,
  'B': 8100, 'D': 9200, 'F': 10500, 'M': 9600,
  'G': 5400, 'J': 4800, 'Z': 3900,
  'L': 14600,
  'N': 10800, 'Q': 11500, 'R': 8800, 'W': 6100,
  'S': 3300,
  // Shanghai
  'Line 1': 18400, 'Line 2': 22100, 'Line 3': 9800, 'Line 4': 10200,
  'Line 5': 7600, 'Line 6': 8100, 'Line 7': 12400, 'Line 8': 11300,
  'Line 9': 13900, 'Line 10': 14700, 'Line 11': 8600, 'Line 12': 10400,
  'Line 13': 7900, 'Line 14': 12800, 'Line 15': 6900, 'Line 16': 5800,
  'Line 17': 5200, 'Line 18': 9500,
  // Rest of the World
  'Line A': 4200, 'Line B': 5150, 'Line C': 3890,
};

// ── Leaderboard fallback ──────────────────────────────────────────────────────

export const SEED_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 0, user_id: 'u-ana', username: 'anatransit', primary_line: '4', total_xp: 14820, level: 15 },
  { rank: 0, user_id: 'u-bo', username: 'bojack_line2', primary_line: 'Line 2', total_xp: 12440, level: 13 },
  { rank: 0, user_id: 'u-cleo', username: 'cleo_rides_L', primary_line: 'L', total_xp: 10210, level: 11 },
  { rank: 0, user_id: 'u-dev', username: 'devgansu', primary_line: 'Line 1', total_xp: 8430, level: 9 },
  { rank: 0, user_id: 'u-eli', username: 'eli_local', primary_line: 'A', total_xp: 6980, level: 7 },
  { rank: 0, user_id: 'u-faye', username: 'faye_falcon', primary_line: '6', total_xp: 5340, level: 6 },
  { rank: 0, user_id: 'u-gus', username: 'gus_underground', primary_line: 'L', total_xp: 4120, level: 5 },
  { rank: 0, user_id: 'u-hana', username: 'hana_xujiahui', primary_line: 'Line 11', total_xp: 2870, level: 3 },
];

// ── Social feed mock data ─────────────────────────────────────────────────────

export type FeedPostKind = 'check_in' | 'photo_task' | 'booster_pack';

export interface FeedComment {
  username: string;
  text: string;
  timeAgo: string;
}

export interface FeedPost {
  id: string;
  username: string;
  avatarColor: string;
  timeAgo: string;
  city: City;
  station: string;
  line: string;
  kind: FeedPostKind;
  text: string;
  likes: number;
  hyped: number;
  comments: FeedComment[];
}

export const SEED_FEED: FeedPost[] = [
  {
    id: 'fp-1',
    username: 'anatransit',
    avatarColor: '#4F8CFF',
    timeAgo: '12m',
    city: 'NYC',
    station: 'Union Sq–14 St',
    line: 'L',
    kind: 'check_in',
    text: 'Platform was PACKED but made it for the rush-hour bonus. Line L crew climbing the board this week.',
    likes: 24,
    hyped: 9,
    comments: [
      { username: 'cleo_rides_L', text: 'L gang 🚇', timeAgo: '8m' },
      { username: 'eli_local', text: 'I was literally on that platform lol', timeAgo: '4m' },
    ],
  },
  {
    id: 'fp-2',
    username: 'bojack_line2',
    avatarColor: '#34D399',
    timeAgo: '47m',
    city: 'Shanghai',
    station: 'Lujiazui',
    line: 'Line 2',
    kind: 'photo_task',
    text: 'Gemini verified my train shot on the first try — the 2x Maglev Sprint XP is real.',
    likes: 41,
    hyped: 18,
    comments: [
      { username: 'hana_xujiahui', text: 'Nice angle of the Pearl Tower!', timeAgo: '30m' },
    ],
  },
  {
    id: 'fp-3',
    username: 'faye_falcon',
    avatarColor: '#F59E0B',
    timeAgo: '2h',
    city: 'NYC',
    station: 'Grand Central–42 St',
    line: '6',
    kind: 'booster_pack',
    text: 'Pulled the GRAND CENTRAL DRAGON from a monthly-task pack. Legendary pull!! 🔥',
    likes: 132,
    hyped: 87,
    comments: [
      { username: 'anatransit', text: 'NO WAY. I have been chasing that card for weeks', timeAgo: '1h' },
      { username: 'devgansu', text: 'The odds on Legendaries are brutal, congrats', timeAgo: '1h' },
      { username: 'gus_underground', text: 'Rigged (jealous)', timeAgo: '55m' },
    ],
  },
  {
    id: 'fp-4',
    username: 'devgansu',
    avatarColor: '#A855F7',
    timeAgo: '5h',
    city: 'Shanghai',
    station: 'Xujiahui',
    line: 'Line 1',
    kind: 'check_in',
    text: 'Three lines through this interchange and I checked in under 90 seconds of arriving. Efficiency.',
    likes: 12,
    hyped: 4,
    comments: [],
  },
  {
    id: 'fp-5',
    username: 'cleo_rides_L',
    avatarColor: '#F472B6',
    timeAgo: '8h',
    city: 'NYC',
    station: 'Bedford Ave',
    line: 'L',
    kind: 'photo_task',
    text: 'Platform Portrait done — the tile mosaic at Bedford counts as art, right? AI said yes.',
    likes: 19,
    hyped: 6,
    comments: [{ username: 'faye_falcon', text: 'It absolutely counts', timeAgo: '6h' }],
  },
  {
    id: 'fp-6',
    username: 'gus_underground',
    avatarColor: '#22D3EE',
    timeAgo: '1d',
    city: 'Rest of the World',
    station: 'Central Station',
    line: 'Line A',
    kind: 'check_in',
    text: 'Offline check-in worked perfectly in the tunnel. Manual select ftw.',
    likes: 8,
    hyped: 2,
    comments: [],
  },
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
