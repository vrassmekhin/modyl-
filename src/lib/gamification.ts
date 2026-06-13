import type { Achievement } from '../types'

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'study-1', title: 'Первый шаг', description: 'Изучить первый билет', icon: '🌱', goal: 1 },
  { id: 'study-10', title: 'Разогрев', description: 'Изучить 10 билетов', icon: '🔥', goal: 10 },
  { id: 'study-30', title: 'Серьёзный настрой', description: 'Изучить 30 билетов', icon: '⚡', goal: 30 },
  { id: 'study-50', title: 'Марафонец', description: 'Изучить 50 билетов', icon: '🏃', goal: 50 },
  { id: 'study-100', title: 'Энциклопедист', description: 'Изучить 100 билетов', icon: '📚', goal: 100 },
  { id: 'perfect-20', title: 'Перфекционист', description: 'Идеально ответить на 20 билетов', icon: '💎', goal: 20 },
  { id: 'cards-100', title: 'Картёжник', description: 'Просмотреть 100 карточек', icon: '🃏', goal: 100 },
  { id: 'tests-20', title: 'Тестировщик', description: 'Пройти 20 тестов', icon: '✅', goal: 20 },
  { id: 'streak-3', title: 'Три дня подряд', description: 'Учиться 3 дня без пропусков', icon: '📅', goal: 3 },
  { id: 'exam-5', title: 'Экзаменатор', description: 'Пройти 5 экзаменационных попыток', icon: '🎓', goal: 5 },
  { id: 'mastered-10', title: 'Мастер', description: 'Довести 10 билетов до уровня «освоено»', icon: '👑', goal: 10 },
  { id: 'xp-1000', title: 'Тысячник', description: 'Набрать 1000 XP', icon: '🚀', goal: 1000 },
]

// Уровни: кумулятивный XP. Каждый следующий уровень дороже.
export function levelFromXp(xp: number): { level: number; cur: number; need: number; into: number } {
  let level = 1
  let need = 100
  let acc = 0
  while (xp >= acc + need) {
    acc += need
    level++
    need = Math.round(need * 1.35)
  }
  return { level, cur: xp - acc, need, into: (xp - acc) / need }
}

export const XP = {
  study: 15,
  recall: (grade: number) => [2, 5, 10, 15][grade] ?? 5,
  card: 1,
  testCorrect: 3,
  testComplete: 10,
  examAttempt: 20,
  dailyGoal: 50,
}
