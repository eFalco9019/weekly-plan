import { useState } from 'react'
import './App.css'
import type { ProfileId } from './types'
import { profiles } from './data/profiles'
import { ProfileSelector } from './components/ProfileSelector'
import { DayPlanner } from './components/DayPlanner'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function App() {
  const [profile, setProfile] = useState<ProfileId | null>(null)
  const [date, setDate] = useState<string>(today())

  if (!profile) {
    return <ProfileSelector profiles={profiles} onSelect={setProfile} />
  }

  return (
    <DayPlanner
      profile={profile}
      date={date}
      onDateChange={setDate}
      onChangeProfile={() => setProfile(null)}
    />
  )
}

export default App
