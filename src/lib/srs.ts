import type { Grade, TicketProgress } from '../types'

// Экзамен после 16 июня. На подготовку 3 полных дня: 14, 15, 16 июня.
// Алгоритм интервального повторения сжат под короткое окно (часы, не дни).
export const EXAM_DATE = new Date('2026-06-17T09:00:00')
export const PREP_DAYS = ['2026-06-14', '2026-06-15', '2026-06-16']

const HOUR = 60 * 60 * 1000

// Базовые интервалы (в часах) под трёхдневное окно
const BASE_INTERVALS: Record<Grade, number> = {
  0: 0.2, // ~12 минут — повторить почти сразу
  1: 2, // через 2 часа
  2: 8, // через 8 часов (на следующую сессию/день)
  3: 20, // через ~сутки
}

export function freshProgress(ticketId: string): TicketProgress {
  return {
    ticketId,
    studied: false,
    level: 0,
    ease: 2.3,
    intervalH: 0,
    due: 0,
    history: [],
    testScores: [],
    lastSeen: 0,
  }
}

/** Пересчёт расписания по оценке active recall */
export function applyGrade(p: TicketProgress, grade: Grade): TicketProgress {
  const now = Date.now()
  let { ease, intervalH, level } = p

  if (grade === 0) {
    ease = Math.max(1.5, ease - 0.25)
    intervalH = BASE_INTERVALS[0]
    level = Math.max(0, level - 1)
  } else {
    // плавная подстройка лёгкости
    ease = Math.min(3.0, ease + (grade === 3 ? 0.12 : grade === 2 ? 0.03 : -0.1))
    if (p.intervalH <= 0) {
      intervalH = BASE_INTERVALS[grade]
    } else {
      const mult = grade === 1 ? 1.3 : grade === 2 ? ease : ease * 1.35
      intervalH = Math.max(BASE_INTERVALS[grade], p.intervalH * mult)
    }
    level = Math.min(5, level + (grade === 3 ? 1.5 : grade === 2 ? 1 : 0.5))
  }

  // Не назначаем повторение позже начала экзамена
  let due = now + intervalH * HOUR
  if (due > EXAM_DATE.getTime()) due = EXAM_DATE.getTime() - HOUR

  return {
    ...p,
    studied: true,
    ease,
    intervalH,
    level: Math.round(level * 10) / 10,
    due,
    lastSeen: now,
    history: [...p.history, { ts: now, grade }],
  }
}

export function isDue(p: TicketProgress, at: number = Date.now()): boolean {
  return p.studied && p.due > 0 && p.due <= at
}

/** Категория билета: new / learning / review / problem / mastered */
export type TicketState = 'new' | 'learning' | 'problem' | 'review' | 'mastered'

export function ticketState(p: TicketProgress | undefined): TicketState {
  if (!p || !p.studied) return 'new'
  const recent = p.history.slice(-3)
  const fails = recent.filter((h) => h.grade === 0).length
  if (fails >= 2 || (p.level < 1.5 && p.history.length >= 2)) return 'problem'
  if (p.level >= 4) return 'mastered'
  if (isDue(p)) return 'review'
  return 'learning'
}

/** Среднее качество знания билета в процентах */
export function masteryPercent(p: TicketProgress | undefined): number {
  if (!p || !p.studied) return 0
  return Math.round((Math.min(5, p.level) / 5) * 100)
}

export function relativeDue(due: number, now: number = Date.now()): string {
  if (!due) return '—'
  const diff = due - now
  if (diff <= 0) return 'сейчас'
  const h = diff / HOUR
  if (h < 1) return `через ${Math.round(h * 60)} мин`
  if (h < 24) return `через ${Math.round(h)} ч`
  return `через ${Math.round(h / 24)} дн`
}
