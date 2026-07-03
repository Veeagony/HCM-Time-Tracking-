import { useState, useEffect } from 'react'
import {
  collection, addDoc, query, where, orderBy,
  onSnapshot, serverTimestamp, Timestamp, limit,
} from 'firebase/firestore'
import axios from 'axios'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'

const DASHBOARD_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    background-color: #0f0f1a;
    color: #e2e8f0;
    min-height: 100vh;
    -webkit-font-smoothing: antialiased;
  }

  .glass-card {
    background: rgba(30, 30, 53, 0.7);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(99, 102, 241, 0.15);
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

  .btn-accent {
    background: linear-gradient(135deg, #059669, #10b981);
    color: white; font-weight: 600; padding: 0.625rem 1.5rem;
    border-radius: 0.5rem; border: none; cursor: pointer;
    transition: all 0.2s ease; box-shadow: 0 4px 15px rgba(16,185,129,0.3);
    display: inline-flex; align-items: center; gap: 0.5rem;
  }
  .btn-accent:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(16,185,129,0.45); }
  .btn-accent:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .btn-danger {
    background: linear-gradient(135deg, #dc2626, #ef4444);
    color: white; font-weight: 600; padding: 0.625rem 1.5rem;
    border-radius: 0.5rem; border: none; cursor: pointer;
    transition: all 0.2s ease; box-shadow: 0 4px 15px rgba(239,68,68,0.3);
    display: inline-flex; align-items: center; gap: 0.5rem;
  }
  .btn-danger:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(239,68,68,0.45); }
  .btn-danger:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .stat-card {
    background: rgba(30,30,53,0.6);
    border: 1px solid rgba(99,102,241,0.12);
    border-radius: 1rem; padding: 1.25rem 1.5rem;
    transition: all 0.2s ease;
  }
  .stat-card:hover {
    border-color: rgba(99,102,241,0.3);
    box-shadow: 0 0 30px rgba(99,102,241,0.25);
    transform: translateY(-2px);
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
  .navbar-brand p { font-size: 0.8rem; color: rgba(226,232,240,0.72); }
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

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 10px rgba(99,102,241,0.3); }
    50%       { box-shadow: 0 0 25px rgba(99,102,241,0.6); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }

  .animate-fade-in-up { animation: fadeInUp 0.4s ease forwards; }
  .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
  .animate-pulse      { animation: pulse 2s ease-in-out infinite; }
  .spinner {
    width: 1.25rem; height: 1.25rem;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: white; border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #16162a; }
  ::-webkit-scrollbar-thumb { background: rgba(99,102,241,0.4); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #818cf8; }
`

function useInjectStyles(css) {
  useEffect(() => {
    const el = document.createElement('style')
    el.setAttribute('data-dashboard-styles', '')
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
  return d.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric' })
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

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}

function Clock() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const timeStr = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const parts = timeStr.split(' ')
  const timeMain = parts[0]
  const ampm = parts[1] || ''

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{
        minWidth: 140,
        padding: '0.6rem 0.9rem',
        borderRadius: 12,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
        border: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#e6eef8', letterSpacing: 0.5 }}>
          {timeMain}
          <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#cbd5e1', marginLeft: 8 }}>{ampm}</span>
        </div>
        <div style={{ fontSize: '0.65rem', color: '#9aa8c7', marginTop: 4 }}>LOCAL TIME</div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  useInjectStyles(DASHBOARD_STYLES)

  const { currentUser, userProfile } = useAuth()
  const [todayPunch, setTodayPunch]       = useState(null)
  const [summary, setSummary]             = useState(null)
  const [recentPunches, setRecentPunches] = useState([])
  const [loading, setLoading]             = useState(false)
  const [message, setMessage]             = useState('')

  // ── Listen for today's punch ──────────────────────────────
  useEffect(() => {
    if (!currentUser) return
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const q = query(
      collection(db, 'attendance'),
      where('userId', '==', currentUser.uid),
      where('date', '>=', Timestamp.fromDate(today)),
      orderBy('date', 'desc'),
    )
    return onSnapshot(q, (snap) => {
      setTodayPunch(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() })
    })
  }, [currentUser])

  // ── Listen for today's summary ────────────────────────────
  useEffect(() => {
    if (!currentUser) return
    const today = new Date().toISOString().split('T')[0]
    const q = query(
      collection(db, 'dailySummary'),
      where('userId', '==', currentUser.uid),
      where('date', '==', today),
    )
    return onSnapshot(q, (snap) => {
      setSummary(snap.empty ? null : snap.docs[0].data())
    })
  }, [currentUser])

  // ── Listen for recent punches (last 7) ────────────────────
  useEffect(() => {
    if (!currentUser) return
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)
    const q = query(
      collection(db, 'attendance'),
      where('userId', '==', currentUser.uid),
      where('date', '>=', Timestamp.fromDate(sevenDaysAgo)),
      orderBy('date', 'desc'),
      limit(7),
    )
    return onSnapshot(q, (snap) => {
      setRecentPunches(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [currentUser])

  // ── Punch In ──────────────────────────────────────────────
  async function handlePunchIn() {
    setLoading(true)
    setMessage('')
    try {
      const now = new Date()
      await addDoc(collection(db, 'attendance'), {
        userId:     currentUser.uid,
        userName:   userProfile?.displayName ?? currentUser.email,
        date:       Timestamp.fromDate(now),
        punchIn:    Timestamp.fromDate(now),
        punchOut:   null,
        schedule:   userProfile?.schedule ?? { start: '09:00', end: '18:00' },
        computedAt: null,
      })
      setMessage('✅ Punched in successfully!')
    } catch (err) {
      setMessage(`❌ ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // ── Punch Out ─────────────────────────────────────────────
  async function handlePunchOut() {
    if (!todayPunch?.id) return
    setLoading(true)
    setMessage('')
    try {
      const idToken = await currentUser.getIdToken()
      const res = await axios.post(
        '/api/compute',
        { punchId: todayPunch.id },
        { headers: { Authorization: `Bearer ${idToken}` } },
      )
      setMessage(
        `✅ Punched out! Regular: ${formatDuration(res.data.regular)}, OT: ${formatDuration(res.data.overtime)}`
      )
    } catch (err) {
      setMessage(`❌ ${err.response?.data?.error ?? err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const isPunchedIn  = !!todayPunch?.punchIn && !todayPunch?.punchOut
  const isPunchedOut = !!todayPunch?.punchOut

  const scheduledMinutes = (() => {
    const sched = userProfile?.schedule
    if (!sched) return 480
    const [sh, sm] = sched.start.split(':').map(Number)
    const [eh, em] = sched.end.split(':').map(Number)
    return (eh * 60 + em) - (sh * 60 + sm)
  })()
  const workedMinutes = summary?.regular ?? durationToMinutes(todayPunch?.punchIn, todayPunch?.punchOut)
  const progressPct   = Math.min(100, scheduledMinutes > 0 ? Math.round((workedMinutes / scheduledMinutes) * 100) : 0)

  const STATS = [
    {
      label: 'Regular', value: formatDuration(summary?.regular),
      color: '#34d399', borderColor: 'rgba(16,185,129,0.3)',
      icon: <svg style={{width:24,height:24}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
    },
    {
      label: 'Overtime', value: formatDuration(summary?.overtime),
      color: '#fbbf24', borderColor: 'rgba(245,158,11,0.3)',
      icon: <svg style={{width:24,height:24}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>,
    },
    {
      label: 'Night Diff', value: formatDuration(summary?.nightDiff),
      color: '#818cf8', borderColor: 'rgba(99,102,241,0.3)',
      icon: <svg style={{width:24,height:24}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>,
    },
    {
      label: 'Late', value: formatDuration(summary?.late),
      color: '#f87171', borderColor: 'rgba(239,68,68,0.3)',
      icon: <svg style={{width:24,height:24}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>,
    },
    {
      label: 'Undertime', value: formatDuration(summary?.undertime),
      color: '#f87171', borderColor: 'rgba(239,68,68,0.3)',
      icon: <svg style={{width:24,height:24}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>,
    },
  ]

  return (
    <div className="bg-mesh" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{
        flex: 1, width: '100%', maxWidth: 1152,
        margin: '0 auto', padding: '1.5rem 1.5rem 3rem',
        display: 'flex', flexDirection: 'column', gap: '2rem',
      }}>

        {/* ── Welcome ─────────────────────────────────────── */}
        <div className="animate-fade-in-up" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#f1f5f9' }}>
              Good {getGreeting()},{' '}
              <span className="gradient-text">
                {userProfile?.displayName?.split(' ')[0] ?? 'there'}
              </span>{' '}
              👋
            </h1>
            <p style={{ color: '#94a3b8', marginTop: '0.25rem' }}>
              {new Date().toLocaleDateString('en-PH', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>

          <Clock />
        </div>

        {/* ── Punch Card + Schedule ───────────────────────── */}
        <div
          className="animate-fade-in-up"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            animationDelay: '0.05s',
          }}
        >
          {/* Punch Card */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', gridColumn: 'span 2' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.5rem' }}>
                  Time Card
                </h2>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: '#94a3b8' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <svg style={{ width: 16, height: 16, color: '#34d399' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    In:{' '}
                    <strong style={{ color: todayPunch?.punchIn ? '#34d399' : '#e2e8f0' }}>
                      {formatTime(todayPunch?.punchIn)}
                    </strong>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <svg style={{ width: 16, height: 16, color: '#f87171' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Out:{' '}
                    <strong style={{ color: todayPunch?.punchOut ? '#f87171' : '#e2e8f0' }}>
                      {formatTime(todayPunch?.punchOut)}
                    </strong>
                  </span>
                </div>

                {!todayPunch && (
                  <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    No punch record for today yet.
                  </p>
                )}
                {isPunchedIn && (
                  <p style={{ color: '#34d399', fontSize: '0.875rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <span className="animate-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                    Currently clocked in
                  </p>
                )}
                {isPunchedOut && (
                  <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                    Shift complete for today.
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={handlePunchIn}
                  disabled={loading || isPunchedIn || isPunchedOut}
                  className="btn-accent"
                >
                  {loading && !isPunchedIn ? <span className="spinner" /> : '▶'}
                  Punch In
                </button>
                <button
                  onClick={handlePunchOut}
                  disabled={loading || !isPunchedIn}
                  className="btn-danger"
                >
                  {loading && isPunchedIn ? <span className="spinner" /> : '⏹'}
                  Punch Out
                </button>
              </div>
            </div>

            {/* Progress bar */}
            {(isPunchedIn || isPunchedOut) && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                  <span>Work progress</span>
                  <span>{progressPct}% of scheduled {formatDuration(scheduledMinutes)}</span>
                </div>
                <div style={{ width: '100%', height: 8, borderRadius: 9999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 9999,
                    background: 'linear-gradient(to right, #6366f1, #34d399)',
                    width: `${progressPct}%`, transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            )}

            {message && (
              <div style={{ borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '0.75rem', fontSize: '0.875rem', color: '#cbd5e1' }}>
                {message}
              </div>
            )}
          </div>

          {/* Schedule Card */}
          {userProfile?.schedule ? (
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>
                  My Schedule
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {[
                    { label: 'Start', value: userProfile.schedule.start, color: '#34d399' },
                    { label: 'End',   value: userProfile.schedule.end,   color: '#f87171' },
                    { label: 'Timezone', value: userProfile.timezone,    color: '#818cf8' },
                  ].map(({ label, value, color }) => (
                    <div key={label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{label}</span>
                        <strong style={{ color, fontSize: label === 'Timezone' ? '0.8rem' : '1.125rem' }}>{value}</strong>
                      </div>
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', marginTop: '0.5rem' }} />
                    </div>
                  ))}
                </div>
              </div>
              <div style={{
                marginTop: '1rem', borderRadius: '0.5rem',
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#a5b4fc', textAlign: 'center',
              }}>
                {scheduledMinutes / 60}h shift · {formatDuration(scheduledMinutes)} total
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '0.5rem' }}>
              <svg style={{ width: 32, height: 32, color: '#334155' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No schedule assigned yet.</p>
            </div>
          )}
        </div>

        {/* ── Today's Summary ──────────────────────────────── */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '1rem' }}>
            Today's Summary
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="stat-card"
                style={{ textAlign: 'center', borderColor: stat.borderColor, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', padding: '1rem' }}
              >
                <div style={{ color: stat.color }}>{stat.icon}</div>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: stat.color, marginTop: '0.25rem' }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
          {!summary && (
            <p style={{ color: '#475569', fontSize: '0.875rem', textAlign: 'center', marginTop: '0.75rem' }}>
              Summary will appear after you punch out today.
            </p>
          )}
        </div>

        {/* ── Recent Activity ──────────────────────────────── */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.15s', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#e2e8f0' }}>Recent Activity</h2>
            <a href="/history" style={{ fontSize: '0.875rem', color: '#818cf8', textDecoration: 'none' }}>
              View all →
            </a>
          </div>

          {recentPunches.length === 0 ? (
            <div className="glass-card" style={{ minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', textAlign: 'center', padding: '2rem' }}>
              <svg style={{ width: 48, height: 48, color: '#1e293b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p style={{ color: '#94a3b8', fontWeight: 500 }}>No recent punch records</p>
              <p style={{ color: '#475569', fontSize: '0.875rem' }}>Punch in above to start tracking your time.</p>
            </div>
          ) : (
            <div className="glass-card" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Date', 'Punch In', 'Punch Out', 'Duration', 'Status'].map((h) => (
                      <th key={h} style={{ textAlign: 'left', padding: '0.75rem 1.25rem', color: '#818cf8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentPunches.map((punch) => {
                    const mins = durationToMinutes(punch.punchIn, punch.punchOut)
                    const isToday = (() => {
                      if (!punch.date) return false
                      const d = punch.date.toDate ? punch.date.toDate() : new Date(punch.date)
                      return d.toDateString() === new Date().toDateString()
                    })()
                    const active = !!punch.punchIn && !punch.punchOut
                    return (
                      <tr key={punch.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '0.875rem 1.25rem', color: '#cbd5e1', fontWeight: 500 }}>
                          {formatDate(punch.date)}
                          {isToday && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>Today</span>}
                        </td>
                        <td style={{ padding: '0.875rem 1.25rem', color: '#34d399' }}>{formatTime(punch.punchIn)}</td>
                        <td style={{ padding: '0.875rem 1.25rem', color: '#f87171' }}>{formatTime(punch.punchOut)}</td>
                        <td style={{ padding: '0.875rem 1.25rem', color: '#cbd5e1' }}>{punch.punchOut ? formatDuration(mins) : '—'}</td>
                        <td style={{ padding: '0.875rem 1.25rem' }}>
                          {active ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', fontWeight: 600, color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '0.2rem 0.6rem', borderRadius: 9999 }}>
                              <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
                              Active
                            </span>
                          ) : punch.punchOut ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: 9999 }}>
                              Complete
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.75rem', fontWeight: 600, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '0.2rem 0.6rem', borderRadius: 9999 }}>
                              No out
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}