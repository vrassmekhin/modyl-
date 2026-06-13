import { useState } from 'react'
import { GraduationCap, Shuffle, Eye, Mic, PenLine, ArrowRight } from 'lucide-react'
import { ALL_TICKETS, getSubject } from '../data'
import { useStore } from '../store'
import { AnswerBody, toast } from '../components/ui'
import type { SubjectId, Ticket } from '../types'
import { SUBJECT_META } from '../lib/selectors'

const SELF_GRADES = [
  { v: 0.2, label: 'Неуд (2)', color: 'var(--red)' },
  { v: 0.5, label: 'Удовл (3)', color: 'var(--orange)' },
  { v: 0.75, label: 'Хорошо (4)', color: 'var(--blue)' },
  { v: 1, label: 'Отлично (5)', color: 'var(--green)' },
]

export default function Exam() {
  const [scope, setScope] = useState<SubjectId | 'all'>('all')
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [written, setWritten] = useState('')
  const [mode, setMode] = useState<'oral' | 'written'>('oral')
  const recordExam = useStore((s) => s.recordExam)
  const [history, setHistory] = useState<{ ticket: Ticket; score: number }[]>([])

  function draw() {
    const pool = scope === 'all' ? ALL_TICKETS : ALL_TICKETS.filter((t) => t.subject === scope)
    const t = pool[Math.floor(Math.random() * pool.length)]
    setTicket(t)
    setRevealed(false)
    setWritten('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function selfGrade(v: number, label: string) {
    if (!ticket) return
    recordExam(ticket.id, v)
    setHistory((h) => [{ ticket, score: v }, ...h].slice(0, 8))
    toast('🎓', `Оценка сохранена: ${label}`)
    draw()
  }

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div>
        <h1 style={{ fontSize: 26 }}>
          <GraduationCap size={26} style={{ verticalAlign: -4, marginRight: 8, color: 'var(--accent)' }} />
          Режим «Экзамен»
        </h1>
        <p className="faint" style={{ fontSize: 13 }}>
          Система вытягивает случайный билет. Ответьте устно или письменно, затем сверьтесь с эталоном и поставьте себе оценку.
        </p>
      </div>

      {!ticket ? (
        <div className="card card-pad center" style={{ padding: 36 }}>
          <div style={{ fontSize: 52 }}>🎲</div>
          <h2 style={{ marginTop: 8 }}>Готовы к репетиции экзамена?</h2>
          <p className="muted" style={{ marginTop: 6 }}>Выберите область билетов и вытяните вопрос.</p>
          <div className="row wrap" style={{ gap: 8, justifyContent: 'center', margin: '18px 0' }}>
            <button className={`chip ${scope === 'all' ? 'chip-accent' : ''}`} onClick={() => setScope('all')} style={{ cursor: 'pointer', padding: '8px 14px' }}>
              Все предметы
            </button>
            {SUBJECT_META.map((s) => (
              <button key={s.id} className={`chip ${scope === s.id ? 'chip-accent' : ''}`} onClick={() => setScope(s.id)} style={{ cursor: 'pointer', padding: '8px 14px' }}>
                {s.icon} {s.short}
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-lg" onClick={draw}>
            <Shuffle size={18} /> Вытянуть билет
          </button>
        </div>
      ) : (
        <>
          <div className="card card-pad" style={{ padding: 24, borderColor: 'var(--accent)', borderWidth: 1.5 }}>
            <div className="row between wrap" style={{ gap: 10 }}>
              <span className="chip chip-accent">
                {getSubject(ticket.subject).icon} {getSubject(ticket.subject).title} · Билет №{ticket.number}
              </span>
              <button className="btn btn-sm" onClick={draw}>
                <Shuffle size={14} /> Другой билет
              </button>
            </div>
            <h2 style={{ fontSize: 22, marginTop: 14, lineHeight: 1.3 }}>{ticket.title}</h2>
          </div>

          <div className="seg" style={{ alignSelf: 'flex-start' }}>
            <button className={mode === 'oral' ? 'on' : ''} onClick={() => setMode('oral')}>
              <Mic size={14} style={{ verticalAlign: -2, marginRight: 6 }} /> Устно
            </button>
            <button className={mode === 'written' ? 'on' : ''} onClick={() => setMode('written')}>
              <PenLine size={14} style={{ verticalAlign: -2, marginRight: 6 }} /> Письменно
            </button>
          </div>

          {mode === 'written' && (
            <textarea
              className="opt"
              style={{ minHeight: 160, resize: 'vertical', width: '100%', display: 'block' }}
              placeholder="Запишите развёрнутый ответ по билету…"
              value={written}
              onChange={(e) => setWritten(e.target.value)}
            />
          )}
          {mode === 'oral' && !revealed && (
            <div className="card card-pad center" style={{ padding: 28 }}>
              <Mic size={36} style={{ color: 'var(--accent)' }} />
              <p className="muted" style={{ marginTop: 10 }}>
                Проговорите ответ вслух, как на устном экзамене. Затем откройте эталон для самопроверки.
              </p>
            </div>
          )}

          {!revealed ? (
            <button className="btn btn-primary btn-lg btn-block" onClick={() => setRevealed(true)}>
              <Eye size={20} /> Показать эталонный ответ
            </button>
          ) : (
            <>
              <div className="card card-pad fade-in" style={{ padding: 24 }}>
                <h3 style={{ fontSize: 16, color: 'var(--accent)', marginBottom: 6 }}>Краткий эталон</h3>
                <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 18 }}>{ticket.summary}</p>
                <h3 style={{ fontSize: 16, color: 'var(--accent)', marginBottom: 12 }}>Полный ответ</h3>
                <AnswerBody lines={ticket.full} />
              </div>
              <div className="card card-pad" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 15, marginBottom: 12, textAlign: 'center' }}>Оцените свой ответ</h3>
                <div className="grade-grid">
                  {SELF_GRADES.map((g) => (
                    <button key={g.v} className="grade-btn" style={{ borderColor: g.color }} onClick={() => selfGrade(g.v, g.label)}>
                      <span style={{ color: g.color, fontWeight: 800, fontSize: 16 }}>{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {history.length > 0 && (
        <div className="card card-pad">
          <h3 style={{ fontSize: 16, marginBottom: 12 }}>Результаты сессии</h3>
          <div className="stack" style={{ gap: 8 }}>
            {history.map((h, i) => (
              <div key={i} className="row between search-result" style={{ padding: '10px 12px' }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>
                  {getSubject(h.ticket.subject).icon} №{h.ticket.number}. {h.ticket.title.slice(0, 50)}
                </span>
                <span className="chip" style={{ color: h.score >= 0.75 ? 'var(--green)' : h.score >= 0.5 ? 'var(--orange)' : 'var(--red)' }}>
                  {Math.round(h.score * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
