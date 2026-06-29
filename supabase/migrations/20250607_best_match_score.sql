-- Run in Supabase SQL Editor if profiles table already exists
alter table public.profiles
  add column if not exists best_match_score integer not null default 0;

create index if not exists profiles_best_match_score_idx
  on public.profiles (best_match_score desc);
