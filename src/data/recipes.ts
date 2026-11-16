import type { Recipe } from '../types'

/**
 * Libreria ricette. Le prime 5 sono le ricette raccolte dagli screenshot
 * Instagram (@dietista.paolastavolone / Arianna Pagliarani) — vedi
 * claude/raccolta-ricette-menu-mensile.md nel project doc.
 *
 * Le grammature qui sono quelle originali della ricetta (per 1 persona),
 * NON ancora adattate al target CHO del piano: l'adattamento avviene
 * quando la ricetta viene assegnata a un pasto (vedi
 * src/lib/recipeEngine.ts).
 */
export const recipes: Recipe[] = [
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
