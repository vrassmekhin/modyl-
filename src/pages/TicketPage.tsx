import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  FileText,
  ListTree,
  Network,
  Sparkles,
  Brain,
  Eye,
  EyeOff,
  CheckCircle2,
  Layers,
  ListChecks,
  Lightbulb,
  Users,
  Calendar,
  GraduationCap,
  History,
} from 'lucide-react'
import { getTicket, getSubject, subjectPool } from '../data'
import { useStore } from '../store'
import { AnswerBody, MindMap, toast } from '../components/ui'
import { ticketState, masteryPercent, relativeDue } from '../lib/srs'
import { STATE_META } from '../lib/selectors'
import type { Grade } from '../types'

type Tab = 'full' | 'short' | 'outline' | 'mind' | 'theses'
const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'full', label: 'Полный ответ', icon: BookOpen },
  { key: 'short', label: 'Краткая версия', icon: FileText },
  { key: 'outline', label: 'Схема-конспект', icon: ListTree },
  { key: 'mind', label: 'Интеллект-карта', icon: Network },
  { key: 'theses', label: 'Ключевые тезисы', icon: Sparkles },
]

const GRADES: { g: Grade; label: string; emoji: string; cls: string }[] = [
  { g: 0, label: 'Не вспомнил', emoji: '😟', cls: 'grade-0' },
  { g: 1, label: 'Частично', emoji: '🤔', cls: 'grade-1' },
  { g: 2, label: 'Хорошо', emoji: '🙂', cls: 'grade-2' },
  { g: 3, label: 'Идеально', emoji: '🤩', cls: 'grade-3' },
]

export default function TicketPage() {
  const { id } = useParams<{ id: string }>()
  const nav = useNavigate()
  const ticket = getTicket(id!)
  const progress = useStore((s) => s.progress)
  const markStudied = useStore((s) => s.markStudied)
  const gradeTicket = useStore((s) => s.gradeTicket)
  const [tab, setTab] = useState<Tab>('full')
  const [mode, setMode] = useState<'study' | 'recall'>('study')
  const [revealed, setRevealed] = useState(false)

  const subject = ticket ? getSubject(ticket.subject) : null
  const pool = ticket ? subjectPool(ticket.subject) : []
  const idx = ticket ? pool.findIndex((t) => t.id === ticket.id) : -1
  const prev = idx > 0 ? pool[idx - 1] : null
  const next = idx >= 0 && idx < pool.length - 1 ? pool[idx + 1] : null

  if (!ticket || !subject) return <p className="muted">Билет не найден.</p>
  const p = progress[ticket.id]
  const st = ticketState(p)
  const m = masteryPercent(p)

  function studied() {
    markStudied(ticket!.id)
    setMode('recall')
    setRevealed(false)
    toast('🧠', 'Материал изучен — теперь вспоминаем!')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function grade(g: Grade) {
    gradeTicket(ticket!.id, g)
    const labels = ['Повторим скоро 🔁', 'Ещё подтянем 💪', 'Отлично! 👍', 'Идеально! 🌟']
    toast(['😟', '🤔', '🙂', '🤩'][g], labels[g])
    if (next) {
      nav(`/ticket/${next.id}`)
      setMode('study')
      setRevealed(false)
      setTab('full')
    } else {
      setMode('study')
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="stack" style={{ gap: 18 }}>
      {/* Header */}
      <div className="row between wrap" style={{ gap: 12 }}>
        <Link to={`/subject/${subject.id}`} className="btn btn-sm btn-ghost">
          <ArrowLeft size={16} /> {subject.title}
        </Link>
        <div className="row" style={{ gap: 8 }}>
          {prev && (
            <button className="btn btn-sm" onClick={() => { nav(`/ticket/${prev.id}`); setMode('study'); setRevealed(false); setTab('full') }}>
              <ArrowLeft size={15} /> №{prev.number}
            </button>
          )}
          {next && (
            <button className="btn btn-sm" onClick={() => { nav(`/ticket/${next.id}`); setMode('study'); setRevealed(false); setTab('full') }}>
              №{next.number} <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="card card-pad" style={{ padding: 24 }}>
        <div className="row between wrap" style={{ gap: 12 }}>
          <div className="row" style={{ gap: 14, minWidth: 0 }}>
            <div className="stat-ico" style={{ width: 52, height: 52, fontSize: 20, fontWeight: 800, background: `${subject.accent}22`, color: subject.accent }}>
              {ticket.number}
            </div>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ fontSize: 22, lineHeight: 1.25 }}>{ticket.title}</h1>
              <div className="row wrap" style={{ gap: 8, marginTop: 8 }}>
                <span className={`chip ${STATE_META[st].cls}`}>{STATE_META[st].label}</span>
                <span className="chip">Уровень знания: {p?.level.toFixed(1) ?? '0'}/5</span>
                <span className="chip">Освоение: {m}%</span>
                {p?.due ? <span className="chip tag-review">↻ {relativeDue(p.due)}</span> : null}
              </div>
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <Link to={`/cards`} className="btn btn-sm"><Layers size={15} /> Карточки</Link>
            <Link to={`/tests`} className="btn btn-sm"><ListChecks size={15} /> Тест</Link>
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="row between wrap" style={{ gap: 10 }}>
        <div className="seg">
          <button className={mode === 'study' ? 'on' : ''} onClick={() => setMode('study')}>
            <BookOpen size={15} style={{ marginRight: 6, verticalAlign: -2 }} /> Изучение
          </button>
          <button className={mode === 'recall' ? 'on' : ''} onClick={() => { setMode('recall'); setRevealed(false) }}>
            <Brain size={15} style={{ marginRight: 6, verticalAlign: -2 }} /> Active Recall
          </button>
        </div>
      </div>

      {mode === 'study' ? (
        <>
          {/* Tabs */}
          <div className="row wrap" style={{ gap: 8 }}>
            {TABS.map((t) => (
              <button key={t.key} className={`chip ${tab === t.key ? 'chip-accent' : ''}`} onClick={() => setTab(t.key)} style={{ cursor: 'pointer', padding: '8px 14px' }}>
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>

          <div className="card card-pad fade-in" key={tab} style={{ padding: 24 }}>
            {tab === 'full' && <AnswerBody lines={ticket.full} />}
            {tab === 'short' && <p style={{ fontSize: 16, lineHeight: 1.7 }}>{ticket.summary}</p>}
            {tab === 'outline' && (
              <div className="stack" style={{ gap: 10 }}>
                {ticket.outline.map((o, i) => (
                  <div key={i} className="row" style={{ gap: 12 }}>
                    <span className="stat-ico" style={{ width: 30, height: 30, fontSize: 13, background: 'var(--accent-soft)', color: 'var(--accent)', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 15 }}>{o}</span>
                  </div>
                ))}
              </div>
            )}
            {tab === 'mind' && <MindMap ticket={ticket} />}
            {tab === 'theses' && (
              <div className="stack" style={{ gap: 10 }}>
                {ticket.theses.map((t, i) => (
                  <div key={i} className="def-item row" style={{ gap: 10, alignItems: 'flex-start' }}>
                    <Sparkles size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 3 }} />
                    <span style={{ fontSize: 15 }}>{t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Knowledge sections */}
          <Section icon={<Lightbulb size={18} />} title="Ключевые определения" count={ticket.definitions.length}>
            <div className="grid grid-2" style={{ gap: 10 }}>
              {ticket.definitions.map((d, i) => (
                <div key={i} className="def-item">
                  <span className="def-term">{d.term}</span> — {d.definition}
                </div>
              ))}
            </div>
          </Section>

          {ticket.scientists.length > 0 && (
            <Section icon={<Users size={18} />} title="Учёные и теории" count={ticket.scientists.length}>
              <div className="grid grid-2" style={{ gap: 10 }}>
                {ticket.scientists.map((s, i) => (
                  <div key={i} className="def-item">
                    <span className="def-term">{s.name}</span> — {s.contribution}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {ticket.terms.length > 0 && (
            <Section icon={<Sparkles size={18} />} title="Основные термины" count={ticket.terms.length}>
              <div className="row wrap" style={{ gap: 8 }}>
                {ticket.terms.map((t, i) => (
                  <span key={i} className="chip">{t}</span>
                ))}
              </div>
            </Section>
          )}

          {ticket.dates.length > 0 && (
            <Section icon={<Calendar size={18} />} title="Важные даты" count={ticket.dates.length}>
              <div className="stack" style={{ gap: 8 }}>
                {ticket.dates.map((d, i) => (
                  <div key={i} className="row" style={{ gap: 12 }}>
                    <span className="chip chip-accent" style={{ fontWeight: 700, minWidth: 64, justifyContent: 'center' }}>{d.date}</span>
                    <span style={{ fontSize: 14.5 }}>{d.event}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {ticket.examples.length > 0 && (
            <Section icon={<Lightbulb size={18} />} title="Практические примеры" count={ticket.examples.length}>
              <div className="stack" style={{ gap: 8 }}>
                {ticket.examples.map((e, i) => (
                  <div key={i} className="def-item row" style={{ gap: 10 }}>
                    <span style={{ color: 'var(--orange)' }}>💡</span>
                    <span style={{ fontSize: 14.5 }}>{e}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {ticket.mnemonics.length > 0 && (
            <Section icon={<Brain size={18} />} title="Мнемотехника" count={ticket.mnemonics.length}>
              <div className="grid grid-2" style={{ gap: 10 }}>
                {ticket.mnemonics.map((mn, i) => (
                  <div key={i} className="def-item">
                    <span className="chip chip-accent" style={{ fontSize: 11, marginBottom: 6 }}>{mn.type}</span>
                    <p style={{ fontSize: 14.5, marginTop: 4 }}>{mn.text}</p>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {ticket.examQuestions.length > 0 && (
            <Section icon={<GraduationCap size={18} />} title="Типичные экзаменационные вопросы" count={ticket.examQuestions.length}>
              <div className="stack" style={{ gap: 8 }}>
                {ticket.examQuestions.map((q, i) => (
                  <div key={i} className="row" style={{ gap: 10 }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>?</span>
                    <span style={{ fontSize: 14.5 }}>{q}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <button className="btn btn-primary btn-lg btn-block" onClick={studied}>
            <CheckCircle2 size={20} /> Я изучил материал → к вспоминанию
          </button>
        </>
      ) : (
        <RecallMode ticket={ticket} revealed={revealed} setRevealed={setRevealed} onGrade={grade} />
      )}

      {/* History */}
      {p && p.history.length > 0 && (
        <Section icon={<History size={18} />} title="История повторений" count={p.history.length}>
          <div className="row wrap" style={{ gap: 6 }}>
            {p.history.map((h, i) => (
              <span key={i} className="chip" style={{ fontSize: 16, padding: '4px 8px' }} title={new Date(h.ts).toLocaleString('ru')}>
                {['😟', '🤔', '🙂', '🤩'][h.grade]}
              </span>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

function Section({ icon, title, count, children }: { icon: React.ReactNode; title: string; count: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="card card-pad" style={{ padding: 20 }}>
      <button className="row between" style={{ width: '100%' }} onClick={() => setOpen((o) => !o)}>
        <div className="row" style={{ gap: 10 }}>
          <span style={{ color: 'var(--accent)' }}>{icon}</span>
          <h3 style={{ fontSize: 16 }}>{title}</h3>
          <span className="chip" style={{ fontSize: 11 }}>{count}</span>
        </div>
        <span className="faint">{open ? '−' : '+'}</span>
      </button>
      {open && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  )
}

function RecallMode({
  ticket,
  revealed,
  setRevealed,
  onGrade,
}: {
  ticket: ReturnType<typeof getTicket>
  revealed: boolean
  setRevealed: (b: boolean) => void
  onGrade: (g: Grade) => void
}) {
  if (!ticket) return null
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="card card-pad" style={{ padding: 24, borderColor: 'var(--accent)', borderWidth: 1.5 }}>
        <div className="row" style={{ gap: 10, marginBottom: 14 }}>
          <Brain size={22} color="var(--accent)" />
          <h2 style={{ fontSize: 19 }}>Активное вспоминание</h2>
        </div>
        <p className="muted" style={{ fontSize: 15 }}>
          Не подглядывая, воспроизведите по памяти: <b>определения</b>, <b>ключевые тезисы</b>, <b>структуру ответа</b> и
          основные идеи билета «{ticket.title}». Проговорите вслух или запишите.
        </p>
        <div className="grid grid-2" style={{ gap: 10, marginTop: 16 }}>
          {['Определения', 'Ключевые тезисы', 'Структура ответа', 'Учёные и теории'].map((x) => (
            <div key={x} className="def-item row" style={{ gap: 10 }}>
              <EyeOff size={16} style={{ color: 'var(--text-faint)' }} />
              <span style={{ fontSize: 14.5 }}>{x}</span>
            </div>
          ))}
        </div>
      </div>

      {!revealed ? (
        <button className="btn btn-primary btn-lg btn-block" onClick={() => setRevealed(true)}>
          <Eye size={20} /> Показать ответ
        </button>
      ) : (
        <>
          <div className="card card-pad fade-in" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, color: 'var(--accent)', marginBottom: 12 }}>Краткий эталон</h3>
            <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 16 }}>{ticket.summary}</p>
            <div className="stack" style={{ gap: 8 }}>
              {ticket.theses.map((t, i) => (
                <div key={i} className="row" style={{ gap: 10 }}>
                  <CheckCircle2 size={15} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 3 }} />
                  <span style={{ fontSize: 14.5 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12, textAlign: 'center' }}>Насколько хорошо вы вспомнили?</h3>
            <div className="grade-grid">
              {GRADES.map((g) => (
                <button key={g.g} className={`grade-btn ${g.cls}`} onClick={() => onGrade(g.g)}>
                  <span className="grade-emoji">{g.emoji}</span>
                  {g.label}
                </button>
              ))}
            </div>
            <p className="faint center" style={{ fontSize: 12, marginTop: 12 }}>
              Оценка определит, когда билет вернётся на повторение
            </p>
          </div>
        </>
      )}
    </div>
  )
}
