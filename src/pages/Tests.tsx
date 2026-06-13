import { useMemo, useState } from 'react'
import { ListChecks, ArrowLeft, RefreshCw, Check, X, ArrowRight, Trophy } from 'lucide-react'
import { useStore } from '../store'
import { getSubject, subjectPool, getTicket } from '../data'
import { testsFor, SUBJECT_META } from '../lib/selectors'
import { scoreOpenAnswer } from '../lib/generators'
import type { SubjectId, TestQuestion } from '../types'
import { EmptyState, ProgressBar, toast } from '../components/ui'
import { progressColor } from '../components/ui'

type Answer = number | number[] | Record<number, string> | string[] | string
type AnswerMap = Record<string, Answer>

function shuffle<T>(a: T[]): T[] {
  const x = [...a]
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[x[i], x[j]] = [x[j], x[i]]
  }
  return x
}

function scoreQuestion(q: TestQuestion, a: Answer | undefined): number {
  if (a == null) return 0
  switch (q.type) {
    case 'single':
      return (a as number) === q.correct![0] ? 1 : 0
    case 'multiple': {
      const sel = new Set(a as number[])
      const cor = new Set(q.correct!)
      if (sel.size !== cor.size) {
        let ok = 0
        cor.forEach((c) => sel.has(c) && ok++)
        let wrong = 0
        sel.forEach((s) => !cor.has(s) && wrong++)
        return Math.max(0, (ok - wrong) / cor.size)
      }
      let all = true
      cor.forEach((c) => !sel.has(c) && (all = false))
      return all ? 1 : 0
    }
    case 'matching': {
      const map = a as Record<number, string>
      let ok = 0
      q.pairs!.forEach((p, i) => {
        if (map[i] === p.right) ok++
      })
      return ok / q.pairs!.length
    }
    case 'sequence': {
      const ord = a as string[]
      let ok = 0
      q.order!.forEach((s, i) => {
        if (ord[i] === s) ok++
      })
      return ok / q.order!.length
    }
    case 'open':
      return scoreOpenAnswer(a as string, q.reference || q.explanation)
  }
}

export default function Tests() {
  const [subj, setSubj] = useState<SubjectId>('psychology')
  const [ticketId, setTicketId] = useState<string>('')
  const [phase, setPhase] = useState<'setup' | 'quiz' | 'result'>('setup')
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [answers, setAnswers] = useState<AnswerMap>({})
  const recordTest = useStore((s) => s.recordTest)

  const tickets = subjectPool(subj)

  function start(mode: 'ticket' | 'random') {
    let qs: TestQuestion[] = []
    if (mode === 'ticket' && ticketId) {
      qs = testsFor(getTicket(ticketId)!)
    } else {
      // случайные вопросы по предмету
      const pool = tickets.flatMap((t) => testsFor(t))
      qs = shuffle(pool).slice(0, 12)
    }
    if (!qs.length) {
      toast('⚠️', 'Нет вопросов для выбранного билета')
      return
    }
    setQuestions(qs)
    setAnswers({})
    setPhase('quiz')
    window.scrollTo({ top: 0 })
  }

  function finish() {
    setPhase('result')
    const score = questions.reduce((acc, q) => acc + scoreQuestion(q, answers[q.id]), 0) / questions.length
    // запись по билетам
    const byTicket: Record<string, { sum: number; n: number }> = {}
    questions.forEach((q) => {
      const s = scoreQuestion(q, answers[q.id])
      byTicket[q.ticketId] = byTicket[q.ticketId] || { sum: 0, n: 0 }
      byTicket[q.ticketId].sum += s
      byTicket[q.ticketId].n++
    })
    Object.entries(byTicket).forEach(([tid, v]) => recordTest(tid, v.sum / v.n))
    toast('✅', `Тест пройден: ${Math.round(score * 100)}%`)
    window.scrollTo({ top: 0 })
  }

  if (phase === 'setup') {
    return (
      <div className="stack" style={{ gap: 18 }}>
        <div>
          <h1 style={{ fontSize: 26 }}>Тестирование</h1>
          <p className="faint" style={{ fontSize: 13 }}>
            Авто-генерация: один/несколько ответов, сопоставление, последовательность, открытые вопросы.
          </p>
        </div>
        <div className="card card-pad" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 12 }}>1. Выберите предмет</h3>
          <div className="row wrap" style={{ gap: 8 }}>
            {SUBJECT_META.map((s) => (
              <button key={s.id} className={`chip ${subj === s.id ? 'chip-accent' : ''}`} onClick={() => { setSubj(s.id); setTicketId('') }} style={{ cursor: 'pointer', padding: '8px 14px' }}>
                {s.icon} {s.title}
              </button>
            ))}
          </div>

          <h3 style={{ margin: '22px 0 12px' }}>2. Режим</h3>
          <div className="grid grid-2" style={{ gap: 12 }}>
            <div className="card card-pad" style={{ background: 'var(--surface)' }}>
              <h4 style={{ fontSize: 15 }}>🎯 По конкретному билету</h4>
              <select
                className="btn"
                style={{ width: '100%', marginTop: 10 }}
                value={ticketId}
                onChange={(e) => setTicketId(e.target.value)}
              >
                <option value="">— выберите билет —</option>
                {tickets.map((t) => (
                  <option key={t.id} value={t.id}>
                    №{t.number}. {t.title}
                  </option>
                ))}
              </select>
              <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} disabled={!ticketId} onClick={() => start('ticket')}>
                Начать тест по билету
              </button>
            </div>
            <div className="card card-pad" style={{ background: 'var(--surface)' }}>
              <h4 style={{ fontSize: 15 }}>🎲 Случайные 12 вопросов</h4>
              <p className="faint" style={{ fontSize: 13, marginTop: 10 }}>
                Смешанный тест по всему предмету «{getSubject(subj).title}» — отличная проверка перед экзаменом.
              </p>
              <button className="btn btn-primary btn-block" style={{ marginTop: 12 }} onClick={() => start('random')}>
                Случайный тест
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'result') {
    const total = questions.reduce((acc, q) => acc + scoreQuestion(q, answers[q.id]), 0) / questions.length
    const pct = Math.round(total * 100)
    return (
      <div className="stack" style={{ gap: 18 }}>
        <div className="card card-pad center" style={{ padding: 32 }}>
          <Trophy size={44} style={{ color: progressColor(pct) }} />
          <h1 style={{ fontSize: 40, color: progressColor(pct), marginTop: 8 }}>{pct}%</h1>
          <p className="muted">
            Правильно: {questions.filter((q) => scoreQuestion(q, answers[q.id]) >= 0.999).length} из {questions.length}
          </p>
          <div className="row" style={{ gap: 10, justifyContent: 'center', marginTop: 18 }}>
            <button className="btn btn-primary" onClick={() => setPhase('setup')}>
              <RefreshCw size={16} /> Новый тест
            </button>
          </div>
        </div>

        <h3>Разбор ответов</h3>
        {questions.map((q, qi) => {
          const sc = scoreQuestion(q, answers[q.id])
          return (
            <div key={q.id} className="card card-pad" style={{ borderLeft: `4px solid ${sc >= 0.999 ? 'var(--green)' : sc > 0 ? 'var(--orange)' : 'var(--red)'}` }}>
              <div className="row between">
                <span className="faint" style={{ fontSize: 12 }}>Вопрос {qi + 1} · {typeLabel(q.type)}</span>
                <span className="chip" style={{ color: sc >= 0.999 ? 'var(--green)' : 'var(--red)' }}>
                  {Math.round(sc * 100)}%
                </span>
              </div>
              <p style={{ fontWeight: 600, margin: '8px 0 10px' }}>{q.prompt}</p>
              <ReviewAnswer q={q} a={answers[q.id]} />
              <div className="def-item" style={{ marginTop: 10, background: 'var(--accent-soft)', borderColor: 'transparent' }}>
                <b style={{ color: 'var(--accent)' }}>Пояснение:</b> {q.explanation}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // quiz
  const answered = questions.filter((q) => answers[q.id] != null).length
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row between">
        <button className="btn btn-sm btn-ghost" onClick={() => setPhase('setup')}>
          <ArrowLeft size={15} /> Выход
        </button>
        <span className="faint" style={{ fontSize: 13 }}>
          Отвечено {answered} / {questions.length}
        </span>
      </div>
      <ProgressBar value={(answered / questions.length) * 100} />

      {questions.map((q, qi) => (
        <div key={q.id} className="card card-pad" style={{ padding: 22 }}>
          <div className="row" style={{ gap: 10, marginBottom: 10 }}>
            <span className="stat-ico" style={{ width: 30, height: 30, fontSize: 13, background: 'var(--accent-soft)', color: 'var(--accent)' }}>
              {qi + 1}
            </span>
            <span className="chip" style={{ fontSize: 11 }}>{typeLabel(q.type)}</span>
          </div>
          <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 14 }}>{q.prompt}</p>
          <QuestionInput q={q} value={answers[q.id]} onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} />
        </div>
      ))}

      <button className="btn btn-primary btn-lg btn-block" onClick={finish}>
        Завершить тест <ArrowRight size={18} />
      </button>
    </div>
  )
}

function typeLabel(t: TestQuestion['type']) {
  return { single: 'Один ответ', multiple: 'Несколько ответов', matching: 'Сопоставление', sequence: 'Последовательность', open: 'Открытый вопрос' }[t]
}

function QuestionInput({ q, value, onChange }: { q: TestQuestion; value: Answer | undefined; onChange: (v: Answer) => void }) {
  if (q.type === 'single') {
    return (
      <div className="stack" style={{ gap: 8 }}>
        {q.options!.map((o, i) => (
          <button key={i} className={`opt ${value === i ? 'selected' : ''}`} onClick={() => onChange(i)}>
            <span className="opt-mark">{value === i ? '●' : ''}</span>
            {o}
          </button>
        ))}
      </div>
    )
  }
  if (q.type === 'multiple') {
    const sel = (value as number[]) || []
    return (
      <div className="stack" style={{ gap: 8 }}>
        <span className="faint" style={{ fontSize: 12 }}>Выберите все верные варианты</span>
        {q.options!.map((o, i) => {
          const on = sel.includes(i)
          return (
            <button key={i} className={`opt ${on ? 'selected' : ''}`} onClick={() => onChange(on ? sel.filter((x) => x !== i) : [...sel, i])}>
              <span className="opt-mark" style={{ borderRadius: 6 }}>{on ? '✓' : ''}</span>
              {o}
            </button>
          )
        })}
      </div>
    )
  }
  if (q.type === 'matching') {
    const map = (value as Record<number, string>) || {}
    const rights = useMemoShuffle(q.id, q.pairs!.map((p) => p.right))
    return (
      <div className="stack" style={{ gap: 10 }}>
        {q.pairs!.map((p, i) => (
          <div key={i} className="row between wrap" style={{ gap: 10 }}>
            <span className="def-item" style={{ flex: 1, minWidth: 160 }}>
              <b>{p.left}</b>
            </span>
            <ArrowRight size={16} className="faint" />
            <select className="btn" style={{ flex: 1.4, minWidth: 200 }} value={map[i] || ''} onChange={(e) => onChange({ ...map, [i]: e.target.value })}>
              <option value="">— выберите —</option>
              {rights.map((r, ri) => (
                <option key={ri} value={r}>
                  {r.length > 70 ? r.slice(0, 70) + '…' : r}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    )
  }
  if (q.type === 'sequence') {
    const ord = (value as string[]) || []
    const remaining = useMemoShuffle(q.id, q.order!).filter((s) => !ord.includes(s))
    return (
      <div className="stack" style={{ gap: 10 }}>
        <span className="faint" style={{ fontSize: 12 }}>Нажимайте элементы в правильном порядке</span>
        <div className="stack" style={{ gap: 6 }}>
          {ord.map((s, i) => (
            <div key={s} className="opt selected">
              <span className="opt-mark">{i + 1}</span>
              {s}
            </div>
          ))}
        </div>
        {remaining.length > 0 && <div className="divider" />}
        <div className="row wrap" style={{ gap: 8 }}>
          {remaining.map((s) => (
            <button key={s} className="chip" style={{ cursor: 'pointer', padding: '8px 14px' }} onClick={() => onChange([...ord, s])}>
              {s}
            </button>
          ))}
          {ord.length > 0 && (
            <button className="btn btn-sm btn-ghost" onClick={() => onChange([])}>
              Сбросить
            </button>
          )}
        </div>
      </div>
    )
  }
  // open
  return (
    <textarea
      className="opt"
      style={{ minHeight: 110, resize: 'vertical', display: 'block', width: '100%' }}
      placeholder="Сформулируйте ответ своими словами…"
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function ReviewAnswer({ q, a }: { q: TestQuestion; a: Answer | undefined }) {
  if (q.type === 'single' || q.type === 'multiple') {
    const correct = new Set(q.correct)
    const sel = new Set((q.type === 'single' ? (a != null ? [a as number] : []) : (a as number[]) || []) as number[])
    return (
      <div className="stack" style={{ gap: 6 }}>
        {q.options!.map((o, i) => {
          const isCor = correct.has(i)
          const isSel = sel.has(i)
          return (
            <div key={i} className={`opt ${isCor ? 'correct' : isSel ? 'wrong' : ''}`} style={{ cursor: 'default' }}>
              <span className="opt-mark">{isCor ? <Check size={13} /> : isSel ? <X size={13} /> : ''}</span>
              {o}
            </div>
          )
        })}
      </div>
    )
  }
  if (q.type === 'matching') {
    const map = (a as Record<number, string>) || {}
    return (
      <div className="stack" style={{ gap: 6 }}>
        {q.pairs!.map((p, i) => {
          const ok = map[i] === p.right
          return (
            <div key={i} className={`opt ${ok ? 'correct' : 'wrong'}`} style={{ cursor: 'default' }}>
              <b>{p.left}</b> → {p.right}
            </div>
          )
        })}
      </div>
    )
  }
  if (q.type === 'sequence') {
    const ord = (a as string[]) || []
    return (
      <div className="stack" style={{ gap: 6 }}>
        {q.order!.map((s, i) => (
          <div key={i} className={`opt ${ord[i] === s ? 'correct' : 'wrong'}`} style={{ cursor: 'default' }}>
            <span className="opt-mark">{i + 1}</span>
            {s} {ord[i] !== s && ord[i] && <span className="faint">(вы: {ord[i]})</span>}
          </div>
        ))}
      </div>
    )
  }
  return (
    <div className="def-item">
      <span className="faint" style={{ fontSize: 12 }}>Ваш ответ:</span>
      <p style={{ marginTop: 4 }}>{(a as string) || '—'}</p>
    </div>
  )
}

// стабильный перемешанный список на время прохождения
const shuffleCache = new Map<string, string[]>()
function useMemoShuffle(key: string, items: string[]): string[] {
  return useMemo(() => {
    if (!shuffleCache.has(key)) shuffleCache.set(key, shuffle(items))
    return shuffleCache.get(key)!
  }, [key])
}
