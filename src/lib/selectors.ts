import { ALL_TICKETS, SUBJECTS, subjectPool } from '../data'
import type { SubjectId, Ticket } from '../types'
import { isDue, masteryPercent, ticketState, type TicketState } from './srs'
import { generateFlashcards, generateTests } from './generators'
import { useStore } from '../store'

export interface SubjectStats {
  id: SubjectId
  total: number
  studied: number
  mastery: number // %
  avgTest: number // %
  dueToday: number
  problem: number
}

export interface GlobalStats {
  total: number
  studied: number
  inProgress: number
  problem: number
  mastered: number
  readiness: number // %
  dueNow: number
  avgTest: number
}

type ProgressMap = ReturnType<typeof useStore.getState>['progress']

export function subjectStats(id: SubjectId, progress: ProgressMap): SubjectStats {
  const tickets = subjectPool(id)
  let studied = 0,
    masterySum = 0,
    dueToday = 0,
    problem = 0,
    testSum = 0,
    testCount = 0
  for (const t of tickets) {
    const p = progress[t.id]
    if (p?.studied) studied++
    masterySum += masteryPercent(p)
    if (p && isDue(p)) dueToday++
    if (ticketState(p) === 'problem') problem++
    if (p?.testScores.length) {
      testSum += p.testScores.reduce((a, b) => a + b, 0) / p.testScores.length
      testCount++
    }
  }
  return {
    id,
    total: tickets.length,
    studied,
    mastery: Math.round(masterySum / tickets.length),
    avgTest: testCount ? Math.round((testSum / testCount) * 100) : 0,
    dueToday,
    problem,
  }
}

export function globalStats(progress: ProgressMap): GlobalStats {
  const total = ALL_TICKETS.length
  let studied = 0,
    inProgress = 0,
    problem = 0,
    mastered = 0,
    masterySum = 0,
    dueNow = 0,
    testSum = 0,
    testCount = 0
  for (const t of ALL_TICKETS) {
    const p = progress[t.id]
    const st = ticketState(p)
    if (p?.studied) studied++
    if (st === 'learning' || st === 'review') inProgress++
    if (st === 'problem') problem++
    if (st === 'mastered') mastered++
    masterySum += masteryPercent(p)
    if (p && isDue(p)) dueNow++
    if (p?.testScores.length) {
      testSum += p.testScores.reduce((a, b) => a + b, 0) / p.testScores.length
      testCount++
    }
  }
  return {
    total,
    studied,
    inProgress,
    problem,
    mastered,
    readiness: Math.round(masterySum / total),
    dueNow,
    avgTest: testCount ? Math.round((testSum / testCount) * 100) : 0,
  }
}

export function dueTickets(progress: ProgressMap): Ticket[] {
  return ALL_TICKETS.filter((t) => {
    const p = progress[t.id]
    return p && isDue(p)
  }).sort((a, b) => (progress[a.id]?.due || 0) - (progress[b.id]?.due || 0))
}

export function upcomingReviews(progress: ProgressMap, limit = 6): { ticket: Ticket; due: number }[] {
  return ALL_TICKETS.filter((t) => progress[t.id]?.studied && progress[t.id]?.due)
    .map((t) => ({ ticket: t, due: progress[t.id]!.due }))
    .sort((a, b) => a.due - b.due)
    .slice(0, limit)
}

// Кэш генерации (стабильно между рендерами)
const fcCache = new Map<string, ReturnType<typeof generateFlashcards>>()
const testCache = new Map<string, ReturnType<typeof generateTests>>()

export function flashcardsFor(ticket: Ticket) {
  if (!fcCache.has(ticket.id)) fcCache.set(ticket.id, generateFlashcards(ticket))
  return fcCache.get(ticket.id)!
}

export function testsFor(ticket: Ticket) {
  if (!testCache.has(ticket.id)) testCache.set(ticket.id, generateTests(ticket, subjectPool(ticket.subject)))
  return testCache.get(ticket.id)!
}

export function allFlashcards(subject?: SubjectId) {
  const tickets = subject ? subjectPool(subject) : ALL_TICKETS
  return tickets.flatMap(flashcardsFor)
}

export function weakestTickets(progress: ProgressMap, n = 5): Ticket[] {
  return [...ALL_TICKETS]
    .filter((t) => progress[t.id]?.studied)
    .sort((a, b) => masteryPercent(progress[a.id]) - masteryPercent(progress[b.id]))
    .slice(0, n)
}

export function strongestTickets(progress: ProgressMap, n = 5): Ticket[] {
  return [...ALL_TICKETS]
    .filter((t) => progress[t.id]?.studied)
    .sort((a, b) => masteryPercent(progress[b.id]) - masteryPercent(progress[a.id]))
    .slice(0, n)
}

export const STATE_META: Record<TicketState, { label: string; cls: string }> = {
  new: { label: 'Новый', cls: 'tag-new' },
  learning: { label: 'В работе', cls: 'tag-learning' },
  review: { label: 'К повторению', cls: 'tag-review' },
  problem: { label: 'Проблемный', cls: 'tag-problem' },
  mastered: { label: 'Освоен', cls: 'tag-mastered' },
}

export const SUBJECT_META = SUBJECTS
