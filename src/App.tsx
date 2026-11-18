import { useEffect, useState } from 'react'
import './App.css'
import { useSession, useProfile, type Session } from './lib/account'
import { startSync } from './lib/sync'
import { shiftWeek, toIso } from './lib/dateUtils'
import { Login } from './components/Login'
import { Welcome } from './components/Welcome'
import { PlanSettings } from './components/PlanSettings'
import { DayPlanner } from './components/DayPlanner'
import { WeekView } from './components/WeekView'
import { ShoppingList } from './components/ShoppingList'

type View = { mode: 'week' } | { mode: 'day'; date: string } | { mode: 'shopping' } | { mode: 'plan' }

const Loading = () => <p className="loading">Caricamento…</p>

export default function App() {
  const session = useSession()
  if (session === undefined) return <Loading />
  if (!session) return <Login />
  // key: cambiando account si riparte da zero (stato, sincronizzazione).
  return <Account key={session.userId} session={session} />
}

function Account({ session }: { session: NonNullable<Session> }) {
  const { profile, save, create } = useProfile(session.userId)
  const [anchorDate, setAnchorDate] = useState(() => toIso(new Date()))
  const [view, setView] = useState<View>({ mode: 'week' })

  useEffect(() => startSync(session.userId), [session.userId])

  if (profile === undefined) return <Loading />
  if (profile === null) return <Welcome onSave={create} />

  const toWeek = () => setView({ mode: 'week' })
  const { piano, nome } = profile

  switch (view.mode) {
    case 'plan':
      return <PlanSettings profile={profile} email={session.email} onSave={save} onBack={toWeek} />
    case 'shopping':
      return <ShoppingList piano={piano} anchorDate={anchorDate} onBack={toWeek} />
    case 'day':
      return (
        <DayPlanner
          piano={piano}
          nome={nome}
          date={view.date}
          onDateChange={(date) => setView({ mode: 'day', date })}
          onBackToWeek={() => {
            setAnchorDate(view.date)
            toWeek()
          }}
        />
      )
    default:
      return (
        <WeekView
          piano={piano}
          nome={nome}
          anchorDate={anchorDate}
          onNavigateWeek={(delta) => setAnchorDate((d) => shiftWeek(d, delta))}
          onSelectDay={(date) => setView({ mode: 'day', date })}
          onOpenPlan={() => setView({ mode: 'plan' })}
          onOpenShoppingList={() => setView({ mode: 'shopping' })}
        />
      )
  }
}
