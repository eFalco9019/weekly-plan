-- Un account per persona: ognuno vede e modifica solo il proprio piano e i
-- propri giorni (RLS su auth.uid()). Sostituisce il selettore Ezio/Arianna e
-- la tabella condivisa day_plans, i cui giorni si importano una volta nel
-- proprio account con claim_legacy_profile().

-- Profilo: nome e piano (fabbisogni ON/OFF, quote dei pasti: Piano in src/data/piano.ts).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '' check (char_length(nome) <= 60),
  piano jsonb not null check (jsonb_typeof(piano) = 'object'),
  -- Vecchio profilo del selettore importato in questo account (una volta sola).
  legacy_profile text unique check (legacy_profile in ('ezio', 'arianna')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated;
-- legacy_profile si scrive solo dalla funzione di importazione.
grant select on table public.profiles to authenticated;
grant insert (id, nome, piano, updated_at), update (nome, piano, updated_at) on table public.profiles to authenticated;

create policy "profiles: lettura del proprio" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles: creazione del proprio" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles: modifica del proprio" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Giorni: stesso contenuto della copia locale dell'app (StoredDayPlan).
create table public.days (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  week smallint not null default 1 check (week between 1 and 12),
  day_type text not null default 'ON' check (day_type in ('ON', 'OFF')),
  state jsonb not null,
  note text not null default '' check (char_length(note) <= 500),
  updated_at timestamptz not null default now(),
  -- Dispositivo che ha scritto la riga: l'app ignora l'eco delle proprie modifiche.
  updated_by text,
  primary key (user_id, date)
);

alter table public.days enable row level security;
revoke all on table public.days from anon, authenticated;
grant select, insert, update, delete on table public.days to authenticated;

create policy "days: lettura dei propri" on public.days
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "days: inserimento dei propri" on public.days
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "days: modifica dei propri" on public.days
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "days: cancellazione dei propri" on public.days
  for delete to authenticated using ((select auth.uid()) = user_id);

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.days;
  end if;
end $$;

-- Vecchi profili non ancora importati (per proporre l'importazione al primo accesso).
create function public.legacy_profiles_available()
returns text[]
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(array_agg(p order by p), '{}')
  from unnest(array['arianna', 'ezio']) as p
  where now() < timestamptz '2027-01-01'
    and not exists (select 1 from public.profiles where legacy_profile = p)
    and exists (select 1 from public.day_plans where profile_id = p);
$$;

-- Importa nel proprio account i giorni di un vecchio profilo. Una volta sola
-- per profilo e per account, e solo fino a fine 2026.
create function public.claim_legacy_profile(p text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  n integer;
begin
  if uid is null then
    raise exception 'Accesso richiesto';
  end if;
  if p not in ('ezio', 'arianna') or now() >= timestamptz '2027-01-01' then
    raise exception 'Importazione non disponibile';
  end if;
  update public.profiles set legacy_profile = p where id = uid and legacy_profile is null;
  if not found then
    raise exception 'Crea prima il profilo, oppure hai già importato dei giorni';
  end if;
  insert into public.days (user_id, date, week, day_type, state, note, updated_at, updated_by)
  select uid, d.date, d.week, d.day_type, d.state, d.note, d.updated_at, d.updated_by
  from public.day_plans d
  where d.profile_id = p
  on conflict (user_id, date) do nothing;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke execute on function public.legacy_profiles_available() from public, anon;
revoke execute on function public.claim_legacy_profile(text) from public, anon;
grant execute on function public.legacy_profiles_available() to authenticated;
grant execute on function public.claim_legacy_profile(text) to authenticated;

-- La vecchia tabella condivisa non è più accessibile dall'app: resta solo
-- come fonte dell'importazione.
revoke all on table public.day_plans from anon, authenticated;
