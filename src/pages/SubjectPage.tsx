import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { getSubject } from '../data'
import type { SubjectId } from '../types'
import { useStore } from '../store'
import { ticketState, masteryPercent, isDue, relativeDue, type TicketState } from '../lib/srs'
import { STATE_META } from '../lib/selectors'
import { ProgressBar } from '../components/ui'

const FILTERS: { key: TicketState | 'all'; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'new', label: 'Новые' },
  { key: 'learning', label: 'В работе' },
  { key: 'review', label: 'К повторению' },
  { key: 'problem', label: 'Проблемные' },
  { key: 'mastered', label: 'Освоенные' },
]

export default function SubjectPage() {
  const { id } = useParams<{ id: SubjectId }>()
  const subject = getSubject(id as SubjectId)
  const progress = useStore((s) => s.progress)
  const [filter, setFilter] = useState<TicketState | 'all'>('all')
  const [q, setQ] = useState('')

  const tickets = useMemo(() => {
    return subject.tickets.filter((t) => {
      const st = ticketState(progress[t.id])
      if (filter !== 'all' && st !== filter) return false
      if (q && !(`${t.number} ${t.title}`.toLowerCase().includes(q.toLowerCase()))) return false
      return true
    })
  }, [subject, progress, filter, q])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: subject.tickets.length }
    for (const t of subject.tickets) {
      const st = ticketState(progress[t.id])
      c[st] = (c[st] || 0) + 1
    }
    return c
  }, [subject, progress])

  return (
    <div className="stack" style={{ gap: 18 }}>
      <Link to="/subjects" className="btn btn-sm btn-ghost" style={{ alignSelf: 'flex-start' }}>
        <ArrowLeft size={16} /> Все предметы
      </Link>
      <div className="row" style={{ gap: 14 }}>
        <span style={{ fontSize: 40 }}>{subject.icon}</span>
        <div>
          <h1 style={{ fontSize: 26 }}>{subject.title}</h1>
          <p className="faint" style={{ fontSize: 13 }}>
            {subject.tickets.length} билетов · {subject.source}
          </p>
        </div>
      </div>

      <div className="search-input">
        <input placeholder="Поиск билета по номеру или названию…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      <div className="row wrap" style={{ gap: 8 }}>
        {FILTERS.map((f) => (
          <button key={f.key} className={`chip ${filter === f.key ? 'chip-accent' : ''}`} onClick={() => setFilter(f.key)} style={{ cursor: 'pointer' }}>
            {f.label} <b style={{ marginLeft: 2 }}>{counts[f.key] || 0}</b>
          </button>
        ))}
      </div>

      <div className="stack" style={{ gap: 10 }}>
        {tickets.map((t) => {
          const p = progress[t.id]
          const st = ticketState(p)
          const m = masteryPercent(p)
          const due = p && isDue(p)
          return (
            <Link to={`/ticket/${t.id}`} key={t.id} className="card card-pad card-hover row between" style={{ padding: 16, gap: 14 }}>
              <div className="row" style={{ gap: 14, minWidth: 0, flex: 1 }}>
                <div
                  className="stat-ico"
                  style={{ width: 44, height: 44, fontSize: 16, fontWeight: 800, background: `${subject.accent}22`, color: subject.accent, flexShrink: 0 }}
                >
                  {t.number}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="row between" style={{ gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{t.title}</span>
                  </div>
                  <div className="row" style={{ gap: 8, marginTop: 8 }}>
                    <span className={`chip ${STATE_META[st].cls}`} style={{ fontSize: 11 }}>
                      {STATE_META[st].label}
                    </span>
                    {due && (
                      <span className="chip tag-review" style={{ fontSize: 11 }}>
                        <RotateCcw size={11} /> {relativeDue(p!.due)}
                      </span>
                    )}
                    <span className="faint" style={{ fontSize: 11.5 }}>
                      {t.definitions.length} опр. · {t.scientists.length} учёных
                    </span>
                  </div>
                  <div style={{ marginTop: 10, maxWidth: 280 }}>
                    <ProgressBar value={m} color={subject.accent} />
                  </div>
                </div>
              </div>
              <span className="mono-num faint" style={{ fontWeight: 700, fontSize: 15 }}>
                {m}%
              </span>
            </Link>
          )
        })}
        {tickets.length === 0 && <p className="muted center" style={{ padding: 40 }}>Нет билетов в этой категории.</p>}
      </div>
    </div>
  )
}
