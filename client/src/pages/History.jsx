import { useState, useEffect } from 'react'
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'

const HISTORY_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    background-color: #0f0f1a;
    color: #e2e8f0;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  .glass-card {
    background: rgba(30,30,53,0.7);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(99,102,241,0.15);
    border-radius: 1rem;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }

  .gradient-text {
    background: linear-gradient(135deg, #818cf8 0%, #34d399 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .bg-mesh {
    background-color: #0f0f1a;
    background-image:
      radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(52,211,153,0.10) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(79,70,229,0.08) 0%, transparent 70%);
    min-height: 100vh;
  }

  .navbar {
    display: flex; align-items: center; justify-content: space-between;
    gap: 1rem; padding: 1.3rem 2.2rem; margin: 1rem auto 1.5rem;
    max-width: 1700px; width: min(100%, 1650px);
  }
  .navbar-brand { display: flex; align-items: center; gap: 0.75rem; }
  .navbar-logo {
    display: grid; place-items: center; width: 2.5rem; height: 2.5rem;
    border-radius: 9999px;
    background: linear-gradient(135deg, #4f46e5, #10b981);
    font-size: 1.1rem; box-shadow: 0 8px 20px rgba(99,102,241,0.24);
  }
  .navbar-brand h1 { font-size: 1rem; font-weight: 700; color: white; }
  .navbar-brand p  { font-size: 0.8rem; color: rgba(226,232,240,0.72); }
  .navbar-links { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
  .nav-link {
    padding: 0.6rem 0.9rem; border-radius: 9999px; color: #cbd5e1;
    text-decoration: none; font-weight: 600; transition: all 0.2s ease;
  }
  .nav-link:hover { background: rgba(99,102,241,0.12); color: white; }
  .nav-link.active {
    background: linear-gradient(135deg, #4f46e5, #6366f1);
    color: white; box-shadow: 0 6px 16px rgba(99,102,241,0.25);
  }
  .btn-outline {
    background: transparent; color: #818cf8; font-weight: 600;
    padding: 0.625rem 1.5rem; border-radius: 0.5rem;
    border: 1px solid rgba(99,102,241,0.4); cursor: pointer;
    transition: all 0.2s ease; display: inline-flex; align-items: center; gap: 0.5rem;
  }
  .btn-outline:hover { background: rgba(99,102,241,0.1); border-color: #818cf8; }

  .input-field {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: 0.5rem;
    padding: 0.6rem 0.875rem;
    color: #e2e8f0;
    font-size: 0.875rem;
    outline: none;
    transition: all 0.2s ease;
    font-family: inherit;
  }
  .input-field:focus {
    border-color: #818cf8;
    background: rgba(99,102,241,0.08);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
  }
  .input-field option { background: #1e1e35; }

  .stat-card {
    background: rgba(30,30,53,0.6);
    border: 1px solid rgba(99,102,241,0.12);
    border-radius: 1rem;
    padding: 1.25rem 1.5rem;
    transition: all 0.2s ease;
  }
  .stat-card:hover {
    border-color: rgba(99,102,241,0.3);
    box-shadow: 0 0 30px rgba(99,102,241,0.25);
    transform: translateY(-2px);
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .animate-fade-in-up { animation: fadeInUp 0.4s ease forwards; }
  .spinner {
    width: 2rem; height: 2rem;
    border: 2px solid rgba(255,255,255,0.1);
    border-top-color: #818cf8;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #16162a; }
  ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #818cf8; }
`

function useInjectStyles(css) {
  useEffect(() => {
    const el = document.createElement('style')
    el.setAttribute('data-history-styles', '')
    el.textContent = css
    document.head.appendChild(el)
    return () => el.remove()
  }, [])
}

function formatTime(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-PH', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
}

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${h}h ${m}m`
}

function durationToMinutes(start, end) {
  if (!start || !end) return 0
  const s = start.toDate ? start.toDate() : new Date(start)
  const e = end.toDate ? end.toDate() : new Date(end)
  return Math.max(0, (e - s) / 60000)
}

function getWeekRange(weeksAgo = 0) {
  const now = new Date()
  const day = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((day + 6) % 7) - weeksAgo * 7)
  monday.setHours(0, 0, 0, 0)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  return { start: monday, end: sunday }
}

function parseTime(referenceDate, timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(referenceDate)
  d.setHours(h, m, 0, 0)
  return d
}

function computeFallbackSummary(punch) {
  if (!punch.punchIn || !punch.punchOut) return null

  const punchIn = punch.punchIn.toDate ? punch.punchIn.toDate() : new Date(punch.punchIn)
  const punchOut = punch.punchOut.toDate ? punch.punchOut.toDate() : new Date(punch.punchOut)
  const scheduleStart = parseTime(punchIn, punch.schedule?.start ?? '09:00')
  const scheduleEnd = parseTime(punchIn, punch.schedule?.end ?? '18:00')

  const diffMinutes = (a, b) => (b - a) / 60000
  const late = Math.max(0, diffMinutes(scheduleStart, punchIn))
  const undertime = punchOut < scheduleEnd ? Math.max(0, diffMinutes(punchOut, scheduleEnd)) : 0
  const scheduledMinutes = diffMinutes(scheduleStart, scheduleEnd)
  const workStart = punchIn > scheduleStart ? punchIn : scheduleStart
  const workEnd = punchOut < scheduleEnd ? punchOut : scheduleEnd
  const regularRaw = workStart < workEnd ? diffMinutes(workStart, workEnd) : 0
  const regular = Math.min(regularRaw, scheduledMinutes)
  const overtime = punchOut > scheduleEnd ? diffMinutes(scheduleEnd, punchOut) : 0

  let nightDiff = 0
  let cursor = new Date(punchIn)
  while (cursor < punchOut) {
    const h = cursor.getHours()
    if (h >= 22 || h < 6) nightDiff += 1
    cursor = new Date(cursor.getTime() + 60000)
  }

  return {
    regular: Math.round(regular),
    overtime: Math.round(overtime),
    nightDiff: Math.round(nightDiff),
    late: Math.round(late),
    undertime: Math.round(undertime),
  }
}

const PERIOD_OPTIONS = [
  { label: 'This week',   value: 'this_week' },
  { label: 'Last week',   value: 'last_week' },
  { label: 'Last 30 days', value: 'last_30' },
  { label: 'All time',    value: 'all' },
]

export default function History() {
  useInjectStyles(HISTORY_STYLES)

  const { currentUser } = useAuth()
  const [punches, setPunches]   = useState([])
  const [summaries, setSummaries] = useState({})
  const [loading, setLoading]   = useState(true)
  const [period, setPeriod]     = useState('this_week')
  const [search, setSearch]     = useState('')

  // ── Fetch punches based on period ─────────────────────────
  useEffect(() => {
    if (!currentUser) return
    setLoading(true)

    let startDate
    const now = new Date()

    if (period === 'this_week') {
      startDate = getWeekRange(0).start
    } else if (period === 'last_week') {
      startDate = getWeekRange(1).start
    } else if (period === 'last_30') {
      startDate = new Date(now)
      startDate.setDate(now.getDate() - 30)
      startDate.setHours(0, 0, 0, 0)
    } else {
      startDate = new Date(2020, 0, 1)
    }

    const constraints = [
      where('userId', '==', currentUser.uid),
      where('date', '>=', Timestamp.fromDate(startDate)),
      orderBy('date', 'desc'),
    ]

    if (period === 'last_week') {
      constraints.push(where('date', '<=', Timestamp.fromDate(getWeekRange(1).end)))
    }

    const q = query(collection(db, 'attendance'), ...constraints)
    const unsub = onSnapshot(q, (snap) => {
      setPunches(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [currentUser, period])

  // ── Fetch daily summaries for shown punches ───────────────
  useEffect(() => {
    if (!currentUser || punches.length === 0) return
    const dates = [...new Set(punches.map((p) => {
      const d = p.date?.toDate ? p.date.toDate() : new Date(p.date)
      return d.toISOString().split('T')[0]
    }))]

    const q = query(
      collection(db, 'dailySummary'),
      where('userId', '==', currentUser.uid),
      where('date', 'in', dates.slice(0, 10)),
    )
    const unsub = onSnapshot(q, (snap) => {
      const map = {}
      snap.docs.forEach((d) => { map[d.data().date] = d.data() })
      setSummaries(map)
    })
    return unsub
  }, [currentUser, punches])

  // ── Filtered punches ──────────────────────────────────────
  const filtered = punches.filter((p) => {
    if (!search.trim()) return true
    const d = p.date?.toDate ? p.date.toDate() : new Date(p.date)
    return formatDate(p.date).toLowerCase().includes(search.toLowerCase())
  })

  // ── Aggregate totals ──────────────────────────────────────
  const totals = filtered.reduce(
    (acc, p) => {
      const dateKey = (() => {
        const d = p.date?.toDate ? p.date.toDate() : new Date(p.date)
        return d.toISOString().split('T')[0]
      })()
      const s = summaries[dateKey] || computeFallbackSummary(p)
      if (s) {
        acc.regular   += s.regular   ?? 0
        acc.overtime  += s.overtime  ?? 0
        acc.nightDiff += s.nightDiff ?? 0
        acc.late      += s.late      ?? 0
        acc.undertime += s.undertime ?? 0
      }
      return acc
    },
    { regular: 0, overtime: 0, nightDiff: 0, late: 0, undertime: 0 }
  )

  const SUMMARY_STATS = [
    { label: 'Regular',   value: totals.regular,   color: '#34d399' },
    { label: 'Overtime',  value: totals.overtime,  color: '#fbbf24' },
    { label: 'Night Diff',value: totals.nightDiff, color: '#818cf8' },
    { label: 'Late',      value: totals.late,      color: '#f87171' },
    { label: 'Undertime', value: totals.undertime, color: '#f87171' },
  ]

  return (
    <div className="bg-mesh" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{
        flex: 1, width: '100%', maxWidth: 1152,
        margin: '0 auto', padding: '1.5rem 1.5rem 3rem',
        display: 'flex', flexDirection: 'column', gap: '2rem',
      }}>

        {/* ── Page Header ───────────────────────────────────── */}
        <div className="animate-fade-in-up" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#f1f5f9' }}>
              Punch <span className="gradient-text">History</span>
            </h1>
            <p style={{ color: '#94a3b8', marginTop: '0.25rem' }}>
              Your complete time-in / time-out records
            </p>
          </div>

          {/* Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="input-field"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <input
              className="input-field"
              type="text"
              placeholder="Search by date…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ minWidth: 180 }}
            />
          </div>
        </div>

        {/* ── Period Totals ──────────────────────────────────── */}
        <div
          className="animate-fade-in-up"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', animationDelay: '0.05s' }}
        >
          {SUMMARY_STATS.map((s) => (
            <div
              key={s.label}
              className="stat-card"
              style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '1rem' }}
            >
              <p style={{ fontSize: '1.375rem', fontWeight: 700, color: s.color }}>
                {formatDuration(s.value)}
              </p>
              <p style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Records Table ──────────────────────────────────── */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#e2e8f0' }}>
              Records
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              {filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>

          {loading ? (
            <div className="glass-card" style={{ minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="spinner" />
            </div>

          ) : filtered.length === 0 ? (
            <div className="glass-card" style={{ minHeight: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', textAlign: 'center', padding: '2rem' }}>
              <svg style={{ width: 48, height: 48, color: '#1e293b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p style={{ color: '#94a3b8', fontWeight: 500 }}>No records found</p>
              <p style={{ color: '#475569', fontSize: '0.875rem' }}>Try changing the period or clearing the search.</p>
            </div>

          ) : (
            <div className="glass-card" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Date', 'Punch In', 'Punch Out', 'Duration', 'Regular', 'OT', 'Night Diff', 'Late', 'Undertime', 'Status'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#818cf8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((punch) => {
                    const dateKey = (() => {
                      const d = punch.date?.toDate ? punch.date.toDate() : new Date(punch.date)
                      return d.toISOString().split('T')[0]
                    })()
                    const s = summaries[dateKey] || computeFallbackSummary(punch)
                    const rawMins = durationToMinutes(punch.punchIn, punch.punchOut)
                    const isToday = (() => {
                      const d = punch.date?.toDate ? punch.date.toDate() : new Date(punch.date)
                      return d.toDateString() === new Date().toDateString()
                    })()
                    const active = !!punch.punchIn && !punch.punchOut

                    return (
                      <tr
                        key={punch.id}
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '0.875rem 1rem', color: '#cbd5e1', fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {formatDate(punch.date)}
                          {isToday && (
                            <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', color: '#34d399', fontWeight: 700 }}>TODAY</span>
                          )}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: '#34d399', whiteSpace: 'nowrap' }}>
                          {formatTime(punch.punchIn)}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: '#f87171', whiteSpace: 'nowrap' }}>
                          {formatTime(punch.punchOut)}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: '#cbd5e1', whiteSpace: 'nowrap' }}>
                          {punch.punchOut ? formatDuration(rawMins) : '—'}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: '#34d399' }}>
                          {s ? formatDuration(s.regular) : (punch.punchOut ? formatDuration(rawMins) : '—')}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: s?.overtime ? '#fbbf24' : '#475569' }}>
                          {s ? formatDuration(s.overtime) : '—'}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: s?.nightDiff ? '#818cf8' : '#475569' }}>
                          {s ? formatDuration(s.nightDiff) : '—'}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: s?.late ? '#f87171' : '#475569' }}>
                          {s ? formatDuration(s.late) : '—'}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: s?.undertime ? '#f87171' : '#475569' }}>
                          {s ? formatDuration(s.undertime) : '—'}
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          {active ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', fontWeight: 600, color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '0.2rem 0.65rem', borderRadius: 9999, whiteSpace: 'nowrap' }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                              Active
                            </span>
                          ) : punch.punchOut ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.72rem', fontWeight: 500, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.65rem', borderRadius: 9999 }}>
                              Complete
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.72rem', fontWeight: 600, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '0.2rem 0.65rem', borderRadius: 9999 }}>
                              No out
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>

                {/* Totals footer */}
                <tfoot>
                  <tr style={{ borderTop: '2px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.05)' }}>
                    <td colSpan={4} style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Period Total
                    </td>
                    <td style={{ padding: '0.75rem 1rem', color: '#34d399', fontWeight: 700 }}>{formatDuration(totals.regular)}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#fbbf24', fontWeight: 700 }}>{formatDuration(totals.overtime)}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#818cf8', fontWeight: 700 }}>{formatDuration(totals.nightDiff)}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#f87171', fontWeight: 700 }}>{formatDuration(totals.late)}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#f87171', fontWeight: 700 }}>{formatDuration(totals.undertime)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}