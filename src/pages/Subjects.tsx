import { Link } from 'react-router-dom'
import { useStore } from '../store'
import { subjectStats, SUBJECT_META } from '../lib/selectors'
import { Ring, ProgressBar } from '../components/ui'
import { Layers, ListChecks, RotateCcw } from 'lucide-react'

export default function Subjects() {
  const progress = useStore((s) => s.progress)
  return (
    <div className="stack" style={{ gap: 20 }}>
      <div>
        <h1 style={{ fontSize: 26 }}>Предметы экзамена</h1>
        <p className="muted" style={{ marginTop: 6 }}>
          Три дисциплины комплексного модульного экзамена. Выберите предмет, чтобы перейти к билетам.
        </p>
      </div>
      <div className="stack" style={{ gap: 18 }}>
        {SUBJECT_META.map((s) => {
          const st = subjectStats(s.id, progress)
          return (
            <div key={s.id} className="card card-pad" style={{ padding: 24 }}>
              <div className="row between wrap" style={{ gap: 20 }}>
                <div className="row" style={{ gap: 18, minWidth: 0 }}>
                  <div className="stat-ico" style={{ width: 64, height: 64, fontSize: 36, borderRadius: 18, background: `${s.accent}22` }}>
                    {s.icon}
                  </div>
                  <div>
                    <h2 style={{ fontSize: 22 }}>{s.title}</h2>
                    <p className="faint" style={{ fontSize: 13, marginTop: 4, maxWidth: 420 }}>
                      Источник: {s.source}
                    </p>
                  </div>
                </div>
                <Ring value={st.mastery} size={88} stroke={9} color={s.accent} caption="освоение" />
              </div>

              <div style={{ margin: '18px 0' }}>
                <ProgressBar value={st.mastery} color={s.accent} />
              </div>

              <div className="grid grid-4" style={{ gap: 12 }}>
                <Mini label="Билетов" value={st.total} />
                <Mini label="Изучено" value={`${st.studied}/${st.total}`} />
                <Mini label="Средний балл" value={`${st.avgTest}%`} />
                <Mini label="Повторений сегодня" value={st.dueToday} accent={st.dueToday > 0} />
              </div>

              <div className="row wrap" style={{ gap: 10, marginTop: 18 }}>
                <Link to={`/subject/${s.id}`} className="btn btn-primary">
                  Открыть билеты
                </Link>
                <Link to={`/cards/${s.id}`} className="btn">
                  <Layers size={17} /> Карточки
                </Link>
                <Link to={`/tests`} className="btn">
                  <ListChecks size={17} /> Тесты
                </Link>
                {st.dueToday > 0 && (
                  <span className="chip tag-review" style={{ marginLeft: 'auto' }}>
                    <RotateCcw size={13} /> {st.dueToday} к повторению
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Mini({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <div className="card card-pad" style={{ padding: 14, background: 'var(--surface)' }}>
      <div className="stat-val" style={{ fontSize: 22, color: accent ? 'var(--teal-400)' : undefined }}>
        {value}
      </div>
      <div className="stat-label" style={{ fontSize: 12 }}>
        {label}
      </div>
    </div>
  )
}
