import type { Recipe } from '../types'

/**
 * Libreria ricette (1 porzione). Una ricetta è il pasto intero: quando è
 * assegnata, sostituisce le categorie da tabella di quel pasto.
 *
 * - Pranzo: ricette raccolte dagli screenshot Instagram
 *   (@dietista.paolastavolone) — vedi claude/raccolta-ricette-menu-mensile.md.
 * - Colazione e cena: proposte composte SOLO con alimenti e grammature
 *   delle tabelle di equivalenza del piano (Settimana 1), da validare.
 *
 * L'ingrediente `scalabile` viene adattato al target CHO del pasto quando
 * la ricetta è assegnata (src/lib/recipeEngine.ts); gli altri restano
 * alle grammature indicate. Macro degli ingredienti: src/data/ingredients.ts.
 */
const pranzi: Recipe[] = [
  {
    id: 'paccheri-radicchio-bresaola',
    nome: 'Paccheri con radicchio e bresaola',
    pastoConsigliato: 'pranzo',
    porzioniBase: 1,
    ingredienti: [
      { nome: 'Paccheri', grammiBase: 80, choPer100g: 75, scalabile: true },
      { nome: 'Radicchio', grammiBase: 100 },
      { nome: 'Bresaola', grammiBase: 50 },
      { nome: 'Ricotta', grammiBase: 50 },
      { nome: 'Noci', grammiBase: 10 },
    ],
    preparazione:
      'Appassire il radicchio in padella, aggiungere la ricotta con poca acqua di cottura. ' +
      'Scolare i paccheri, mantecare nella crema, completare con bresaola, noci e pepe.',
    fonteUrl: 'https://www.instagram.com/p/Dd6Ee4ICnnD/',
    fonteNote: 'Carosello "7 primi autunnali" — @dietista.paolastavolone',
  },
  {
    id: 'ditali-zucca-ceci',
    nome: 'Ditali cremosi con zucca e ceci',
    pastoConsigliato: 'pranzo',
    porzioniBase: 1,
    ingredienti: [
      { nome: 'Ditali', grammiBase: 80, choPer100g: 75, scalabile: true },
      { nome: 'Zucca', grammiBase: 150 },
      { nome: 'Ceci', grammiBase: 100 },
      { nome: 'Salvia e rosmarino', grammiBase: 5 },
    ],
    preparazione:
      'Cuocere la zucca con salvia e rosmarino finché morbida, frullarne una parte. ' +
      'Aggiungere i ceci e mantecare i ditali nella crema di zucca.',
    fonteUrl: 'https://www.instagram.com/p/Dd6Ee4ICnnD/',
    fonteNote: 'Carosello "7 primi autunnali" — @dietista.paolastavolone',
  },
  {
    id: 'trofie-boscaiola',
    nome: 'Trofie alla boscaiola',
    pastoConsigliato: 'pranzo',
    porzioniBase: 1,
    ingredienti: [
      { nome: 'Trofie', grammiBase: 80, choPer100g: 75, scalabile: true },
      { nome: 'Funghi', grammiBase: 150 },
      { nome: 'Piselli', grammiBase: 80 },
      { nome: 'Ricotta', grammiBase: 50 },
      { nome: 'Prezzemolo', grammiBase: 5 },
    ],
    preparazione:
      'Cuocere funghi e piselli in padella, aggiungere la ricotta con poca acqua di cottura. ' +
      'Unire le trofie, mantecare bene e completare con prezzemolo fresco.',
    fonteUrl: 'https://www.instagram.com/p/Dd6Ee4ICnnD/',
    fonteNote: 'Carosello "7 primi autunnali" — @dietista.paolastavolone',
  },
  {
    id: 'conchiglie-salmone-zucca',
    nome: 'Conchiglie con salmone e zucca',
    pastoConsigliato: 'pranzo',
    porzioniBase: 1,
    ingredienti: [
      { nome: 'Conchiglie', grammiBase: 80, choPer100g: 75, scalabile: true },
      { nome: 'Zucca', grammiBase: 150 },
      { nome: 'Salmone', grammiBase: 150 },
      { nome: 'Castagne cotte', grammiBase: 30 },
      { nome: 'Salvia', grammiBase: 3 },
    ],
    preparazione:
      'Cuocere la zucca con la salvia in padella. Unire la pasta e il salmone a pezzetti, ' +
      'completare con le castagne sbriciolate.',
    fonteUrl: 'https://www.instagram.com/p/Dd6Ee4ICnnD/',
    fonteNote: 'Carosello "7 primi autunnali" — @dietista.paolastavolone',
  },
  {
    id: 'fusilli-ricotta-spinaci',
    nome: 'Fusilli cremosi con ricotta, spinaci, noci e scorza di limone',
    pastoConsigliato: 'pranzo',
    porzioniBase: 1,
    ingredienti: [
      { nome: 'Fusilli', grammiBase: 80, choPer100g: 75, scalabile: true },
      { nome: 'Spinaci', grammiBase: 150 },
      { nome: 'Ricotta', grammiBase: 100 },
      { nome: 'Noci', grammiBase: 10 },
      { nome: 'Scorza di limone', grammiBase: 2 },
    ],
    preparazione:
      'Appassire gli spinaci e frullarli con la ricotta e poca acqua di cottura. ' +
      'Condire i fusilli con la crema, completare con noci e scorza di limone.',
    fonteUrl: 'https://www.instagram.com/p/Dd6Ee4ICnnD/',
    fonteNote: 'Carosello "7 primi autunnali" — @dietista.paolastavolone',
  },
]

const PROPOSTA_PIANO = 'Proposta di Claude con alimenti e grammature del piano — da validare'

const colazioni: Recipe[] = [
  {
    id: 'porridge-avena-albume',
    nome: "Porridge d'avena con albume, frutta e cocco",
    pastoConsigliato: 'colazione',
    porzioniBase: 1,
    ingredienti: [
      { nome: "Fiocchi d'avena", grammiBase: 65, scalabile: true },
      { nome: 'Albume', grammiBase: 230 },
      { nome: 'Frutta fresca', grammiBase: 40 },
      { nome: 'Cocco grattugiato', grammiBase: 10 },
      { nome: 'Cannella', grammiBase: 1 },
    ],
    preparazione:
      "Cuoci i fiocchi d'avena in poca acqua per 3-4 minuti, poi aggiungi l'albume a fuoco basso " +
      'mescolando finché diventa cremoso. Completa con la frutta a pezzetti, il cocco e la cannella.',
    fonteNote: PROPOSTA_PIANO,
  },
  {
    id: 'pancake-avena-cioccolato',
    nome: "Pancake d'avena con cioccolato fondente e frutta",
    pastoConsigliato: 'colazione',
    porzioniBase: 1,
    ingredienti: [
      { nome: "Farina d'avena", grammiBase: 65, scalabile: true },
      { nome: 'Uovo intero', grammiBase: 50 },
      { nome: 'Albume', grammiBase: 180 },
      { nome: 'Cioccolato fondente 85%', grammiBase: 15 },
      { nome: 'Frutta fresca', grammiBase: 40 },
    ],
    preparazione:
      "Frusta farina d'avena, uovo e albume fino a una pastella liscia. Cuoci i pancake in una " +
      'padella antiaderente calda, poi completa con il cioccolato a scaglie e la frutta.',
    fonteNote: PROPOSTA_PIANO,
  },
  {
    id: 'bowl-yogurt-granola',
    nome: 'Bowl di yogurt greco con granola, noci e frutta',
    pastoConsigliato: 'colazione',
    porzioniBase: 1,
    ingredienti: [
      { nome: "Granola d'avena", grammiBase: 65, scalabile: true },
      { nome: 'Yogurt greco 0%', grammiBase: 250 },
      { nome: 'Noci', grammiBase: 15 },
      { nome: 'Frutta fresca', grammiBase: 40 },
    ],
    preparazione: 'Versa lo yogurt greco in una ciotola, aggiungi la granola, le noci spezzettate e la frutta a pezzi.',
    fonteNote: PROPOSTA_PIANO,
  },
  {
    id: 'gallette-crema-frutta-secca',
    nome: 'Gallette di riso con crema di frutta secca, marmellata e yogurt greco',
    pastoConsigliato: 'colazione',
    porzioniBase: 1,
    ingredienti: [
      { nome: 'Gallette di riso', grammiBase: 55, scalabile: true },
      { nome: 'Yogurt greco 0%', grammiBase: 250 },
      { nome: 'Burro 100% frutta secca', grammiBase: 15 },
      { nome: 'Marmellata Hero Light', grammiBase: 30 },
    ],
    preparazione:
      'Spalma sulle gallette la crema di frutta secca e la marmellata, e accompagna con lo yogurt greco.',
    fonteNote: PROPOSTA_PIANO,
  },
]

const cene: Recipe[] = [
  {
    id: 'riso-venere-merluzzo-zucchine',
    nome: 'Riso venere con merluzzo e zucchine',
    pastoConsigliato: 'cena',
    porzioniBase: 1,
    ingredienti: [
      { nome: 'Riso venere', grammiBase: 50, scalabile: true },
      { nome: 'Merluzzo', grammiBase: 280 },
      { nome: 'Zucchine', grammiBase: 200 },
      { nome: 'Scorza di limone', grammiBase: 2 },
    ],
    preparazione:
      'Cuoci il riso venere. In padella salta le zucchine a rondelle, aggiungi il merluzzo a cubetti ' +
      'con un goccio d’acqua e la scorza di limone e cuoci 5-6 minuti. Unisci il riso e servi.',
    fonteNote: PROPOSTA_PIANO,
  },
  {
    id: 'piadina-tacchino-radicchio',
    nome: 'Piadina integrale con tacchino e radicchio alla piastra',
    pastoConsigliato: 'cena',
    porzioniBase: 1,
    ingredienti: [
      { nome: 'Piadina integrale', grammiBase: 60, scalabile: true },
      { nome: 'Petto di tacchino', grammiBase: 260 },
      { nome: 'Radicchio rosso', grammiBase: 200 },
      { nome: 'Olio EVO', grammiBase: 10 },
    ],
    preparazione:
      'Cuoci il tacchino a fettine e il radicchio a spicchi sulla piastra. Scalda la piadina, ' +
      "farciscila con il tacchino e servi con il radicchio condito con l'olio a crudo.",
    fonteNote: PROPOSTA_PIANO,
  },
  {
    id: 'pollo-curry-basmati-broccoli',
    nome: 'Pollo al curry con riso basmati e broccoli',
    pastoConsigliato: 'cena',
    porzioniBase: 1,
    ingredienti: [
      { nome: 'Riso basmati', grammiBase: 50, scalabile: true },
      { nome: 'Petto di pollo', grammiBase: 260 },
      { nome: 'Broccoli o cime di rapa', grammiBase: 200 },
      { nome: 'Olio EVO', grammiBase: 10 },
      { nome: 'Curry', grammiBase: 3 },
    ],
    preparazione:
      "Cuoci il riso basmati. Rosola il pollo a bocconcini con l'olio, aggiungi il curry e un goccio " +
      "d'acqua e lascia cuocere 8-10 minuti. Servi con i broccoli al vapore.",
    fonteNote: PROPOSTA_PIANO,
  },
  {
    id: 'seppie-patate-fagiolini',
    nome: 'Seppie in umido con patate e fagiolini',
    pastoConsigliato: 'cena',
    porzioniBase: 1,
    ingredienti: [
      { nome: 'Patate', grammiBase: 220, scalabile: true },
      { nome: 'Seppie o calamari', grammiBase: 250 },
      { nome: 'Fagiolini', grammiBase: 200 },
      { nome: 'Passata di pomodoro', grammiBase: 100 },
    ],
    preparazione:
      'Cuoci le seppie a listarelle con la passata per 20 minuti, aggiungi le patate a cubetti e ' +
      'cuoci finché sono tenere. Servi con i fagiolini lessati.',
    fonteNote: PROPOSTA_PIANO,
  },
  {
    id: 'vitello-patate-dolci-valeriana',
    nome: 'Vitello alla piastra con patate dolci al forno e valeriana',
    pastoConsigliato: 'cena',
    porzioniBase: 1,
    ingredienti: [
      { nome: 'Patate dolci', grammiBase: 200, scalabile: true },
      { nome: 'Vitello magro', grammiBase: 250 },
      { nome: 'Valeriana', grammiBase: 200 },
    ],
    preparazione:
      'Cuoci le patate dolci a spicchi in forno a 200 °C per circa 30 minuti. Cuoci il vitello ' +
      'sulla piastra e servi con la valeriana.',
    fonteNote: PROPOSTA_PIANO,
  },
]

export const recipes: Recipe[] = [...colazioni, ...pranzi, ...cene]
