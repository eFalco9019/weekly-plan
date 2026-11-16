import type { ReactNode } from 'react'

export interface RingSegment {
  key: string
  value: number
  color: string
  /** Emoji/simbolo mostrato in un badge all'inizio del segmento. */
  icon?: string
}

interface Props {
  segments: RingSegment[]
  /** Valore che corrisponde all'anello pieno (es. target giornaliero).
   * Se la somma dei segmenti lo supera, i segmenti vengono riproporzionati
   * sull'anello intero. */
  total: number
  label: string
  children?: ReactNode
}

const SIZE = 120
const STROKE = 15
const RADIUS = (SIZE - STROKE) / 2 - 4 // margine per i badge che sporgono
const CIRC = 2 * Math.PI * RADIUS
const GAP = 7 // spazio vuoto tra due segmenti, oltre ai cappucci arrotondati
const BADGE_R = STROKE / 2 + 4
const C = SIZE / 2

/** Anello diviso in segmenti arrotondati, uno per pasto, con un badge
 * icona all'inizio di ciascuno: mostra come un macro si distribuisce
 * nella giornata. */
export function SegmentedRing({ segments, total, label, children }: Props) {
  const sum = segments.reduce((acc, s) => acc + Math.max(0, s.value), 0)
  const scale = Math.max(total, sum, 1)
  const visible = segments.filter((s) => s.value > 0)
  const fullRing = sum >= scale - 0.01

  let cursor = 0
  const arcs = visible.map((s) => {
    const length = (s.value / scale) * CIRC
    // Con i cappucci arrotondati il tratto sporge di STROKE/2 per lato:
    // si accorcia il dash per lasciare il gap. Un valore piccolo diventa
    // un cerchio pieno (dash ~0), come i segmenti corti del riferimento.
    const gap = visible.length > 1 || !fullRing ? GAP : 0
    const dash = Math.max(0.01, length - STROKE - gap)
    const start = cursor + STROKE / 2 + gap / 2
    cursor += length
    const angle = (start / CIRC) * 2 * Math.PI - Math.PI / 2
    return {
      ...s,
      dash,
      start,
      badgeX: C + RADIUS * Math.cos(angle),
      badgeY: C + RADIUS * Math.sin(angle),
    }
  })

  return (
    <div className="ring" role="img" aria-label={label}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
        <circle className="ring__track" cx={C} cy={C} r={RADIUS} fill="none" strokeWidth={STROKE} />
        <g transform={`rotate(-90 ${C} ${C})`}>
          {arcs.map((a) => (
            <circle
              key={a.key}
              cx={C}
              cy={C}
              r={RADIUS}
              fill="none"
              stroke={a.color}
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${a.dash} ${CIRC}`}
              strokeDashoffset={-a.start}
              className="ring__segment"
            />
          ))}
        </g>
        {arcs
          .filter((a) => a.icon)
          .map((a) => (
            <g key={`${a.key}-badge`} className="ring__badge">
              <circle cx={a.badgeX} cy={a.badgeY} r={BADGE_R} fill={a.color} />
              <text x={a.badgeX} y={a.badgeY} textAnchor="middle" dominantBaseline="central" fontSize={11.5}>
                {a.icon}
              </text>
            </g>
          ))}
      </svg>
      <div className="ring__content">{children}</div>
    </div>
  )
}
