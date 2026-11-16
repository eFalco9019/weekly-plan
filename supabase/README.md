# Database (Supabase)

- `migrations/`: schema del database, in ordine di data. L'integrazione GitHub di
  Supabase li applica al progetto di produzione a ogni push su `main`
  (opzione "Deploy to production" attiva).
- `config.toml`: configurazione della Supabase CLI.

Non modificare una migrazione già applicata: per cambiare lo schema se ne crea una
nuova (`npx supabase migration new <nome>`).
