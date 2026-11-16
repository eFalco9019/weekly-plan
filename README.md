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

## Collegare Supabase (sync condiviso tra Ezio e Arianna)

1. Crea un progetto gratuito su [supabase.com](https://supabase.com).
2. Nel progetto, apri **SQL editor** e incolla il contenuto di
   `supabase/schema.sql`, poi esegui.
3. In **Database → Replication**, abilita la pubblicazione realtime per
   le tabelle `day_log` e `day_meal_choices` (così le modifiche di un
   profilo si vedono in tempo reale sull'altro dispositivo).
4. In **Project settings → API**, copia `Project URL` e `anon public key`.
5. Copia `.env.example` in `.env.local` e incolla i due valori:
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
6. Per il deploy automatico, aggiungi le stesse due variabili come
   **secrets** del repository GitHub (Settings → Secrets and variables →
   Actions → New repository secret): `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY`.

> Nota: lo schema usa policy di lettura/scrittura pubbliche (nessun
> login reale, solo selettore profilo in UI, come richiesto). Il link
> dell'app sarà pubblico ma non indicizzato: chiunque abbia l'URL può
> leggere/scrivere i dati. Accettabile per un tool di famiglia privato;
> da rivedere se in futuro servisse più riservatezza.

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
  hooks/
    useDayPlan.ts        stato di una giornata (profilo+data): scelte, grammature, ribilanciamento
  components/
    ProfileSelector, DayPlanner, MealSection, DayTotals
supabase/
  schema.sql            schema Postgres da eseguire su Supabase
```

## Stato e prossimi passi

- [x] Scaffolding + motore di compensazione macro (funziona su dati locali)
- [x] Dati Settimana 1 completi (Ary)
- [ ] Settimane 2-4 (stessa logica, grammature diverse — in attesa dei dati)
- [ ] Macro fissi di Ezio (in attesa)
- [ ] Collegare Supabase per la sync reale tra profili/dispositivi (oggi: solo localStorage)
- [ ] Lista della spesa generata dal piano della settimana
