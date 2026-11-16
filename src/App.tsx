import { useEffect, useState } from 'react'
import './App.css'
import type { ProfileId } from './types'
import { profiles } from './data/profiles'
import { ProfileSelector } from './components/ProfileSelector'
import { DayPlanner } from './components/DayPlanner'
import { WeekView } from './components/WeekView'
import { ShoppingList } from './components/ShoppingList'
import { shiftWeek, toIso } from './lib/dateUtils'
import { startSync } from './lib/sync'

function today(): string {
  return toIso(new Date())
}

type View = { mode: 'week' } | { mode: 'day'; date: string } | { mode: 'shopping' }

function App() {
  const [profile, setProfile] = useState<ProfileId | null>(null)
  const [anchorDate, setAnchorDate] = useState<string>(today())
  const [view, setView] = useState<View>({ mode: 'week' })

  // Sincronizzazione con Supabase per tutta la vita dell'app (se collegato).
  useEffect(() => startSync(), [])

  if (!profile) {
    return <ProfileSelector profiles={profiles} onSelect={setProfile} />
  }

  if (view.mode === 'day') {
    return (
      <DayPlanner
        profile={profile}
        date={view.date}
        onDateChange={(d) => setView({ mode: 'day', date: d })}
        onBackToWeek={() => {
          setAnchorDate(view.date)
          setView({ mode: 'week' })
        }}
      />
    )
  }

  if (view.mode === 'shopping') {
    return <ShoppingList anchorDate={anchorDate} onBack={() => setView({ mode: 'week' })} />
  }

  return (
    <WeekView
      profile={profile}
      anchorDate={anchorDate}
      onNavigateWeek={(deltaWeeks) => setAnchorDate((d) => shiftWeek(d, deltaWeeks))}
      onSelectDay={(date) => setView({ mode: 'day', date })}
      onChangeProfile={() => setProfile(null)}
      onOpenShoppingList={() => setView({ mode: 'shopping' })}
    />
  )
}

export default App
