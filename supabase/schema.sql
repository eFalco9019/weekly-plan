-- Schema Supabase per la plancia nutrizionale (weekly-plan).
-- Da eseguire nell'SQL editor del progetto Supabase (dashboard -> SQL editor).

create table if not exists profiles (
  id text primary key, -- 'ezio' | 'arianna'
  nome text not null,
  peso_kg numeric,
  altezza_cm numeric,
  proteine_g_fisse numeric,
  grassi_g_fissi numeric
);

create table if not exists cho_progression (
  profile_id text references profiles(id),
  week_number int not null,
  on_cho_g numeric not null,
  off_cho_g numeric not null,
  on_kcal numeric,
  off_kcal numeric,
  primary key (profile_id, week_number)
);

-- Stato ON/OFF per data specifica. Non è legato al giorno della
-- settimana: ogni data ha il proprio stato, impostato a mano in base
-- agli allenamenti reali.
create table if not exists day_log (
  profile_id text references profiles(id),
  date date not null,
  day_type text not null check (day_type in ('ON', 'OFF')),
  week_number int not null,
  primary key (profile_id, date)
);

-- Target macro "standard" di un pasto, per settimana del piano.
create table if not exists meal_template (
  week_number int not null,
  meal text not null check (meal in ('colazione', 'pranzo', 'spuntino', 'cena')),
  target_cho_on_g numeric not null,
  target_cho_off_g numeric not null,
  target_protein_g numeric,
  target_fat_g numeric,
  primary key (week_number, meal)
);

-- Tabelle di equivalenza: alimenti intercambiabili per pasto/categoria.
create table if not exists food_equivalents (
  id bigint generated always as identity primary key,
  meal text not null check (meal in ('colazione', 'pranzo', 'spuntino', 'cena')),
  categoria text not null check (categoria in ('carboidrati', 'proteine', 'grassi', 'frutta', 'verdura')),
  alimento text not null,
  grammi_on numeric not null,
  grammi_off numeric not null,
  cho_per_100g numeric,
  note text
);

-- La scelta effettiva (editabile) di un profilo per un pasto in una data.
-- Qui agisce il motore di compensazione macro lato client.
create table if not exists day_meal_choices (
  profile_id text references profiles(id),
  date date not null,
  meal text not null check (meal in ('colazione', 'pranzo', 'spuntino', 'cena')),
  categoria text not null,
  alimento text not null,
  grammi numeric not null,
  bloccato boolean default false,
  updated_at timestamptz default now(),
  primary key (profile_id, date, meal, categoria)
);

-- Realtime: abilitare la pubblicazione su day_log e day_meal_choices
-- dal dashboard Supabase (Database -> Replication) così le modifiche di
-- un profilo si vedono in tempo reale sui dispositivi dell'altro.

alter table profiles enable row level security;
alter table cho_progression enable row level security;
alter table day_log enable row level security;
alter table meal_template enable row level security;
alter table food_equivalents enable row level security;
alter table day_meal_choices enable row level security;

-- Nessun login reale (solo selettore profilo in UI): la app usa la
-- chiave "anon" di Supabase, quindi serve una policy permissiva per
-- lettura/scrittura. È un tool di famiglia privato: il link dell'app è
-- pubblico ma non indicizzato, e il rischio accettato è che chiunque
-- abbia l'URL potrebbe leggere/scrivere questi dati.
create policy "public read/write" on profiles for all using (true) with check (true);
create policy "public read/write" on cho_progression for all using (true) with check (true);
create policy "public read/write" on day_log for all using (true) with check (true);
create policy "public read/write" on meal_template for all using (true) with check (true);
create policy "public read/write" on food_equivalents for all using (true) with check (true);
create policy "public read/write" on day_meal_choices for all using (true) with check (true);
