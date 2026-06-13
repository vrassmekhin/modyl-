// ===== Core domain types =====

export type SubjectId = 'psychology' | 'sociology' | 'economics'

export interface Definition {
  term: string
  definition: string
}

export interface Scientist {
  name: string
  contribution: string
}

export interface DateEntry {
  date: string
  event: string
}

export interface QA {
  q: string
  a: string
}

export interface Mnemonic {
  /** тип приёма: ассоциация / аббревиатура / история / образ / метод */
  type: 'Ассоциация' | 'Аббревиатура' | 'История' | 'Образ' | 'Метод'
  text: string
}

/** Необязательный авторский тест внутри билета */
export interface AuthoredTest {
  kind: 'single' | 'multiple'
  question: string
  options: string[]
  /** индексы правильных вариантов */
  correct: number[]
  explanation: string
}

/** Упорядоченная последовательность (для заданий «установить порядок») */
export interface Sequence {
  title: string
  steps: string[]
}

export interface Ticket {
  id: string
  subject: SubjectId
  number: number
  title: string
  /** Полный ответ — массив абзацев (строки могут начинаться с "• " для списков, "## " для подзаголовков) */
  full: string[]
  /** Краткий конспект */
  summary: string
  /** Схема-конспект — структура ответа */
  outline: string[]
  /** Ключевые тезисы */
  theses: string[]
  definitions: Definition[]
  terms: string[]
  dates: DateEntry[]
  scientists: Scientist[]
  examples: string[]
  /** Типичные экзаменационные вопросы */
  examQuestions: string[]
  /** Пары вопрос→ответ для карточек и открытых заданий */
  qa: QA[]
  mnemonics: Mnemonic[]
  /** Необязательные авторские тесты */
  tests?: AuthoredTest[]
  /** Необязательные последовательности */
  sequences?: Sequence[]
}

export interface Subject {
  id: SubjectId
  title: string
  short: string
  source: string
  icon: string
  accent: string
  tickets: Ticket[]
}

// ===== Auto-generated learning items =====

export type FlashcardType =
  | 'term-def'
  | 'def-term'
  | 'scientist-theory'
  | 'theory-scientist'
  | 'qa'
  | 'cloze'

export interface Flashcard {
  id: string
  ticketId: string
  subject: SubjectId
  type: FlashcardType
  front: string
  back: string
}

export type TestQuestionType =
  | 'single'
  | 'multiple'
  | 'matching'
  | 'sequence'
  | 'open'

export interface TestQuestion {
  id: string
  ticketId: string
  subject: SubjectId
  type: TestQuestionType
  prompt: string
  options?: string[]
  correct?: number[]
  /** для matching: пары левая→правая */
  pairs?: { left: string; right: string }[]
  /** для sequence: правильный порядок строк */
  order?: string[]
  /** эталонный ответ для открытых вопросов */
  reference?: string
  explanation: string
}

// ===== Spaced repetition / progress =====

/** Оценка active recall */
export type Grade = 0 | 1 | 2 | 3 // не вспомнил / частично / хорошо / идеально

export interface ReviewEvent {
  ts: number
  grade: Grade
}

export interface TicketProgress {
  ticketId: string
  studied: boolean
  /** уровень знания 0..5 */
  level: number
  ease: number
  /** интервал в часах */
  intervalH: number
  due: number // timestamp следующего повторения
  history: ReviewEvent[]
  /** результаты тестов (доля правильных 0..1) */
  testScores: number[]
  lastSeen: number
}

export interface DayActivity {
  date: string // YYYY-MM-DD
  studied: number
  reviewed: number
  testsTaken: number
  xp: number
  minutes: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  goal: number
}
