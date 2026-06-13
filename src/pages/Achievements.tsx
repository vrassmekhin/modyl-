import { useStore } from '../store'
import { ACHIEVEMENTS, levelFromXp } from '../lib/gamification'
import { globalStats, subjectStats, SUBJECT_META } from '../lib/selectors'
import { Ring, ProgressBar } from '../components/ui'
import { Flame, Sparkles, Medal } from 'lucide-react'

export default function Achievements() {
  const xp = useStore((s) => s.xp)
  const streak = useStore((s) => s.streak)
  const unlocked = useStore((s) => s.unlocked)
  const counters = useStore((s) => s.counters)
  const progress = useStore((s) => s.progress)
  const g = globalStats(progress)
  const lvl = levelFromXp(xp)

  const metric: Record<string, number> = {
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

  return (
    <div className="stack" style={{ gap: 20 }}>
      <h1 style={{ fontSize: 26 }}>Достижения и прогресс</h1>

      {/* Level / streak */}
      <div className="grid grid-3" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="card card-pad row" style={{ gap: 16 }}>
          <Ring value={Math.round(lvl.into * 100)} size={88} stroke={9} label={`${lvl.level}`} caption="уровень" color="var(--orange)" />
          <div>
            <h3 style={{ fontSize: 17 }}>Уровень {lvl.level}</h3>
            <p className="faint" style={{ fontSize: 13 }}>
              {lvl.cur}/{lvl.need} XP до уровня {lvl.level + 1}
            </p>
            <div className="chip chip-accent" style={{ marginTop: 8 }}>
              <Sparkles size={13} /> {xp} XP всего
            </div>
          </div>
        </div>
        <div className="card card-pad center" style={{ display: 'grid', placeItems: 'center' }}>
          <Flame size={40} color="var(--orange)" />
          <div className="stat-val" style={{ fontSize: 34 }}>{streak}</div>
          <div className="stat-label">дней подряд</div>
        </div>
        <div className="card card-pad center" style={{ display: 'grid', placeItems: 'center' }}>
          <Medal size={40} color="var(--teal-400)" />
          <div className="stat-val" style={{ fontSize: 34 }}>
            {unlocked.length}/{ACHIEVEMENTS.length}
          </div>
          <div className="stat-label">достижений открыто</div>
        </div>
      </div>

      {/* Medals: subject mastery */}
      <div className="card card-pad">
        <h3 style={{ fontSize: 16, marginBottom: 14 }}>🏅 Рейтинг освоения предметов</h3>
        <div className="grid grid-3">
          {SUBJECT_META.map((s) => {
            const st = subjectStats(s.id, progress)
            const medal = st.mastery >= 80 ? '🥇' : st.mastery >= 50 ? '🥈' : st.mastery >= 25 ? '🥉' : '🎯'
            return (
              <div key={s.id} className="def-item">
                <div className="row between">
                  <span style={{ fontWeight: 700 }}>
                    {s.icon} {s.short}
                  </span>
                  <span style={{ fontSize: 22 }}>{medal}</span>
                </div>
                <div style={{ margin: '10px 0 6px' }}>
                  <ProgressBar value={st.mastery} color={s.accent} />
                </div>
                <span className="faint" style={{ fontSize: 12 }}>{st.mastery}% освоено</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Achievements grid */}
      <div>
        <h3 style={{ fontSize: 18, marginBottom: 14 }}>Медали</h3>
        <div className="grid grid-3">
          {ACHIEVEMENTS.map((a) => {
            const has = unlocked.includes(a.id)
            const cur = Math.min(metric[a.id] ?? 0, a.goal)
            return (
              <div key={a.id} className={`ach ${has ? 'unlocked' : 'locked'}`}>
                <div className="ach-ico">{a.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="row between">
                    <span style={{ fontWeight: 700, fontSize: 14.5 }}>{a.title}</span>
                    {has && <span className="chip chip-accent" style={{ fontSize: 10 }}>✓</span>}
                  </div>
                  <p className="faint" style={{ fontSize: 12.5, margin: '2px 0 8px' }}>{a.description}</p>
                  {!has && (
                    <>
                      <ProgressBar value={(cur / a.goal) * 100} />
                      <span className="faint" style={{ fontSize: 11 }}>{cur}/{a.goal}</span>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
