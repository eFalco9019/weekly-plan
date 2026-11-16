import type { DayType } from '../types'

interface Props {
  value: DayType
  onChange: (t: DayType) => void
  label: string
  className?: string
}

/** Interruttore ON/OFF del giorno, come gruppo di due pulsanti premuti/non premuti. */
export function DayTypeSwitch({ value, onChange, label, className = '' }: Props) {
  return (
    <div className={`daytype-switch ${className}`} role="group" aria-label={label}>
      {(['ON', 'OFF'] as DayType[]).map((t) => (
        <button
          key={t}
          type="button"
          aria-pressed={value === t}
          className={`daytype-switch__option daytype-switch__option--${t.toLowerCase()}`}
          onClick={() => onChange(t)}
        >
          {t}
        </button>
      ))}
    </div>
  )
}
