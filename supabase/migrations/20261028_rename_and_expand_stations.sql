-- ════════════════════════════════════════════════════════════════════════════
-- MetroApp — rename 'Generic' → 'Rest of the World' and expand station coverage
-- - City check constraints on stations/tasks/profiles accept
--   'NYC' | 'Shanghai' | 'Rest of the World'
-- - All existing 'Generic' rows migrated
-- - Expanded NYC MTA + Shanghai Metro station seeds, RoW demo stops
-- - cards.champion column for Character Champion set grouping
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Update city check constraints ─────────────────────────────────────────

alter table public.stations drop constraint if exists stations_city_check;
alter table public.tasks    drop constraint if exists tasks_city_check;
alter table public.profiles drop constraint if exists profiles_city_check;

-- Migrate rows BEFORE adding the new constraint so nothing violates it.
update public.stations set city = 'Rest of the World' where city = 'Generic';
update public.tasks    set city = 'Rest of the World' where city = 'Generic';
update public.profiles set city = 'Rest of the World' where city = 'Generic';
update public.line_weekly_xp set city = 'Rest of the World' where city = 'Generic';

alter table public.stations
  add constraint stations_city_check
  check (city in ('NYC', 'Shanghai', 'Rest of the World'));
alter table public.tasks
  add constraint tasks_city_check
  check (city in ('NYC', 'Shanghai', 'Rest of the World'));
alter table public.profiles
  add constraint profiles_city_check
  check (city in ('NYC', 'Shanghai', 'Rest of the World'));

-- ── 2. Deduplicate + unique index for idempotent seeding ─────────────────────

delete from public.stations a
using public.stations b
where a.id > b.id
  and a.name = b.name
  and a.city = b.city
  and a.line_name = b.line_name;

create unique index if not exists stations_name_city_line_uidx
  on public.stations (name, city, line_name);

-- ── 3. Expanded station seeds ────────────────────────────────────────────────

insert into public.stations (name, city, line_name, latitude, longitude) values
  -- ── NYC MTA ──
  ('Times Sq–42 St',          'NYC', '1/2/3/7/N/Q/R/W/S', 40.7553, -73.9877),
  ('Grand Central–42 St',     'NYC', '4/5/6/7/S',         40.7527, -73.9772),
  ('Union Sq–14 St',          'NYC', 'L/N/Q/R/W/4/5/6',   40.7359, -73.9911),
  ('Herald Sq–34 St',         'NYC', 'B/D/F/M/N/Q/R/W',   40.7497, -73.9879),
  ('34 St–Penn Station',      'NYC', '1/2/3',             40.7504, -73.9912),
  ('34 St–Penn Station',      'NYC', 'A/C/E',             40.7522, -73.9934),
  ('Columbus Circle–59 St',   'NYC', 'A/B/C/D/1',         40.7682, -73.9819),
  ('Fulton Center',           'NYC', '2/3/4/5/A/C/J/Z',   40.7102, -74.0076),
  ('Atlantic Ave–Barclays',   'NYC', '2/3/4/5/B/D/N/Q/R', 40.6844, -73.9777),
  ('Bedford Ave',             'NYC', 'L',                 40.7173, -73.9569),
  ('1 Av',                    'NYC', 'L',                 40.7309, -73.9816),
  ('3 Av',                    'NYC', 'L',                 40.7328, -73.9862),
  ('14 St/6 Av',              'NYC', 'L/F/M/1/2/3',       40.7397, -74.0003),
  ('8 Av–14 St',              'NYC', 'L/A/C/E',           40.7403, -74.0023),
  ('W 4 St–Wash Sq',          'NYC', 'A/B/C/D/E/F/M',     40.7323, -74.0007),
  ('Jackson Hts–Roosevelt',   'NYC', 'E/F/M/R/7',         40.7466, -73.8913),
  ('Flushing–Main St',        'NYC', '7',                 40.7596, -73.8300),
  ('Hudson Yards–34 St',      'NYC', '7',                 40.7558, -74.0019),
  ('5 Av',                    'NYC', '7',                 40.7538, -73.9810),
  ('72 St',                   'NYC', '1/2/3',             40.7784, -73.9819),
  ('96 St',                   'NYC', '1/2/3',             40.7939, -73.9723),
  ('Canal St',                'NYC', 'N/Q/R/W/J/Z/6',     40.7180, -74.0001),
  ('Brooklyn Bridge–City Hall','NYC','4/5/6/J/Z',         40.7131, -74.0040),
  ('Lexington Av–59 St',      'NYC', 'N/R/W/4/5/6',       40.7626, -73.9676),
  ('86 St',                   'NYC', '4/5/6',             40.7795, -73.9555),
  ('125 St',                  'NYC', '4/5/6',             40.8041, -73.9374),
  ('42 St–Bryant Park',       'NYC', 'B/D/F/M/7',         40.7538, -73.9834),
  ('Forest Hills–71 Av',      'NYC', 'E/F/M/R',           40.7216, -73.8447),
  -- ── Shanghai Metro ──
  ('People''s Square',        'Shanghai', 'Line 1 / 2 / 8',        31.2335, 121.4690),
  ('Lujiazui',                'Shanghai', 'Line 2 / 14',           31.2386, 121.5014),
  ('Century Avenue',          'Shanghai', 'Line 2 / 4 / 6 / 9',    31.2337, 121.5264),
  ('Xujiahui',                'Shanghai', 'Line 1 / 9 / 11',       31.1940, 121.4374),
  ('Jing''an Temple',         'Shanghai', 'Line 2 / 7 / 14',       31.2234, 121.4453),
  ('Shanghai Railway Station','Shanghai', 'Line 1 / 3 / 4',        31.2494, 121.4557),
  ('South Shaanxi Road',      'Shanghai', 'Line 1 / 10 / 12',      31.2170, 121.4574),
  ('Shanghai South',          'Shanghai', 'Line 1 / 3 / 15',       31.1544, 121.4297),
  ('Hongqiao Railway Station','Shanghai', 'Line 2 / 10 / 17',      31.1943, 121.3207),
  ('East Nanjing Road',       'Shanghai', 'Line 2 / 10',           31.2406, 121.4839),
  ('Longyang Road',           'Shanghai', 'Line 2 / 7 / 16 / 18 / Maglev', 31.2033, 121.5564),
  ('Yuyuan Garden',           'Shanghai', 'Line 10 / 14',          31.2273, 121.4922),
  ('Zhongshan Park',          'Shanghai', 'Line 2 / 3 / 4',        31.2185, 121.4164),
  ('Xintiandi',               'Shanghai', 'Line 10 / 13',          31.2159, 121.4756),
  ('West Nanjing Road',       'Shanghai', 'Line 2 / 12 / 13',      31.2297, 121.4599),
  ('Jiangsu Road',            'Shanghai', 'Line 2 / 11',           31.2206, 121.4272),
  ('Disney Resort',           'Shanghai', 'Line 11',               31.1493, 121.6688),
  ('Oriental Sports Center',  'Shanghai', 'Line 6 / 8 / 11',       31.1528, 121.4822),
  -- ── Rest of the World (demo loop) ──
  ('Central Station',         'Rest of the World', 'Line A', 40.0000, -74.0000),
  ('Riverside',               'Rest of the World', 'Line A', 40.0050, -74.0100),
  ('Airport Terminal',        'Rest of the World', 'Line A', 40.0120, -74.0200),
  ('Museum District',         'Rest of the World', 'Line B', 39.9900, -73.9800),
  ('Old Town',                'Rest of the World', 'Line B', 39.9950, -73.9900),
  ('University',              'Rest of the World', 'Line B', 40.0080, -73.9950),
  ('Harbor Point',            'Rest of the World', 'Line C', 39.9900, -74.0050),
  ('Stadium',                 'Rest of the World', 'Line C', 39.9850, -74.0150)
on conflict do nothing;

-- ── 4. Character Champion set membership on cards ────────────────────────────

alter table public.cards add column if not exists champion text;

-- Cards need a name-unique index for idempotent seed inserts too.
delete from public.cards a
using public.cards b
where a.id > b.id and a.name = b.name;

create unique index if not exists cards_name_uidx on public.cards (name);

update public.cards set champion = name
where name in ('Grand Central Dragon', 'The Maglev Empress', 'Express Phantom');

update public.cards set champion = 'Grand Central Dragon'  where name in
  ('Metro Rookie', 'Turnstile Guard', 'Night Owl Conductor', 'Ghost Line Wraith');
update public.cards set champion = 'The Maglev Empress'    where name in
  ('Signal Keeper', 'Shanghai Sprite', 'Bund Sentinel');
update public.cards set champion = 'Express Phantom'       where name in
  ('Switchyard Imp', 'Midnight Express', 'Iron Herald');

insert into public.cards (name, artwork_url, rarity, attack, defense, description, champion) values
  ('Shanghai Sprite',  '', 'Common',    16, 12, 'Darts between Line 2 carriages at dawn.',          'The Maglev Empress'),
  ('Bund Sentinel',    '', 'Epic',      45, 40, 'Watches the river from the Bund promenade.',       'The Maglev Empress'),
  ('Switchyard Imp',   '', 'Common',    11, 10, 'Mischief on the crossovers, harmless to locals.',  'Express Phantom'),
  ('Midnight Express', '', 'Rare',      30, 22, 'The train that never appears on the countdown clock.', 'Express Phantom'),
  ('Iron Herald',      '', 'Epic',      40, 48, 'Announces the Phantom''s arrival in sparks.',      'Express Phantom')
on conflict do nothing;
