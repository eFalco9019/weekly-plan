-- Fase 1 (test con il piano di Arianna): sincronizzazione dei giorni tra
-- dispositivi. Una riga per profilo e data, con lo stesso contenuto che
-- l'app salva in locale (StoredDayPlan in src/hooks/useDayPlan.ts):
-- settimana del ciclo, ON/OFF, scelte dei pasti (JSON) e nota.
--
-- Applicata in automatico dall'integrazione GitHub di Supabase al push su
-- main (serve "Deploy to production" attivo), oppure a mano incollandola
-- nell'SQL editor del progetto.

create table if not exists public.day_plans (
  profile_id text not null check (profile_id in ('ezio', 'arianna')),
  date date not null,
  week smallint not null default 1 check (week between 1 and 4),
  day_type text not null default 'ON' check (day_type in ('ON', 'OFF')),
  state jsonb not null,
  note text not null default '',
  -- Ora della modifica sul dispositivo che l'ha fatta: vince la più recente.
  updated_at timestamptz not null default now(),
  -- Dispositivo che ha scritto la riga: l'app ignora l'eco delle proprie modifiche.
  updated_by text,
  primary key (profile_id, date)
);

comment on table public.day_plans is
  'Giorni del piano per profilo: ON/OFF, settimana, scelte dei pasti (JSON) e nota. Sincronizzati tra dispositivi.';

-- Accesso: l'app non ha ancora un login (selettore profilo, come deciso
-- per l'uso in famiglia). La chiave pubblica del progetto può quindi
-- leggere e scrivere queste righe, ma non cancellarle. Da sostituire con
-- policy per utente quando arriva il login (fase 2 della roadmap).
alter table public.day_plans enable row level security;

grant select, insert, update on public.day_plans to anon, authenticated;

drop policy if exists "day_plans lettura" on public.day_plans;
create policy "day_plans lettura" on public.day_plans
  for select to anon, authenticated using (true);

drop policy if exists "day_plans inserimento" on public.day_plans;
create policy "day_plans inserimento" on public.day_plans
  for insert to anon, authenticated with check (true);

drop policy if exists "day_plans modifica" on public.day_plans;
create policy "day_plans modifica" on public.day_plans
  for update to anon, authenticated using (true) with check (true);

-- Aggiornamenti in tempo reale verso gli altri dispositivi.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'day_plans'
     ) then
    alter publication supabase_realtime add table public.day_plans;
  end if;
end $$;
