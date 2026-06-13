import { useMemo, useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { RotateCw, ArrowLeft, ArrowRight, Check, X, Shuffle } from 'lucide-react'
import { useStore } from '../store'
import { allFlashcards, SUBJECT_META } from '../lib/selectors'
import type { Flashcard, FlashcardType, SubjectId } from '../types'
import { EmptyState, toast } from '../components/ui'

const TYPE_LABEL: Record<FlashcardType, string> = {
  'term-def': 'Термин → определение',
  'def-term': 'Определение → термин',
  'scientist-theory': 'Учёный → теория',
  'theory-scientist': 'Теория → автор',
  qa: 'Вопрос → ответ',
  cloze: 'Пропущенное слово',
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Cards() {
  const { subject } = useParams<{ subject?: SubjectId }>()
  const [subj, setSubj] = useState<SubjectId | 'all'>(subject || 'all')
  const [type, setType] = useState<FlashcardType | 'all'>('all')
  const recordCard = useStore((s) => s.recordCard)

  const deck = useMemo(() => {
    let cards = allFlashcards(subj === 'all' ? undefined : subj)
    if (type !== 'all') cards = cards.filter((c) => c.type === type)
    return shuffle(cards)
  }, [subj, type])

  const [cards, setCards] = useState<Flashcard[]>(deck)
  const [i, setI] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState(0)
  const [seen, setSeen] = useState(0)

  useEffect(() => {
    setCards(deck)
    setI(0)
    setFlipped(false)
    setKnown(0)
    setSeen(0)
  }, [deck])

  const card = cards[i]

  function advance(didKnow?: boolean) {
    recordCard()
    if (didKnow) setKnown((k) => k + 1)
    setSeen((s) => s + 1)
    setFlipped(false)
    setTimeout(() => {
      if (i + 1 >= cards.length) {
        toast('🃏', `Колода пройдена! Знал: ${known + (didKnow ? 1 : 0)}/${seen + 1}`)
        setCards(shuffle(cards))
        setI(0)
      } else {
        setI((x) => x + 1)
      }
    }, 180)
  }

  return (
    <div className="stack" style={{ gap: 18 }}>
      <div className="row between wrap" style={{ gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26 }}>Карточки</h1>
          <p className="faint" style={{ fontSize: 13 }}>
            Листайте как в Anki: кликните, чтобы перевернуть · {cards.length} карточек в колоде
          </p>
        </div>
        <button className="btn btn-sm" onClick={() => setCards(shuffle(cards))}>
          <Shuffle size={15} /> Перемешать
        </button>
      </div>

      <div className="row wrap" style={{ gap: 8 }}>
        <button className={`chip ${subj === 'all' ? 'chip-accent' : ''}`} onClick={() => setSubj('all')} style={{ cursor: 'pointer' }}>
          Все предметы
        </button>
        {SUBJECT_META.map((s) => (
          <button key={s.id} className={`chip ${subj === s.id ? 'chip-accent' : ''}`} onClick={() => setSubj(s.id)} style={{ cursor: 'pointer' }}>
            {s.icon} {s.short}
          </button>
        ))}
      </div>
      <div className="row wrap" style={{ gap: 8 }}>
        <button className={`chip ${type === 'all' ? 'chip-accent' : ''}`} onClick={() => setType('all')} style={{ cursor: 'pointer' }}>
          Все типы
        </button>
        {(Object.keys(TYPE_LABEL) as FlashcardType[]).map((t) => (
          <button key={t} className={`chip ${type === t ? 'chip-accent' : ''}`} onClick={() => setType(t)} style={{ cursor: 'pointer' }}>
            {TYPE_LABEL[t]}
          </button>
        ))}
      </div>

      {!card ? (
        <EmptyState emoji="🃏" title="Нет карточек" sub="Измените фильтры выше." />
      ) : (
        <>
          <div className="row between faint" style={{ fontSize: 13 }}>
            <span>
              Карточка {i + 1} / {cards.length}
            </span>
            <span>
              ✅ Знаю: {known} · 👀 Просмотрено: {seen}
            </span>
          </div>

          <div className="flip-scene">
            <div className={`flip-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped((f) => !f)}>
              <div className="flip-face">
                <span className="chip chip-accent flip-kind">{TYPE_LABEL[card.type]}</span>
                <span className="chip flip-kind" style={{ left: 'auto', right: 16 }}>
                  {SUBJECT_META.find((s) => s.id === card.subject)?.icon}
                </span>
                <h2 style={{ fontSize: 24, lineHeight: 1.35 }}>{card.front}</h2>
                <span className="flip-hint">
                  <RotateCw size={13} style={{ verticalAlign: -2 }} /> нажмите, чтобы увидеть ответ
                </span>
              </div>
              <div className="flip-face flip-back">
                <span className="chip chip-accent flip-kind">Ответ</span>
                <p style={{ fontSize: 19, lineHeight: 1.5 }}>{card.back}</p>
              </div>
            </div>
          </div>

          <div className="row" style={{ gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-icon" onClick={() => { setI((x) => Math.max(0, x - 1)); setFlipped(false) }} disabled={i === 0}>
              <ArrowLeft size={18} />
            </button>
            {!flipped ? (
              <button className="btn btn-primary" style={{ minWidth: 200 }} onClick={() => setFlipped(true)}>
                <RotateCw size={17} /> Показать ответ
              </button>
            ) : (
              <>
                <button className="btn grade-0" style={{ borderColor: 'var(--red)', minWidth: 130 }} onClick={() => advance(false)}>
                  <X size={17} /> Не помню
                </button>
                <button className="btn grade-3" style={{ borderColor: 'var(--green)', minWidth: 130 }} onClick={() => advance(true)}>
                  <Check size={17} /> Помню
                </button>
              </>
            )}
            <button className="btn btn-icon" onClick={() => { setFlipped(false); advance() }}>
              <ArrowRight size={18} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
