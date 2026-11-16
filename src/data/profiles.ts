import type { ChoProgressionWeek, Profile } from '../types'

// Dati confermati finora. Quelli di "ezio" sono segnaposto: Ezio non ha
// ancora mandato il suo piano macro — vanno aggiornati appena arriva.
export const profiles: Profile[] = [
  {
    id: 'arianna',
    nome: 'Arianna',
    pesoKg: 60,
    altezzaCm: 174,
    proteineGFisse: 120,
    grassiGFissi: 48,
  },
  {
    id: 'ezio',
    nome: 'Ezio',
    pesoKg: 0, // TODO: da compilare
    altezzaCm: 0, // TODO: da compilare
    proteineGFisse: 0, // TODO: da compilare
    grassiGFissi: 0, // TODO: da compilare
  },
]

export const choProgression: ChoProgressionWeek[] = [
  { profile: 'arianna', week: 1, onChoG: 190, offChoG: 150, onKcal: 1672, offKcal: 1512 },
  { profile: 'arianna', week: 2, onChoG: 200, offChoG: 160, onKcal: 1712, offKcal: 1552 },
  { profile: 'arianna', week: 3, onChoG: 210, offChoG: 170, onKcal: 1752, offKcal: 1592 },
  { profile: 'arianna', week: 4, onChoG: 220, offChoG: 180, onKcal: 1792, offKcal: 1632 },
]
