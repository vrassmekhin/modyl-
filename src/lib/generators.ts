import type {
  Flashcard,
  TestQuestion,
  Ticket,
  SubjectId,
} from '../types'

// Детерминированный псевдослучайный генератор (стабильные тесты между сессиями)
function seeded(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  return Math.abs(h)
}

function shuffle<T>(arr: T[], rnd: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickDistractors(pool: string[], correct: string, n: number, rnd: () => number): string[] {
  const others = shuffle(pool.filter((x) => x && x !== correct), rnd)
  return others.slice(0, n)
}

// ===== Flashcards =====

export function generateFlashcards(ticket: Ticket): Flashcard[] {
  const cards: Flashcard[] = []
  const base = ticket.id

  ticket.definitions.forEach((d, i) => {
    cards.push({
      id: `${base}-tdef-${i}`,
      ticketId: ticket.id,
      subject: ticket.subject,
      type: 'term-def',
      front: d.term,
      back: d.definition,
    })
    cards.push({
      id: `${base}-dterm-${i}`,
      ticketId: ticket.id,
      subject: ticket.subject,
      type: 'def-term',
      front: d.definition,
      back: d.term,
    })
  })

  ticket.scientists.forEach((s, i) => {
    cards.push({
      id: `${base}-sci-${i}`,
      ticketId: ticket.id,
      subject: ticket.subject,
      type: 'scientist-theory',
      front: s.name,
      back: s.contribution,
    })
    cards.push({
      id: `${base}-theo-${i}`,
      ticketId: ticket.id,
      subject: ticket.subject,
      type: 'theory-scientist',
      front: s.contribution,
      back: s.name,
    })
  })

  ticket.qa.forEach((q, i) => {
    cards.push({
      id: `${base}-qa-${i}`,
      ticketId: ticket.id,
      subject: ticket.subject,
      type: 'qa',
      front: q.q,
      back: q.a,
    })
  })

  // Пропущенное слово — из тезисов
  ticket.theses.forEach((t, i) => {
    const cloze = makeCloze(t, ticket.terms)
    if (cloze) {
      cards.push({
        id: `${base}-cloze-${i}`,
        ticketId: ticket.id,
        subject: ticket.subject,
        type: 'cloze',
        front: cloze.masked,
        back: cloze.answer,
      })
    }
  })

  return cards
}

function makeCloze(thesis: string, terms: string[]): { masked: string; answer: string } | null {
  const sorted = [...terms].sort((a, b) => b.length - a.length)
  for (const term of sorted) {
    if (term.length < 4) continue
    const idx = thesis.toLowerCase().indexOf(term.toLowerCase())
    if (idx >= 0) {
      const masked = thesis.slice(0, idx) + '_____' + thesis.slice(idx + term.length)
      return { masked, answer: term }
    }
  }
  return null
}

// ===== Tests =====

export function generateTests(ticket: Ticket, subjectPool: Ticket[]): TestQuestion[] {
  const rnd = seeded(hash(ticket.id) + 7)
  const out: TestQuestion[] = []

  const allDefs = subjectPool.flatMap((t) => t.definitions)
  const defPool = allDefs.map((d) => d.definition)
  const termPool = allDefs.map((d) => d.term)
  const sciPool = subjectPool.flatMap((t) => t.scientists)

  // 1) Single choice: термин → определение
  ticket.definitions.slice(0, 4).forEach((d, i) => {
    const distractors = pickDistractors(defPool, d.definition, 3, rnd)
    if (distractors.length < 3) return
    const opts = shuffle([d.definition, ...distractors], rnd)
    out.push({
      id: `${ticket.id}-t-single-${i}`,
      ticketId: ticket.id,
      subject: ticket.subject,
      type: 'single',
      prompt: `Что такое «${d.term}»?`,
      options: opts,
      correct: [opts.indexOf(d.definition)],
      explanation: `${d.term} — ${d.definition}`,
    })
  })

  // 2) Single choice: определение → термин
  ticket.definitions.slice(0, 3).forEach((d, i) => {
    const distractors = pickDistractors(termPool, d.term, 3, rnd)
    if (distractors.length < 3) return
    const opts = shuffle([d.term, ...distractors], rnd)
    out.push({
      id: `${ticket.id}-t-term-${i}`,
      ticketId: ticket.id,
      subject: ticket.subject,
      type: 'single',
      prompt: `Какой термин обозначает: «${d.definition}»?`,
      options: opts,
      correct: [opts.indexOf(d.term)],
      explanation: `Это ${d.term}.`,
    })
  })

  // 3) Single choice: учёный → вклад
  ticket.scientists.slice(0, 3).forEach((s, i) => {
    const pool = sciPool.map((x) => x.contribution)
    const distractors = pickDistractors(pool, s.contribution, 3, rnd)
    if (distractors.length < 3) return
    const opts = shuffle([s.contribution, ...distractors], rnd)
    out.push({
      id: `${ticket.id}-t-sci-${i}`,
      ticketId: ticket.id,
      subject: ticket.subject,
      type: 'single',
      prompt: `Что связано с именем «${s.name}»?`,
      options: opts,
      correct: [opts.indexOf(s.contribution)],
      explanation: `${s.name}: ${s.contribution}`,
    })
  })

  // 4) Авторские тесты (single/multiple)
  ;(ticket.tests || []).forEach((t, i) => {
    out.push({
      id: `${ticket.id}-t-auth-${i}`,
      ticketId: ticket.id,
      subject: ticket.subject,
      type: t.kind,
      prompt: t.question,
      options: t.options,
      correct: t.correct,
      explanation: t.explanation,
    })
  })

  // 5) Matching: термины ↔ определения
  if (ticket.definitions.length >= 3) {
    const chosen = shuffle(ticket.definitions, rnd).slice(0, Math.min(5, ticket.definitions.length))
    out.push({
      id: `${ticket.id}-t-match`,
      ticketId: ticket.id,
      subject: ticket.subject,
      type: 'matching',
      prompt: 'Сопоставьте термин и определение:',
      pairs: chosen.map((d) => ({ left: d.term, right: d.definition })),
      explanation: 'Соответствия терминов и их определений.',
    })
  }

  // 6) Sequence — если заданы последовательности
  ;(ticket.sequences || []).forEach((seq, i) => {
    out.push({
      id: `${ticket.id}-t-seq-${i}`,
      ticketId: ticket.id,
      subject: ticket.subject,
      type: 'sequence',
      prompt: seq.title,
      order: seq.steps,
      explanation: 'Верный порядок: ' + seq.steps.join(' → '),
    })
  })

  // 7) Open questions — из qa / экзаменационных вопросов
  ticket.qa.slice(0, 2).forEach((q, i) => {
    out.push({
      id: `${ticket.id}-t-open-${i}`,
      ticketId: ticket.id,
      subject: ticket.subject,
      type: 'open',
      prompt: q.q,
      reference: q.a,
      explanation: q.a,
    })
  })

  return out
}

// Упрощённая оценка открытого ответа по совпадению ключевых слов
export function scoreOpenAnswer(answer: string, reference: string): number {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .replace(/[.,;:!?()«»"'\-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 4)
  const ref = new Set(norm(reference))
  const ans = new Set(norm(answer))
  if (ref.size === 0) return answer.trim().length > 20 ? 1 : 0
  let hit = 0
  ref.forEach((w) => {
    if (ans.has(w)) hit++
  })
  return Math.min(1, hit / Math.max(1, Math.round(ref.size * 0.4)))
}
