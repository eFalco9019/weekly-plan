import { useState } from 'react'
import './App.css'
import type { ProfileId } from './types'
import { profiles } from './data/profiles'
import { ProfileSelector } from './components/ProfileSelector'
import { DayPlanner } from './components/DayPlanner'
import { WeekView } from './components/WeekView'
import { shiftWeek, toIso } from './lib/dateUtils'

function today(): string {
  return toIso(new Date())
}

type View = { mode: 'week' } | { mode: 'day'; date: string }

function App() {
  const [profile, setProfile] = useState<ProfileId | null>(null)
  const [anchorDate, setAnchorDate] = useState<string>(today())
  const [view, setView] = useState<View>({ mode: 'week' })

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

  return (
    <WeekView
      profile={profile}
      anchorDate={anchorDate}
      onNavigateWeek={(deltaWeeks) => setAnchorDate((d) => shiftWeek(d, deltaWeeks))}
      onSelectDay={(date) => setView({ mode: 'day', date })}
      onChangeProfile={() => setProfile(null)}
    />
  )
}

export default App
