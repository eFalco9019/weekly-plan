# weekly-plan — plancia nutrizionale

App per organizzare il proprio menu settimanale a ciclo di carboidrati
(giorni ON di allenamento, OFF di recupero). Ogni persona ha il suo account,
imposta i fabbisogni indicati dal suo professionista e l'app calcola le
grammature dei pasti, con varietà tra i giorni, compensazione tra i pasti e
lista della spesa.

Live: https://efalco9019.github.io/weekly-plan/

## Stack

- **Frontend:** Vite + React + TypeScript, pubblicato su GitHub Pages a ogni push su `main`.
- **Backend:** Supabase (login con email e password, Postgres con RLS, realtime).
- **Test:** Vitest (`npm test`).

## Come funziona

- **Il mio piano** (`src/data/piano.ts`): carboidrati del giorno ON e OFF con
  progressione settimanale, carboidrati fissi dello spuntino, proteine e
  grassi del giorno, quote per pasto. È l'unico dato che l'utente imposta.
- **Template** (`src/data/template.ts`): le tabelle di equivalenza della
  dietista di Arianna, il modello di tutti i piani. Le grammature si scalano
  sui target del piano: carboidrati = target del pasto / densità, proteine
  in proporzione alle proteine del pasto, grassi ai grassi del giorno,
  spuntino ai suoi carboidrati; verdura e frutta fisse. Con il piano di
  riferimento restano esattamente quelle della dietista.
- **Giorni** (`src/hooks/useDayPlan.ts`): menu proposto per data con
  rotazione degli alimenti e ricette (`src/lib/rotation.ts`), compensazione
  dei carboidrati tra i pasti (`src/lib/macroEngine.ts`), ricette adattate al
  target (`src/lib/recipeEngine.ts`).
- **Dati** (`src/lib/planStore.ts`, `src/lib/sync.ts`): l'app lavora sulla
  copia locale, anche offline; la coda di modifiche va alla tabella `days`,
  le modifiche degli altri dispositivi arrivano in tempo reale, vince la
  versione più recente.

## Sviluppo

```bash
npm install
npm run dev     # senza variabili Supabase: un utente locale, dati nel browser
npm test
npm run build
```

`.env.production` contiene URL e chiave **publishable** del progetto Supabase
(fatta per stare nel frontend: i dati sono protetti dalla RLS). Non mettere mai
nel repo una chiave secret / service_role.

## Database

Le migrazioni in `supabase/migrations/` vengono applicate dall'integrazione
GitHub di Supabase al push su `main`. Tabelle:

- `profiles`: nome e piano di ogni account;
- `days`: i giorni (ON/OFF, settimana, scelte dei pasti, nota);
- `day_plans`: i giorni del vecchio selettore Ezio/Arianna, chiusi all'app;
  al primo accesso si importano nel proprio account (fino a fine 2026).

Ognuno legge e scrive solo le proprie righe (`auth.uid()`).

## Struttura

```
src/
  App.tsx               accesso, primo accesso, viste
  data/                 piano, template, ricette, archivio ingredienti, alimenti composti
  hooks/useDayPlan.ts   giorni: menu proposto, compensazione, ricette
  lib/                  account, sync, copia locale, motori, formati
  components/           Login, Welcome, PlanSettings, WeekView, DayPlanner, ShoppingList…
  test/                 test del piano e della sincronizzazione
```
