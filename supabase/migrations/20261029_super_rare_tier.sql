-- 20261029_super_rare_tier.sql
-- Adds the 'Super Rare' card rarity and promotes the three Character Champions
-- to physical-only tiers. Unlock rules enforced by clients:
--   Common / Rare / Epic            -> unlockable with XP, points, events,
--                                      roulette, surprise packages
--   Super Rare / Legendary          -> physical scratch-code redemption only

alter table public.cards drop constraint if exists cards_rarity_check;

alter table public.cards
  add constraint cards_rarity_check
  check (rarity in ('Common', 'Rare', 'Epic', 'Super Rare', 'Legendary'));

-- Champions are physical-card exclusives.
update public.cards
set rarity = 'Super Rare'
where name in ('Grand Central Dragon', 'The Maglev Empress', 'Express Phantom');
