# weekly-plan — plancia nutrizionale

App React/Vite per consultare e gestire il piano nutrizionale settimanale
(Ezio + Arianna), con giorni ON/OFF impostabili per data specifica e
grammature che si riequilibrano in automatico tra i pasti.

## Stack

- **Frontend:** Vite + React + TypeScript
- **Dati condivisi / sync:** Supabase (Postgres + realtime) — da collegare
- **Hosting:** GitHub Pages, deploy automatico via GitHub Actions a ogni push su `main`
- **Profili:** nessun login — selettore Ezio/Arianna, dati taggati per profilo

## Sviluppo locale

```bash
npm install
npm run dev
```

Senza le variabili Supabase (vedi sotto) l'app funziona comunque: lo stato
di ogni giornata viene salvato in `localStorage` del browser invece che
nel database condiviso. Utile per sviluppare la UI, ma non sincronizza
tra dispositivi/persone finché Supabase non è collegato.

## Collegare Supabase (sync condiviso tra dispositivi)

Lo schema del database vive in `supabase/migrations/` (cartella standard
della Supabase CLI, con `supabase/config.toml`).

1. **Schema.** Con l'integrazione GitHub di Supabase (dashboard →
   Project Settings → Integrations → GitHub) e l'opzione **Deploy to
   production** attiva, le migrazioni vengono applicate al push su `main`.
   In alternativa: SQL editor del progetto → incolla
   `supabase/migrations/20261116142247_init_day_plans.sql` → Run.
2. **Chiavi per l'app.** URL del progetto e chiave **publishable**
   (`sb_publishable_...`) sono in `.env.production`, letto dalla build. La
   chiave publishable è fatta per stare nel codice del frontend: i dati sono
   protetti dalle regole di accesso (RLS) e dai permessi della tabella. Non
   mettere mai lì una chiave secret / service_role.
3. In sviluppo locale `npm run dev` usa `.env.local` (stesse due variabili) se vuoi collegarti.

Come funziona la sincronizzazione (`src/lib/sync.ts`):

- la copia locale (localStorage) resta quella su cui l'app lavora, anche offline;
- ogni modifica a un giorno va in coda e parte in background verso la
  tabella `day_plans`; al primo avvio si caricano anche i giorni salvati
  sul dispositivo prima del collegamento;
- le modifiche degli altri dispositivi arrivano in tempo reale; tra due
  versioni dello stesso giorno vince la più recente;
- in alto nella vista settimanale un indicatore mostra lo stato
  (sincronizzato, offline, solo su questo dispositivo).

> Nota: non c'è ancora un login (selettore profilo, uso in famiglia): la
> chiave pubblica può leggere, inserire e modificare `day_plans`, non
> cancellare né svuotare la tabella.
> Chiunque abbia URL e chiave dell'app potrebbe leggere i giorni del piano.
> Il login per utente è previsto nella fase con la nutrizionista.

## Pubblicare su GitHub Pages

1. Nel repo GitHub: **Settings → Pages → Source** → "GitHub Actions".
2. Push su `main` → il workflow `.github/workflows/deploy.yml` builda e
   pubblica automaticamente su `https://eFalco9019.github.io/weekly-plan/`.

## Struttura

```
src/
  types.ts              modello dati condiviso (profili, pasti, alimenti, ...)
  data/
    profiles.ts         profili + progressione CHO settimanale
    week1.ts             piano + tabelle di equivalenza Settimana 1
  lib/
    foodEquivalents.ts  deriva la densità di CHO di ogni alimento dal target del pasto
    macroEngine.ts       motore di compensazione: redistribuisce i CHO tra i pasti
    supabaseClient.ts    client Supabase (opzionale, serve .env)
    planStore.ts         copia locale dei giorni (localStorage)
    sync.ts              sincronizzazione con la tabella day_plans
  hooks/
    useDayPlan.ts        stato di una giornata (profilo+data): scelte, grammature, ribilanciamento
  components/
    ProfileSelector, DayPlanner, MealSection, DayTotals
supabase/
  config.toml           configurazione Supabase CLI / integrazione GitHub
  migrations/           schema del database (applicato al push su main)
```

## Stato e prossimi passi

- [x] Scaffolding + motore di compensazione macro (funziona su dati locali)
- [x] Dati Settimana 1 completi (Ary)
- [ ] Settimane 2-4 (stessa logica, grammature diverse — in attesa dei dati)
- [ ] Macro fissi di Ezio (in attesa)
- [ ] Collegare Supabase per la sync reale tra profili/dispositivi (oggi: solo localStorage)
- [ ] Lista della spesa generata dal piano della settimana
