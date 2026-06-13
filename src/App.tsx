import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { useStore } from './store'
import { ACHIEVEMENTS } from './lib/gamification'
import { globalStats } from './lib/selectors'
import { toast } from './components/ui'
import Home from './pages/Home'
import Subjects from './pages/Subjects'
import SubjectPage from './pages/SubjectPage'
import TicketPage from './pages/TicketPage'
import Cards from './pages/Cards'
import Tests from './pages/Tests'
import Exam from './pages/Exam'
import Analytics from './pages/Analytics'
import Achievements from './pages/Achievements'
import SearchPage from './pages/SearchPage'

function useAchievementWatcher() {
  const progress = useStore((s) => s.progress)
  const counters = useStore((s) => s.counters)
  const xp = useStore((s) => s.xp)
  const streak = useStore((s) => s.streak)
  const unlocked = useStore((s) => s.unlocked)
  const unlock = useStore((s) => s.unlock)

  useEffect(() => {
    const g = globalStats(progress)
    const metrics: Record<string, number> = {
      'study-1': g.studied,
      'study-10': g.studied,
      'study-30': g.studied,
      'study-50': g.studied,
      'study-100': g.studied,
      'perfect-20': counters.perfectRecalls,
      'cards-100': counters.cardsViewed,
      'tests-20': counters.testsTaken,
      'streak-3': streak,
      'exam-5': counters.examAttempts,
      'mastered-10': g.mastered,
      'xp-1000': xp,
    }
    for (const a of ACHIEVEMENTS) {
      if (!unlocked.includes(a.id) && (metrics[a.id] ?? 0) >= a.goal) {
        unlock(a.id)
        toast(a.icon, `Достижение: ${a.title}!`)
      }
    }
  }, [progress, counters, xp, streak, unlocked, unlock])
}

export default function App() {
  useAchievementWatcher()
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/subject/:id" element={<SubjectPage />} />
        <Route path="/ticket/:id" element={<TicketPage />} />
        <Route path="/cards" element={<Cards />} />
        <Route path="/cards/:subject" element={<Cards />} />
        <Route path="/tests" element={<Tests />} />
        <Route path="/exam" element={<Exam />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </Layout>
  )
}
