-- ════════════════════════════════════════════════════════════════════════════
-- MetroApp — initial schema
-- PostGIS-enabled transit game backend: stations, tasks, cards, profiles,
-- user_cards, promo_codes, check_ins, line wars, and helper RPCs.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists postgis;
create extension if not exists "uuid-ossp";

-- ── Stations ─────────────────────────────────────────────────────────────────

create table if not exists public.stations (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  city        text not null check (city in ('NYC', 'Shanghai', 'Generic')),
  line_name   text not null,
  latitude    double precision not null check (latitude between -90 and 90),
  longitude   double precision not null check (longitude between -180 and 180),
  geog        geography(Point, 4326) generated always as
              (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography) stored,
  created_at  timestamptz not null default now()
);

create index if not exists stations_geog_idx on public.stations using gist (geog);
create index if not exists stations_city_idx on public.stations (city);

-- Stations within `radius_meters` of a point, nearest first.
create or replace function public.get_nearby_stations(
  user_lat double precision,
  user_lng double precision,
  radius_meters integer default 500
)
returns setof public.stations
language sql stable
as $$
  select s.*
  from public.stations s
  where ST_DWithin(
    s.geog,
    ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
    radius_meters
  )
  order by s.geog <-> ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;
$$;

-- ── Tasks ────────────────────────────────────────────────────────────────────

create table if not exists public.tasks (
  id                 uuid primary key default uuid_generate_v4(),
  title              text not null,
  description        text not null default '',
  task_type          text not null check (task_type in ('photo_ai', 'trivia', 'step_count')),
  ai_prompt_criteria text,
  points             integer not null default 100 check (points > 0),
  cadence            text not null check (cadence in ('daily', 'weekly', 'monthly')),
  city               text not null default 'Generic',
  is_rush_hour_only  boolean not null default false,
  trivia_options     jsonb,
  trivia_answer_idx  integer,
  step_goal          integer,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  constraint photo_tasks_need_criteria
    check (task_type <> 'photo_ai' or ai_prompt_criteria is not null),
  constraint trivia_tasks_need_options
    check (task_type <> 'trivia' or (trivia_options is not null and trivia_answer_idx is not null))
);

create index if not exists tasks_cadence_idx on public.tasks (cadence, is_active);

-- ── Cards & collection ───────────────────────────────────────────────────────

create table if not exists public.cards (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  artwork_url text not null default '',
  rarity      text not null check (rarity in ('Common', 'Rare', 'Epic', 'Legendary')),
  attack      integer not null default 0,
  defense     integer not null default 0,
  description text not null default '',
  created_at  timestamptz not null default now()
);

create table if not exists public.user_cards (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  card_id     uuid not null references public.cards (id) on delete cascade,
  acquired_at timestamptz not null default now(),
  source      text not null default 'booster' check (source in ('booster', 'promo_code', 'reward')),
  unique (user_id, card_id, source)
);

create index if not exists user_cards_user_idx on public.user_cards (user_id);

-- ── Profiles ─────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text not null unique,
  primary_line text not null default '',
  city         text not null default 'NYC',
  total_xp     integer not null default 0 check (total_xp >= 0),
  level        integer not null default 1 check (level >= 1),
  avatar_url   text,
  created_at   timestamptz not null default now()
);

create index if not exists profiles_xp_idx on public.profiles (total_xp desc);

-- Auto-provision a profile on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'username', 'rider_' || substr(new.id::text, 1, 8)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Atomically award XP and recompute level (1000 XP per level).
create or replace function public.award_xp(p_user_id uuid, p_xp integer)
returns public.profiles
language plpgsql security definer set search_path = public
as $$
declare
  updated public.profiles;
begin
  update public.profiles
  set total_xp = total_xp + p_xp,
      level    = floor((total_xp + p_xp) / 1000.0)::int + 1
  where id = p_user_id
  returning * into updated;
  return updated;
end;
$$;

-- ── Check-ins ────────────────────────────────────────────────────────────────

create table if not exists public.check_ins (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references auth.users (id) on delete cascade,
  station_id    uuid not null references public.stations (id) on delete cascade,
  checked_in_at timestamptz not null default now(),
  method        text not null default 'gps' check (method in ('gps', 'manual'))
);

create index if not exists check_ins_user_idx on public.check_ins (user_id, checked_in_at desc);

-- ── Line Wars (weekly faction XP) ────────────────────────────────────────────

create table if not exists public.line_weekly_xp (
  id         uuid primary key default uuid_generate_v4(),
  city       text not null,
  line_name  text not null,
  week_start date not null,
  total_xp   bigint not null default 0,
  unique (city, line_name, week_start)
);

-- Upsert weekly XP for a faction line.
create or replace function public.increment_line_xp(
  p_city text,
  p_line text,
  p_xp integer
)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.line_weekly_xp (city, line_name, week_start, total_xp)
  values (p_city, p_line, date_trunc('week', now())::date, p_xp)
  on conflict (city, line_name, week_start)
  do update set total_xp = public.line_weekly_xp.total_xp + excluded.total_xp;
end;
$$;

create or replace function public.get_line_leaderboard(p_city text)
returns table (line_name text, city text, weekly_xp bigint, rank bigint)
language sql stable
as $$
  select line_name, city, total_xp as weekly_xp,
         rank() over (order by total_xp desc) as rank
  from public.line_weekly_xp
  where city = p_city and week_start = date_trunc('week', now())::date
  order by total_xp desc;
$$;

-- ── Promo / scratch codes ────────────────────────────────────────────────────

create table if not exists public.promo_codes (
  id          uuid primary key default uuid_generate_v4(),
  code        text not null unique check (code ~ '^[A-Z0-9]{8}$'),
  card_id     uuid not null references public.cards (id) on delete cascade,
  is_redeemed boolean not null default false,
  redeemed_by uuid references auth.users (id) on delete set null,
  redeemed_at timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists promo_codes_code_idx on public.promo_codes (code);

-- Atomic single-use redemption: marks the code spent and grants the card.
-- Returns the granted card_id, or raises an error for invalid/spent codes.
create or replace function public.redeem_promo_code(p_code text, p_user_id uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_card_id uuid;
begin
  update public.promo_codes
  set is_redeemed = true, redeemed_by = p_user_id, redeemed_at = now()
  where code = upper(p_code) and is_redeemed = false
  returning card_id into v_card_id;

  if v_card_id is null then
    raise exception 'invalid_or_redeemed_code';
  end if;

  insert into public.user_cards (user_id, card_id, source)
  values (p_user_id, v_card_id, 'promo_code')
  on conflict do nothing;

  return v_card_id;
end;
$$;

-- ── AR scanner interest (feature-flag telemetry) ─────────────────────────────

create table if not exists public.ar_scanner_interest (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users (id) on delete set null,
  opted_in   boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── Row Level Security ───────────────────────────────────────────────────────

alter table public.stations             enable row level security;
alter table public.tasks                enable row level security;
alter table public.cards                enable row level security;
alter table public.profiles             enable row level security;
alter table public.user_cards           enable row level security;
alter table public.check_ins            enable row level security;
alter table public.promo_codes          enable row level security;
alter table public.line_weekly_xp       enable row level security;
alter table public.ar_scanner_interest  enable row level security;

-- Public read-only reference data.
create policy "stations readable by all" on public.stations   for select using (true);
create policy "tasks readable by all"    on public.tasks      for select using (is_active = true);
create policy "cards readable by all"    on public.cards      for select using (true);
create policy "profiles readable by all" on public.profiles   for select using (true);
create policy "line xp readable by all"  on public.line_weekly_xp for select using (true);

-- Users manage their own rows. Mutations that must be atomic go through
-- security-definer RPCs (award_xp, redeem_promo_code, increment_line_xp).
create policy "profiles insert own" on public.profiles  for insert with check (auth.uid() = id);
create policy "profiles update own" on public.profiles  for update using (auth.uid() = id);

create policy "user_cards read own"   on public.user_cards for select using (auth.uid() = user_id);
create policy "user_cards insert own" on public.user_cards for insert with check (auth.uid() = user_id);

create policy "check_ins read own"    on public.check_ins  for select using (auth.uid() = user_id);
create policy "check_ins insert own"  on public.check_ins  for insert with check (auth.uid() = user_id);

-- promo_codes: no direct client access — redemption flows exclusively through
-- the redeem_promo_code RPC so codes can never be enumerated or double-spent.
create policy "promo_codes admin read" on public.promo_codes
  for select using (auth.jwt() ->> 'role' = 'service_role');

create policy "ar interest insert" on public.ar_scanner_interest
  for insert with check (true);

-- ── Seed data ────────────────────────────────────────────────────────────────

insert into public.stations (name, city, line_name, latitude, longitude) values
  ('Union Square',        'NYC',      'L / 4 / 5 / 6', 40.7359, -73.9911),
  ('Bedford Ave',         'NYC',      'L',             40.7173, -73.9569),
  ('Grand Central',       'NYC',      '4 / 5 / 6 / 7', 40.7527, -73.9772),
  ('Times Square',        'NYC',      '1 / 2 / 3 / N / Q / R / W', 40.7553, -73.9877),
  ('Fulton Center',       'NYC',      '2 / 3 / 4 / 5 / A / C / J / Z', 40.7102, -74.0076),
  ('Atlantic Ave–Barclays','NYC',     '2 / 3 / 4 / 5 / B / Q / D / N / R', 40.6844, -73.9777),
  ('Jackson Hts–Roosevelt','NYC',     'E / F / M / R / 7', 40.7466, -73.8913),
  ('People''s Square',    'Shanghai', 'Line 1 / 2 / 8', 31.2335, 121.4690),
  ('Lujiazui',            'Shanghai', 'Line 2 / 14',    31.2386, 121.5014),
  ('Xujiahui',            'Shanghai', 'Line 1 / 9 / 11',31.1940, 121.4374),
  ('Jing''an Temple',     'Shanghai', 'Line 2 / 7 / 14',31.2234, 121.4453),
  ('Century Avenue',      'Shanghai', 'Line 2 / 4 / 6 / 9', 31.2337, 121.5264),
  ('Central Station',     'Generic',  'Line A',         40.0000, -74.0000),
  ('Riverside',           'Generic',  'Line A',         40.0050, -74.0100),
  ('Old Town',            'Generic',  'Line B',         39.9950, -73.9900),
  ('University',          'Generic',  'Line B',         40.0080, -73.9950),
  ('Harbor Point',        'Generic',  'Line C',         39.9900, -74.0050)
on conflict do nothing;

insert into public.cards (name, artwork_url, rarity, attack, defense, description) values
  ('Metro Rookie',      '', 'Common',    12,  8,  'Every journey begins with a single swipe.'),
  ('Turnstile Guard',   '', 'Common',    10, 15,  'Holds the line at the fare gates.'),
  ('Signal Keeper',     '', 'Common',    14, 12,  'Keeps the lights green down the tunnel.'),
  ('Express Phantom',   '', 'Rare',      28, 18,  'Skips every local stop. Catches nobody.'),
  ('Night Owl Conductor','', 'Rare',     24, 26,  'Commands the last train out of Brooklyn.'),
  ('Rush Hour Titan',   '', 'Epic',      42, 35,  'Thrives when the platform overflows.'),
  ('Ghost Line Wraith', '', 'Epic',      38, 44,  'Haunts abandoned stations of the IND.'),
  ('Grand Central Dragon','', 'Legendary', 65, 58, 'Sleeps beneath the celestial ceiling.'),
  ('The Maglev Empress','', 'Legendary', 70, 50, 'Shanghai''s 430 km/h sovereign of steel.')
on conflict do nothing;

insert into public.tasks
  (title, description, task_type, ai_prompt_criteria, points, cadence, city, is_rush_hour_only, trivia_options, trivia_answer_idx, step_goal) values
  ('Platform Portrait',  'Snap a photo of any station name sign on the platform.', 'photo_ai',
   'A photo clearly showing a subway/metro station name sign or platform signage.', 150, 'daily', 'NYC', false, null, null, null),
  ('Ticket to Ride',     'Photograph a valid metro ticket, metro card, or QR turnstile.', 'photo_ai',
   'A photo showing a transit ticket, metro card, or station turnstile/QR gate.', 150, 'daily', 'Shanghai', false, null, null, null),
  ('Train Spotting',     'Capture a photo of a train arriving at or leaving the platform.', 'photo_ai',
   'A photo showing a subway or metro train at a station platform.', 250, 'weekly', 'NYC', false, null, null, null),
  ('Map Master',         'Photograph the official system map inside a train or station.', 'photo_ai',
   'A photo showing an official subway/metro system map poster or display.', 200, 'weekly', 'Generic', false, null, null, null),
  ('Transit Historian',  'Photograph an old or decorative tile mosaic inside a station.', 'photo_ai',
   'A photo showing decorative tilework, mosaic, or art inside a metro station.', 500, 'monthly', 'NYC', false, null, null, null),
  ('Rush Quiz: Lines',   'Which NYC line runs the A train?', 'trivia', null, 100, 'daily', 'NYC', true,
   '["8th Avenue Express", "Lexington Avenue Local", "Broadway Express", "Flushing Local"]'::jsonb, 0, null),
  ('Rush Quiz: Shanghai','Which Shanghai line serves Lujiazui (Oriental Pearl Tower)?', 'trivia', null, 100, 'daily', 'Shanghai', true,
   '["Line 1", "Line 2", "Line 11", "Line 16"]'::jsonb, 1, null),
  ('Rush Quiz: Records', 'Which system is the world''s busiest by annual ridership?', 'trivia', null, 100, 'daily', 'Generic', true,
   '["NYC Subway", "London Underground", "Shanghai Metro", "Tokyo Metro"]'::jsonb, 2, null),
  ('Stair Climber',      'Take the stairs, not the escalator — log 200 steps between platforms.', 'step_count', null, 100, 'daily', 'Generic', true, null, null, 200),
  ('Marathon Commuter',  'Log 1,000 steps underground this week.', 'step_count', null, 300, 'weekly', 'Generic', false, null, null, 1000)
on conflict do nothing;
