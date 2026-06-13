import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { DayActivity, Grade, TicketProgress } from './types'
import { applyGrade, freshProgress } from './lib/srs'
import { XP } from './lib/gamification'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

interface Counters {
  cardsViewed: number
  testsTaken: number
  examAttempts: number
  perfectRecalls: number
}

interface AppState {
  theme: 'light' | 'dark'
  dailyGoal: number
  progress: Record<string, TicketProgress>
  activity: Record<string, DayActivity>
  xp: number
  counters: Counters
  unlocked: string[]
  lastActiveDate: string
  streak: number

  toggleTheme: () => void
  setDailyGoal: (n: number) => void
  getProgress: (id: string) => TicketProgress
  markStudied: (id: string) => void
  gradeTicket: (id: string, grade: Grade) => void
  recordTest: (id: string, score: number) => void
  recordCard: () => void
  recordExam: (id: string, score: number) => void
  addXp: (amount: number) => void
  unlock: (id: string) => void
  resetAll: () => void
  _touchDay: (patch: Partial<DayActivity>) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      dailyGoal: 12,
      progress: {},
      activity: {},
      xp: 0,
      counters: { cardsViewed: 0, testsTaken: 0, examAttempts: 0, perfectRecalls: 0 },
      unlocked: [],
      lastActiveDate: today(),
      streak: 1,

      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setDailyGoal: (n) => set({ dailyGoal: Math.max(1, n) }),

      getProgress: (id) => get().progress[id] || freshProgress(id),

      _touchDay: (patch) =>
        set((s) => {
          const d = today()
          const cur = s.activity[d] || {
            date: d,
            studied: 0,
            reviewed: 0,
            testsTaken: 0,
            xp: 0,
            minutes: 0,
          }
          // обновление серии
          let streak = s.streak
          let lastActiveDate = s.lastActiveDate
          if (lastActiveDate !== d) {
            const prev = new Date(d)
            prev.setDate(prev.getDate() - 1)
            streak = lastActiveDate === prev.toISOString().slice(0, 10) ? streak + 1 : 1
            lastActiveDate = d
          }
          const merged: DayActivity = {
            ...cur,
            studied: cur.studied + (patch.studied || 0),
            reviewed: cur.reviewed + (patch.reviewed || 0),
            testsTaken: cur.testsTaken + (patch.testsTaken || 0),
            xp: cur.xp + (patch.xp || 0),
            minutes: cur.minutes + (patch.minutes || 0),
          }
          return { activity: { ...s.activity, [d]: merged }, streak, lastActiveDate }
        }),

      addXp: (amount) => {
        set((s) => ({ xp: s.xp + amount }))
        get()._touchDay({ xp: amount, minutes: 0 })
      },

      markStudied: (id) =>
        set((s) => {
          const p = s.progress[id] || freshProgress(id)
          if (p.studied) return s
          const np = { ...p, studied: true, lastSeen: Date.now() }
          return { progress: { ...s.progress, [id]: np } }
        }),

      gradeTicket: (id, grade) => {
        set((s) => {
          const p = s.progress[id] || freshProgress(id)
          return { progress: { ...s.progress, [id]: applyGrade(p, grade) } }
        })
        const wasStudied = !!get().progress[id]?.studied
        get()._touchDay({ studied: wasStudied ? 0 : 1, reviewed: 1, minutes: 2 })
        get().addXp(XP.recall(grade) + (grade >= 0 ? 0 : 0))
        if (grade === 3) set((s) => ({ counters: { ...s.counters, perfectRecalls: s.counters.perfectRecalls + 1 } }))
      },

      recordTest: (id, score) => {
        set((s) => {
          const p = s.progress[id] || freshProgress(id)
          return {
            progress: { ...s.progress, [id]: { ...p, testScores: [...p.testScores, score] } },
            counters: { ...s.counters, testsTaken: s.counters.testsTaken + 1 },
          }
        })
        get()._touchDay({ testsTaken: 1, minutes: 3 })
        get().addXp(XP.testComplete + Math.round(score * 10) * XP.testCorrect)
      },

      recordCard: () => {
        set((s) => ({ counters: { ...s.counters, cardsViewed: s.counters.cardsViewed + 1 } }))
        get().addXp(XP.card)
      },

      recordExam: (id, score) => {
        set((s) => {
          const p = s.progress[id] || freshProgress(id)
          return {
            progress: { ...s.progress, [id]: { ...p, testScores: [...p.testScores, score], lastSeen: Date.now() } },
            counters: { ...s.counters, examAttempts: s.counters.examAttempts + 1 },
          }
        })
        get()._touchDay({ minutes: 5 })
        get().addXp(XP.examAttempt)
      },

      unlock: (id) => set((s) => (s.unlocked.includes(id) ? s : { unlocked: [...s.unlocked, id] })),

      resetAll: () =>
        set({
          progress: {},
          activity: {},
          xp: 0,
          counters: { cardsViewed: 0, testsTaken: 0, examAttempts: 0, perfectRecalls: 0 },
          unlocked: [],
          streak: 1,
          lastActiveDate: today(),
        }),
    }),
    { name: 'modul-trainer-v1' },
  ),
)
