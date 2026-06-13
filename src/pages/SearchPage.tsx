import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search as SearchIcon } from 'lucide-react'
import { ALL_TICKETS, getSubject } from '../data'
import { Highlight, EmptyState } from '../components/ui'

type Hit = {
  ticketId: string
  ticketTitle: string
  subject: string
  number: number
  field: string
  text: string
}

export default function SearchPage() {
  const [q, setQ] = useState('')

  const hits = useMemo<Hit[]>(() => {
    const query = q.trim().toLowerCase()
    if (query.length < 2) return []
    const out: Hit[] = []
    const add = (t: any, field: string, text: string) => {
      if (text.toLowerCase().includes(query)) {
        out.push({ ticketId: t.id, ticketTitle: t.title, subject: t.subject, number: t.number, field, text })
      }
    }
    for (const t of ALL_TICKETS) {
      add(t, 'Билет', t.title)
      t.definitions.forEach((d: any) => {
        add(t, 'Термин', d.term)
        add(t, 'Определение', `${d.term} — ${d.definition}`)
      })
      t.scientists.forEach((s: any) => add(t, 'Учёный', `${s.name} — ${s.contribution}`))
      t.terms.forEach((term: string) => add(t, 'Термин', term))
      t.theses.forEach((th: string) => add(t, 'Тезис', th))
    }
    // дедупликация по тексту+билету
    const seen = new Set<string>()
    return out
      .filter((h) => {
        const k = h.ticketId + '|' + h.text
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })
      .slice(0, 60)
  }, [q])

  return (
    <div className="stack" style={{ gap: 18 }}>
      <h1 style={{ fontSize: 26 }}>Глобальный поиск</h1>
      <p className="faint" style={{ fontSize: 13, marginTop: -8 }}>
        Поиск по терминам, определениям, фамилиям учёных, тезисам и билетам всех трёх предметов.
      </p>

      <div className="search-input" style={{ maxWidth: '100%' }}>
        <SearchIcon size={18} className="faint" />
        <input autoFocus placeholder="Например: социализация, Маслоу, инфляция, аномия…" value={q} onChange={(e) => setQ(e.target.value)} />
        {q && (
          <button className="btn btn-sm btn-ghost" onClick={() => setQ('')}>
            ✕
          </button>
        )}
      </div>

      {q.trim().length < 2 ? (
        <div className="row wrap" style={{ gap: 8 }}>
          {['Маслоу', 'социализация', 'инфляция', 'стратификация', 'конформизм', 'ВВП', 'аномия', 'мотивация'].map((s) => (
            <button key={s} className="chip" style={{ cursor: 'pointer' }} onClick={() => setQ(s)}>
              {s}
            </button>
          ))}
        </div>
      ) : hits.length === 0 ? (
        <EmptyState emoji="🔍" title="Ничего не найдено" sub={`По запросу «${q}» совпадений нет.`} />
      ) : (
        <>
          <span className="faint" style={{ fontSize: 13 }}>Найдено: {hits.length}</span>
          <div className="stack" style={{ gap: 8 }}>
            {hits.map((h, i) => {
              const s = getSubject(h.subject as any)
              return (
                <Link to={`/ticket/${h.ticketId}`} key={i} className="search-result stack" style={{ gap: 4 }}>
                  <div className="row" style={{ gap: 8 }}>
                    <span className="chip chip-accent" style={{ fontSize: 10.5 }}>{h.field}</span>
                    <span className="faint" style={{ fontSize: 12 }}>
                      {s.icon} {s.short} · №{h.number}
                    </span>
                  </div>
                  <span style={{ fontSize: 14.5 }}>
                    <Highlight text={h.text} query={q.trim()} />
                  </span>
                  <span className="faint" style={{ fontSize: 12 }}>
                    {h.ticketTitle}
                  </span>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
