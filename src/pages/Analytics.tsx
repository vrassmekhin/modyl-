import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  Cell,
} from 'recharts'
import { TrendingUp, Clock, Award, AlertTriangle, Target } from 'lucide-react'
import { useStore } from '../store'
import { globalStats, subjectStats, weakestTickets, strongestTickets, SUBJECT_META } from '../lib/selectors'
import { masteryPercent } from '../lib/srs'
import { StatTile, progressColor } from '../components/ui'

export default function Analytics() {
  const progress = useStore((s) => s.progress)
  const activity = useStore((s) => s.activity)
  const g = globalStats(progress)

  const subjData = SUBJECT_META.map((s) => {
    const st = subjectStats(s.id, progress)
    return { name: s.short, mastery: st.mastery, test: st.avgTest, color: s.accent }
  }).sort((a, b) => b.mastery - a.mastery)

  // временной ряд (последние 10 дней активности + дни подготовки)
  const days = useMemo(() => {
    const today = new Date()
    const arr: { date: string; label: string; xp: number; reviewed: number; minutes: number }[] = []
    for (let i = 9; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const a = activity[key]
      arr.push({
        date: key,
        label: d.toLocaleDateString('ru', { day: 'numeric', month: 'short' }),
        xp: a?.xp || 0,
        reviewed: a?.reviewed || 0,
        minutes: a?.minutes || 0,
      })
    }
    return arr
  }, [activity])

  const totalMinutes = Object.values(activity).reduce((a, d) => a + d.minutes, 0)
  const hours = (totalMinutes / 60).toFixed(1)
  const weak = weakestTickets(progress, 5)
  const strong = strongestTickets(progress, 5)

  // прогноз готовности к 17 июня
  const forecast = useMemo(() => {
    const examDate = new Date('2026-06-17')
    const now = new Date()
    const daysLeft = Math.max(0, Math.ceil((examDate.getTime() - now.getTime()) / 86400000))
    // средний дневной прирост готовности за активные дни
    const activeDays = Object.values(activity).filter((d) => d.studied + d.reviewed > 0).length || 1
    const studiedRatio = g.studied / g.total
    const dailyGain = (g.readiness / Math.max(1, activeDays)) || 5
    const projected = Math.min(100, Math.round(g.readiness + dailyGain * daysLeft * 0.6))
    return { daysLeft, projected, studiedRatio }
  }, [activity, g])

  return (
    <div className="stack" style={{ gap: 20 }}>
      <h1 style={{ fontSize: 26 }}>Аналитика подготовки</h1>

      <div className="grid grid-4">
        <StatTile icon={<Target size={20} />} value={`${g.readiness}%`} label="Готовность к экзамену" color={progressColor(g.readiness)} />
        <StatTile icon={<Award size={20} />} value={`${g.avgTest}%`} label="Средний балл тестов" color="var(--teal-400)" />
        <StatTile icon={<Clock size={20} />} value={`${hours} ч`} label="Часов подготовки" color="var(--blue)" />
        <StatTile icon={<TrendingUp size={20} />} value={`${forecast.projected}%`} label="Прогноз к 17 июня" color="var(--green)" />
      </div>

      {/* Forecast banner */}
      <div className="card card-pad" style={{ padding: 20, background: 'var(--accent-soft)', borderColor: 'transparent' }}>
        <div className="row between wrap" style={{ gap: 12 }}>
          <div className="row" style={{ gap: 12 }}>
            <TrendingUp size={22} color="var(--accent)" />
            <div>
              <h3 style={{ fontSize: 16 }}>Прогноз готовности</h3>
              <p className="muted" style={{ fontSize: 13.5 }}>
                До экзамена осталось дней: <b>{forecast.daysLeft}</b>. При текущем темпе ожидаемая готовность —{' '}
                <b style={{ color: 'var(--accent)' }}>{forecast.projected}%</b>.
              </p>
            </div>
          </div>
          <Link to="/cards" className="btn btn-primary btn-sm">Ускориться</Link>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Subject rating */}
        <div className="card card-pad">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Рейтинг предметов (освоение)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={subjData} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} stroke="var(--text-faint)" fontSize={12} />
              <YAxis type="category" dataKey="name" stroke="var(--text-faint)" fontSize={12} width={80} />
              <Tooltip content={<ChartTip suffix="%" />} cursor={{ fill: 'var(--surface-2)' }} />
              <Bar dataKey="mastery" radius={[0, 8, 8, 0]} barSize={26}>
                {subjData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Readiness radial */}
        <div className="card card-pad">
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Распределение билетов</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadialBarChart
              innerRadius="30%"
              outerRadius="100%"
              data={[
                { name: 'Освоено', value: pct(g.mastered, g.total), fill: 'var(--green)' },
                { name: 'В работе', value: pct(g.inProgress, g.total), fill: 'var(--orange)' },
                { name: 'Проблемных', value: pct(g.problem, g.total), fill: 'var(--red)' },
                { name: 'Изучено', value: pct(g.studied, g.total), fill: 'var(--teal-400)' },
              ]}
              startAngle={90}
              endAngle={-270}
            >
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
              <RadialBar background dataKey="value" cornerRadius={8} />
              <Tooltip content={<ChartTip suffix="%" />} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="row wrap" style={{ gap: 8, justifyContent: 'center' }}>
            <Legend color="var(--green)" label={`Освоено ${g.mastered}`} />
            <Legend color="var(--teal-400)" label={`Изучено ${g.studied}`} />
            <Legend color="var(--orange)" label={`В работе ${g.inProgress}`} />
            <Legend color="var(--red)" label={`Проблемных ${g.problem}`} />
          </div>
        </div>
      </div>

      {/* Performance over time */}
      <div className="card card-pad">
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>График успеваемости и повторений (10 дней)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={days} margin={{ left: -10, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="label" stroke="var(--text-faint)" fontSize={11} />
            <YAxis stroke="var(--text-faint)" fontSize={11} />
            <Tooltip content={<ChartTip />} cursor={{ stroke: 'var(--border-strong)' }} />
            <Line type="monotone" dataKey="xp" name="XP" stroke="var(--teal-400)" strokeWidth={2.5} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="reviewed" name="Повторений" stroke="var(--blue)" strokeWidth={2.5} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-2">
        <div className="card card-pad">
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>
            <AlertTriangle size={17} style={{ verticalAlign: -3, color: 'var(--red)', marginRight: 6 }} />
            Самые слабые темы
          </h3>
          <TopicList tickets={weak} progress={progress} reverse />
        </div>
        <div className="card card-pad">
          <h3 style={{ fontSize: 16, marginBottom: 14 }}>
            <Award size={17} style={{ verticalAlign: -3, color: 'var(--green)', marginRight: 6 }} />
            Самые сильные темы
          </h3>
          <TopicList tickets={strong} progress={progress} />
        </div>
      </div>
    </div>
  )
}

function pct(a: number, b: number) {
  return b ? Math.round((a / b) * 100) : 0
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="chip" style={{ fontSize: 11.5 }}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: 'inline-block' }} /> {label}
    </span>
  )
}

function ChartTip({ active, payload, label, suffix }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="card card-pad" style={{ padding: 10, fontSize: 12.5 }}>
      {label && <div style={{ fontWeight: 700, marginBottom: 4 }}>{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color || p.fill }}>
          {p.name}: <b>{p.value}{suffix || ''}</b>
        </div>
      ))}
    </div>
  )
}

function TopicList({ tickets, progress, reverse }: { tickets: any[]; progress: any; reverse?: boolean }) {
  if (!tickets.length) return <p className="muted" style={{ fontSize: 13 }}>Пока недостаточно данных — изучите больше билетов.</p>
  return (
    <div className="stack" style={{ gap: 8 }}>
      {tickets.map((t) => {
        const m = masteryPercent(progress[t.id])
        return (
          <Link to={`/ticket/${t.id}`} key={t.id} className="row between search-result" style={{ padding: '10px 12px' }}>
            <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
              {SUBJECT_META.find((s) => s.id === t.subject)?.icon} {t.title}
            </span>
            <span className="chip" style={{ color: progressColor(m), flexShrink: 0 }}>{m}%</span>
          </Link>
        )
      })}
    </div>
  )
}
