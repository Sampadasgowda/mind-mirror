-- Run once in Supabase: Dashboard → SQL Editor → New query → paste → Run.

create table if not exists public.results (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  test_id     text not null check (char_length(test_id) <= 64),
  answers     text not null check (answers ~ '^[1-4]{1,200}$'),
  created_at  timestamptz not null default now()
);

create index if not exists results_user_created_idx on public.results (user_id, created_at desc);

-- Row-level security: each user can only see, add and delete their own results.
alter table public.results enable row level security;

create policy "Users read own results"
  on public.results for select
  using (auth.uid() = user_id);

create policy "Users insert own results"
  on public.results for insert
  with check (auth.uid() = user_id);

create policy "Users delete own results"
  on public.results for delete
  using (auth.uid() = user_id);
