import { Link, useNavigate } from 'react-router-dom'
import { Play, Clock, Target, Brain, AlertTriangle, CheckCircle2, Layers, Calendar } from 'lucide-react'
import { useStore } from '../store'
import { globalStats, subjectStats, upcomingReviews, dueTickets, SUBJECT_META } from '../lib/selectors'
import { Ring, StatTile, ProgressBar, progressColor } from '../components/ui'
import { relativeDue } from '../lib/srs'

export default function Home() {
  const nav = useNavigate()
  const progress = useStore((s) => s.progress)
  const dailyGoal = useStore((s) => s.dailyGoal)
  const activity = useStore((s) => s.activity)
  const g = globalStats(progress)
  const today = new Date().toISOString().slice(0, 10)
  const todayStudied = (activity[today]?.studied || 0) + (activity[today]?.reviewed || 0)
  const reviews = upcomingReviews(progress, 5)
  const due = dueTickets(progress)

  const hour = new Date().getHours()
  const greeting = hour < 6 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер'

  function startPrep() {
    if (due.length) nav(`/ticket/${due[0].id}`)
    else nav('/subjects')
  }

  return (
    <div className="stack" style={{ gap: 22 }}>
      {/* Hero */}
      <section className="hero">
        <div className="row between wrap" style={{ gap: 24, position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 560 }}>
            <div className="chip chip-accent" style={{ marginBottom: 14 }}>
              <Calendar size={13} /> Экзамен после 16 июня · 3 дня на подготовку
            </div>
            <h1 className="hero-title">
              {greeting}! Готовимся <span className="gradient-text">запоминать, а не читать</span>
            </h1>
            <p className="muted" style={{ marginTop: 12, fontSize: 16 }}>
              Психология, социология и экономическая теория — 124 билета через интервальное повторение, активное
              вспоминание и тесты.
            </p>
            <div className="row wrap" style={{ marginTop: 22, gap: 12 }}>
              <button className="btn btn-primary btn-lg" onClick={startPrep}>
                <Play size={20} /> Начать подготовку
              </button>
              <Link to="/cards" className="btn btn-lg">
                <Layers size={18} /> Карточки {g.dueNow > 0 && `(${g.dueNow})`}
              </Link>
            </div>
          </div>
          <Ring value={g.readiness} size={168} stroke={14} caption="готовность" />
        </div>
      </section>

      {/* Stat tiles */}
      <div className="grid grid-4">
        <StatTile icon={<Brain size={20} />} value={`${g.studied}/${g.total}`} label="Изучено билетов" color="var(--teal-400)" />
        <StatTile icon={<Clock size={20} />} value={g.inProgress} label="Билетов в работе" color="var(--orange)" />
        <StatTile icon={<AlertTriangle size={20} />} value={g.problem} label="Проблемных билетов" color="var(--red)" />
        <StatTile icon={<CheckCircle2 size={20} />} value={g.mastered} label="Освоено билетов" color="var(--green)" />
      </div>

      <div className="grid grid-3" style={{ gridTemplateColumns: '1.3fr 1fr' }}>
        {/* Daily goal */}
        <div className="card card-pad">
          <div className="row between">
            <div className="row" style={{ gap: 10 }}>
              <div className="stat-ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                <Target size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: 17 }}>Ежедневная цель</h3>
                <span className="faint" style={{ fontSize: 13 }}>
                  {Math.min(todayStudied, dailyGoal)} из {dailyGoal} билетов сегодня
                </span>
              </div>
            </div>
            <span className="stat-val" style={{ fontSize: 24, color: progressColor((todayStudied / dailyGoal) * 100) }}>
              {Math.round(Math.min(100, (todayStudied / dailyGoal) * 100))}%
            </span>
          </div>
          <div style={{ marginTop: 16 }}>
            <ProgressBar value={(todayStudied / dailyGoal) * 100} />
          </div>
          {todayStudied >= dailyGoal ? (
            <div className="chip tag-mastered" style={{ marginTop: 14 }}>
              <CheckCircle2 size={14} /> Цель на сегодня выполнена! 🎉
            </div>
          ) : (
            <button className="btn btn-block" style={{ marginTop: 14 }} onClick={startPrep}>
              Продолжить — осталось {dailyGoal - todayStudied}
            </button>
          )}
          <DailyGoalEditor />
        </div>

        {/* Upcoming reviews */}
        <div className="card card-pad">
          <div className="row between" style={{ marginBottom: 4 }}>
            <h3 style={{ fontSize: 17 }}>Ближайшие повторения</h3>
            {g.dueNow > 0 && <span className="chip tag-review">{g.dueNow} сейчас</span>}
          </div>
          <div className="stack" style={{ gap: 8, marginTop: 12 }}>
            {reviews.length === 0 && (
              <p className="muted" style={{ fontSize: 14 }}>
                Пока нет запланированных повторений. Изучите первые билеты!
              </p>
            )}
            {reviews.map(({ ticket, due }) => {
              const overdue = due <= Date.now()
              return (
                <Link to={`/ticket/${ticket.id}`} key={ticket.id} className="row between search-result" style={{ padding: '10px 12px' }}>
                  <div className="row" style={{ gap: 10, minWidth: 0 }}>
                    <span style={{ fontSize: 18 }}>{SUBJECT_META.find((s) => s.id === ticket.subject)?.icon}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>
                      №{ticket.number}. {ticket.title}
                    </span>
                  </div>
                  <span className="chip" style={{ flexShrink: 0, color: overdue ? 'var(--teal-400)' : 'var(--text-dim)' }}>
                    {relativeDue(due)}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>

      {/* Subject cards */}
      <div>
        <div className="row between" style={{ marginBottom: 14 }}>
          <h2 style={{ fontSize: 20 }}>Предметы</h2>
          <Link to="/subjects" className="btn btn-sm btn-ghost">
            Все предметы →
          </Link>
        </div>
        <div className="grid grid-3">
          {SUBJECT_META.map((s) => {
            const st = subjectStats(s.id, progress)
            return (
              <Link to={`/subject/${s.id}`} key={s.id} className="card card-pad card-hover stack" style={{ gap: 14 }}>
                <div className="row between">
                  <div className="row" style={{ gap: 12 }}>
                    <div className="stat-ico" style={{ fontSize: 26, background: `${s.accent}22` }}>
                      {s.icon}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 17 }}>{s.title}</h3>
                      <span className="faint" style={{ fontSize: 12.5 }}>
                        {st.total} билетов
                      </span>
                    </div>
                  </div>
                  <Ring value={st.mastery} size={56} stroke={6} color={s.accent} />
                </div>
                <ProgressBar value={st.mastery} color={s.accent} />
                <div className="row between faint" style={{ fontSize: 12.5 }}>
                  <span>Изучено: {st.studied}/{st.total}</span>
                  <span>Тесты: {st.avgTest}%</span>
                  {st.dueToday > 0 ? <span style={{ color: 'var(--teal-400)' }}>↻ {st.dueToday}</span> : <span>↻ 0</span>}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DailyGoalEditor() {
  const dailyGoal = useStore((s) => s.dailyGoal)
  const setDailyGoal = useStore((s) => s.setDailyGoal)
  return (
    <div className="row" style={{ gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
      <span className="faint" style={{ fontSize: 12 }}>
        Цель в день:
      </span>
      {[8, 12, 16, 20].map((n) => (
        <button key={n} className={`btn btn-sm ${dailyGoal === n ? 'btn-primary' : ''}`} onClick={() => setDailyGoal(n)}>
          {n}
        </button>
      ))}
    </div>
  )
}
