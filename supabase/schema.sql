-- Trivia Dash — Supabase schema (party trivia + matchmaking + Pro)
-- Run in Supabase SQL Editor. App works offline without this.

create table if not exists public.profiles (
  id              text primary key,
  username        text not null,
  avatar_emoji    text not null default '🦊',
  avatar_color    text not null default '#7C5CFF',
  elo             integer not null default 1000,
  wins            integer not null default 0,
  losses          integer not null default 0,
  draws           integer not null default 0,
  best_streak     integer not null default 0,
  streak          integer not null default 0,
  is_pro          boolean not null default false,
  daily_streak    integer not null default 0,
  last_daily_date date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.match_queue (
  id            uuid primary key default gen_random_uuid(),
  player_id     text not null references public.profiles (id) on delete cascade,
  username      text not null,
  avatar_emoji  text not null,
  avatar_color  text not null,
  elo           integer not null default 1000,
  created_at    timestamptz not null default now()
);

create index if not exists match_queue_created_idx on public.match_queue (created_at);

create table if not exists public.active_matches (
  id              uuid primary key default gen_random_uuid(),
  player_a_id     text not null,
  player_b_id     text not null,
  player_a_name   text not null,
  player_b_name   text not null,
  player_a_avatar text,
  player_b_avatar text,
  player_a_elo    integer not null default 1000,
  player_b_elo    integer not null default 1000,
  question_seed   integer not null,
  player_a_score  integer not null default 0,
  player_b_score  integer not null default 0,
  player_a_round  integer not null default 0,
  player_b_round  integer not null default 0,
  status          text not null default 'playing' check (status in ('playing', 'finished')),
  mode            text not null default 'quick',
  created_at      timestamptz not null default now()
);

create table if not exists public.party_lobbies (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique,
  host_id        text not null references public.profiles (id) on delete cascade,
  status         text not null default 'waiting' check (status in ('waiting', 'starting', 'playing', 'done')),
  question_seed  integer not null,
  max_players    integer not null default 6,
  created_at     timestamptz not null default now()
);

create table if not exists public.party_players (
  lobby_id      uuid not null references public.party_lobbies (id) on delete cascade,
  player_id     text not null references public.profiles (id) on delete cascade,
  username      text not null,
  avatar_emoji  text not null,
  avatar_color  text not null,
  elo           integer not null default 1000,
  score         integer not null default 0,
  ready         boolean not null default false,
  joined_at     timestamptz not null default now(),
  primary key (lobby_id, player_id)
);

create table if not exists public.daily_scores (
  id          uuid primary key default gen_random_uuid(),
  player_id   text not null references public.profiles (id) on delete cascade,
  date_key    date not null,
  score       integer not null,
  created_at  timestamptz not null default now(),
  unique (player_id, date_key)
);

create or replace view public.leaderboard as
select id, username, avatar_emoji, avatar_color, elo, wins, losses, draws, is_pro
from public.profiles
order by elo desc;

alter table public.profiles enable row level security;
alter table public.match_queue enable row level security;
alter table public.active_matches enable row level security;
alter table public.party_lobbies enable row level security;
alter table public.party_players enable row level security;
alter table public.daily_scores enable row level security;

-- Open policies for guest-id clients (tighten with Supabase Auth later)
create policy "profiles read" on public.profiles for select using (true);
create policy "profiles write" on public.profiles for insert with check (true);
create policy "profiles update" on public.profiles for update using (true);

create policy "queue all" on public.match_queue for all using (true) with check (true);
create policy "matches all" on public.active_matches for all using (true) with check (true);
create policy "lobbies all" on public.party_lobbies for all using (true) with check (true);
create policy "party players all" on public.party_players for all using (true) with check (true);
create policy "daily all" on public.daily_scores for all using (true) with check (true);

create index if not exists profiles_elo_idx on public.profiles (elo desc);
create index if not exists party_code_idx on public.party_lobbies (code);

-- Enable Realtime for matchmaking tables (Dashboard -> Database -> Replication)
-- alter publication supabase_realtime add table public.match_queue;
-- alter publication supabase_realtime add table public.active_matches;
-- alter publication supabase_realtime add table public.party_lobbies;
-- alter publication supabase_realtime add table public.party_players;
