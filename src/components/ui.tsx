import { useEffect, useMemo, useState } from 'react'
import type { Ticket } from '../types'

// ===== Progress Ring =====
export function Ring({
  value,
  size = 120,
  stroke = 10,
  label,
  caption,
  color,
}: {
  value: number
  size?: number
  stroke?: number
  label?: string
  caption?: string
  color?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(100, Math.max(0, value)) / 100) * c
  const col = color || progressColor(value)
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.7s ease' }}
        />
      </svg>
      <div className="ring-center">
        <div className="ring-val" style={{ color: col }}>
          {label ?? `${value}%`}
        </div>
        {caption && <div className="ring-cap">{caption}</div>}
      </div>
    </div>
  )
}

export function progressColor(pct: number): string {
  if (pct >= 75) return 'var(--green)'
  if (pct >= 45) return 'var(--teal-400)'
  if (pct >= 20) return 'var(--orange)'
  return 'var(--red)'
}

// ===== Stat tile =====
export function StatTile({ icon, value, label, color }: { icon: React.ReactNode; value: React.ReactNode; label: string; color?: string }) {
  return (
    <div className="card card-pad stat fade-in">
      <div className="row between">
        <div className="stat-ico" style={{ background: color ? `${color}22` : 'var(--accent-soft)', color: color || 'var(--accent)' }}>
          {icon}
        </div>
      </div>
      <div className="stat-val mono-num" style={{ marginTop: 8 }}>
        {value}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  return (
    <div className="pbar">
      <span style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
  )
}

// ===== Answer renderer (paragraphs, ## headings, • bullets) =====
export function AnswerBody({ lines }: { lines: string[] }) {
  return (
    <div className="answer-body">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <div className="h" key={i}>{line.slice(3)}</div>
        if (line.startsWith('• ')) return <div className="li" key={i}><span>{line.slice(2)}</span></div>
        return <p key={i}>{line}</p>
      })}
    </div>
  )
}

// ===== Auto mind-map from ticket =====
export function MindMap({ ticket }: { ticket: Ticket }) {
  const branches = ticket.outline.length ? ticket.outline : ticket.theses
  return (
    <div className="mindmap">
      <div className="mind-center">{ticket.title}</div>
      <div className="mind-branches">
        {branches.map((b, i) => (
          <div className="mind-branch" key={i} style={{ borderLeft: `3px solid ${branchColor(i)}` }}>
            {b}
          </div>
        ))}
      </div>
      {ticket.terms.length > 0 && (
        <div className="mind-branches" style={{ marginTop: 4 }}>
          {ticket.terms.slice(0, 8).map((t, i) => (
            <span className="chip" key={i}>
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function branchColor(i: number) {
  const cols = ['var(--teal-400)', 'var(--blue)', 'var(--orange)', 'var(--purple)', 'var(--green)', 'var(--red)']
  return cols[i % cols.length]
}

// ===== Toast system =====
type Toast = { id: number; icon: string; text: string }
let pushFn: ((t: Omit<Toast, 'id'>) => void) | null = null
export function toast(icon: string, text: string) {
  pushFn?.({ icon, text })
}
export function ToastHost() {
  const [items, setItems] = useState<Toast[]>([])
  useEffect(() => {
    pushFn = (t) => {
      const id = Date.now() + Math.random()
      setItems((s) => [...s, { ...t, id }])
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== id)), 3200)
    }
    return () => {
      pushFn = null
    }
  }, [])
  return (
    <div className="toast-wrap">
      {items.map((t) => (
        <div className="toast" key={t.id}>
          <span style={{ fontSize: 22 }}>{t.icon}</span>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{t.text}</span>
        </div>
      ))}
    </div>
  )
}

// ===== Highlight matches in search =====
export function Highlight({ text, query }: { text: string; query: string }) {
  const parts = useMemo(() => {
    if (!query) return [text]
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx < 0) return [text]
    return [text.slice(0, idx), text.slice(idx, idx + query.length), text.slice(idx + query.length)]
  }, [text, query])
  if (parts.length === 1) return <>{text}</>
  return (
    <>
      {parts[0]}
      <span className="hl">{parts[1]}</span>
      {parts[2]}
    </>
  )
}

export function EmptyState({ emoji, title, sub }: { emoji: string; title: string; sub?: string }) {
  return (
    <div className="empty">
      <div className="empty-emoji">{emoji}</div>
      <h3>{title}</h3>
      {sub && <p className="muted" style={{ marginTop: 6 }}>{sub}</p>}
    </div>
  )
}
