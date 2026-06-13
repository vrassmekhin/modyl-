import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Home,
  BookOpen,
  Layers,
  ListChecks,
  GraduationCap,
  BarChart3,
  Trophy,
  Search,
  Moon,
  Sun,
  Menu,
  Flame,
  Brain,
  Sparkles,
} from 'lucide-react'
import { useStore } from '../store'
import { globalStats } from '../lib/selectors'
import { levelFromXp } from '../lib/gamification'
import { ToastHost } from './ui'

const NAV = [
  { to: '/', label: 'Главная', icon: Home, end: true },
  { to: '/subjects', label: 'Предметы', icon: BookOpen },
  { to: '/cards', label: 'Карточки', icon: Layers },
  { to: '/tests', label: 'Тесты', icon: ListChecks },
  { to: '/exam', label: 'Экзамен', icon: GraduationCap },
]
const NAV2 = [
  { to: '/analytics', label: 'Аналитика', icon: BarChart3 },
  { to: '/achievements', label: 'Достижения', icon: Trophy },
  { to: '/search', label: 'Поиск', icon: Search },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const theme = useStore((s) => s.theme)
  const toggleTheme = useStore((s) => s.toggleTheme)
  const xp = useStore((s) => s.xp)
  const streak = useStore((s) => s.streak)
  const progress = useStore((s) => s.progress)
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const lvl = levelFromXp(xp)
  const g = globalStats(progress)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  useEffect(() => {
    setOpen(false)
  }, [loc.pathname])

  return (
    <div className="app-shell">
      <div className={`scrim ${open ? 'show' : ''}`} onClick={() => setOpen(false)} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-logo">
            <Brain size={22} color="#042a26" />
          </div>
          <div>
            <div className="brand-name">МодульТренер</div>
            <div className="brand-sub">экзамен 14–16 июня</div>
          </div>
        </div>
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <n.icon size={19} />
            {n.label}
            {n.to === '/cards' && g.dueNow > 0 && <span className="nav-badge">{g.dueNow}</span>}
          </NavLink>
        ))}
        <div className="nav-section">Прогресс</div>
        {NAV2.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <n.icon size={19} />
            {n.label}
          </NavLink>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <div className="card card-pad" style={{ padding: 14 }}>
            <div className="row between" style={{ marginBottom: 8 }}>
              <span className="faint" style={{ fontSize: 12, fontWeight: 700 }}>
                Уровень {lvl.level}
              </span>
              <span className="chip chip-accent" style={{ fontSize: 11 }}>
                <Sparkles size={12} /> {xp} XP
              </span>
            </div>
            <div className="pbar">
              <span style={{ width: `${Math.round(lvl.into * 100)}%` }} />
            </div>
            <div className="faint" style={{ fontSize: 11, marginTop: 6 }}>
              {lvl.cur}/{lvl.need} до уровня {lvl.level + 1}
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="btn btn-icon hamburger" onClick={() => setOpen((o) => !o)} aria-label="Меню">
            <Menu size={20} />
          </button>
          <NavLink to="/search" className="search-input" style={{ maxWidth: 360 }}>
            <Search size={17} className="faint" />
            <span className="faint" style={{ fontSize: 14 }}>
              Поиск по терминам, билетам…
            </span>
          </NavLink>
          <div style={{ flex: 1 }} />
          <div className="streak-flame chip" title="Серия дней подряд">
            <Flame size={16} color="var(--orange)" />
            {streak}
          </div>
          <div className="xp-badge" title={`Уровень ${lvl.level}`}>
            <div className="xp-circle">{lvl.level}</div>
            <span style={{ fontWeight: 700, fontSize: 13 }} className="mono-num">
              {xp} XP
            </span>
          </div>
          <button className="btn btn-icon" onClick={toggleTheme} aria-label="Тема">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>
        <main className="content fade-in" key={loc.pathname}>
          {children}
        </main>
      </div>

      <nav className="mobile-bar">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            <n.icon size={20} />
            {n.label}
          </NavLink>
        ))}
        <NavLink to="/analytics" className={({ isActive }) => (isActive ? 'active' : '')}>
          <BarChart3 size={20} />
          Статы
        </NavLink>
      </nav>
      <ToastHost />
    </div>
  )
}
