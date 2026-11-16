import type { ReactNode } from 'react'

interface Props {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color: string
  trackColor?: string
  children?: ReactNode
}

/** Anello di progresso SVG riusabile (es. CHO effettivo/target del giorno). */
export function CircularGauge({
  value,
  max,
  size = 128,
  strokeWidth = 11,
  color,
  trackColor = 'rgba(35, 39, 31, 0.08)',
  children,
}: Props) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const pct = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0
  const dash = circumference * pct

  return (
    <div className="gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.3s ease' }}
        />
      </svg>
      <div className="gauge__content">{children}</div>
    </div>
  )
}
