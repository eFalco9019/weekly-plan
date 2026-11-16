-- Minimo privilegio sulla tabella day_plans.
-- Supabase concede di default ai ruoli anon/authenticated tutti i permessi
-- sulle tabelle nuove dello schema public, compresi DELETE e TRUNCATE.
-- DELETE è già bloccato dalla RLS (nessuna policy di cancellazione), ma
-- TRUNCATE non passa dalla RLS: si tolgono entrambi, insieme a REFERENCES
-- e TRIGGER, lasciando solo ciò che l'app usa.

revoke all on table public.day_plans from anon, authenticated;
grant select, insert, update on table public.day_plans to anon, authenticated;
