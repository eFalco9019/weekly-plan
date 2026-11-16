import { useEffect, useState } from 'react'
import { getSyncStatus, onSyncStatus, type SyncStatus } from '../lib/sync'

const labels: Record<SyncStatus, string> = {
  locale: 'Salvato solo su questo dispositivo',
  connessione: 'Sincronizzazione in corso…',
  sincronizzato: 'Sincronizzato',
  offline: 'Offline: le modifiche partono appena torna la rete',
}

/** Stato della sincronizzazione con il database condiviso. */
export function SyncBadge() {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus())
  useEffect(() => onSyncStatus(setStatus), [])
  return (
    <span className={`sync-badge sync-badge--${status}`} role="status">
      <i aria-hidden="true" />
      {labels[status]}
    </span>
  )
}
