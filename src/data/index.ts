import type {
  AuthoredTest,
  DateEntry,
  Definition,
  Mnemonic,
  QA,
  Scientist,
  Sequence,
  Subject,
  SubjectId,
  Ticket,
} from '../types'
import { psychologyRaw } from './psychology'
import { sociologyRaw } from './sociology'
import { economicsRaw } from './economics'

export interface RawTicket {
  number: number
  title: string
  full: string[]
  summary: string
  outline: string[]
  theses: string[]
  definitions?: Definition[]
  terms?: string[]
  dates?: DateEntry[]
  scientists?: Scientist[]
  examples?: string[]
  examQuestions?: string[]
  qa?: QA[]
  mnemonics?: Mnemonic[]
  tests?: AuthoredTest[]
  sequences?: Sequence[]
}

function normalize(subject: SubjectId, r: RawTicket): Ticket {
  return {
    id: `${subject}-${r.number}`,
    subject,
    number: r.number,
    title: r.title,
    full: r.full,
    summary: r.summary,
    outline: r.outline,
    theses: r.theses,
    definitions: r.definitions || [],
    terms: r.terms || (r.definitions || []).map((d) => d.term),
    dates: r.dates || [],
    scientists: r.scientists || [],
    examples: r.examples || [],
    examQuestions: r.examQuestions || [],
    qa: r.qa || [],
    mnemonics: r.mnemonics || [],
    tests: r.tests,
    sequences: r.sequences,
  }
}

export const SUBJECTS: Subject[] = [
  {
    id: 'psychology',
    title: 'Психология',
    short: 'Психология',
    source: 'Лекции В. В. Петухова + проверенные открытые источники',
    icon: '🧠',
    accent: '#22d3c5',
    tickets: psychologyRaw.map((r) => normalize('psychology', r)),
  },
  {
    id: 'sociology',
    title: 'Социология',
    short: 'Социология',
    source: 'Фролов, Гидденс + проверенные открытые источники',
    icon: '🌍',
    accent: '#5b8def',
    tickets: sociologyRaw.map((r) => normalize('sociology', r)),
  },
  {
    id: 'economics',
    title: 'Экономическая теория',
    short: 'Экономика',
    source: 'Чепурин, Киселёва + проверенные открытые источники',
    icon: '📈',
    accent: '#f5a623',
    tickets: economicsRaw.map((r) => normalize('economics', r)),
  },
]

export const ALL_TICKETS: Ticket[] = SUBJECTS.flatMap((s) => s.tickets)

export function getSubject(id: SubjectId): Subject {
  return SUBJECTS.find((s) => s.id === id)!
}

export function getTicket(id: string): Ticket | undefined {
  return ALL_TICKETS.find((t) => t.id === id)
}

export function subjectPool(id: SubjectId): Ticket[] {
  return getSubject(id).tickets
}
