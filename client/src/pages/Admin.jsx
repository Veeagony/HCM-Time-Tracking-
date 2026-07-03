import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'

const ADMIN_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', system-ui, sans-serif;
    background-color: #0f0f1a; color: #e2e8f0;
    min-height: 100vh; -webkit-font-smoothing: antialiased;
  }

  .bg-mesh {
    background-color: #0f0f1a;
    background-image:
      radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(52,211,153,0.10) 0%, transparent 50%),
      radial-gradient(ellipse at 50% 50%, rgba(79,70,229,0.08) 0%, transparent 70%);
    min-height: 100vh;
  }

  .glass-card {
    background: rgba(30,30,53,0.7); backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(99,102,241,0.15);
    border-radius: 1rem; box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }

  .gradient-text {
    background: linear-gradient(135deg, #818cf8 0%, #34d399 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
  }

  .navbar {
    display: flex; align-items: center; justify-content: space-between;
    gap: 1rem; padding: 1.3rem 2.2rem; margin: 1rem auto 1.5rem;
    max-width: 1700px; width: min(100%, 1650px);
  }
  .navbar-brand { display: flex; align-items: center; gap: 0.75rem; }
  .navbar-logo {
    display: grid; place-items: center; width: 2.5rem; height: 2.5rem;
    border-radius: 9999px; background: linear-gradient(135deg, #4f46e5, #10b981);
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

  .hcm-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
  .hcm-table th {
    text-align: left; padding: 0.75rem 1rem;
    background: rgba(99,102,241,0.1); color: #818cf8;
    font-weight: 600; font-size: 0.7rem; text-transform: uppercase;
    letter-spacing: 0.08em; border-bottom: 1px solid rgba(99,102,241,0.15);
  }
  .hcm-table td {
    padding: 0.875rem 1rem; border-bottom: 1px solid rgba(255,255,255,0.05);
    color: #cbd5e1;
  }
  .hcm-table tr:hover td { background: rgba(99,102,241,0.05); color: #e2e8f0; }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .animate-fade-in-up { animation: fadeInUp 0.4s ease forwards; }
  .spinner {
    width: 2rem; height: 2rem;
    border: 3px solid rgba(255,255,255,0.1);
    border-top-color: #818cf8; border-radius: 50%;
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
    el.setAttribute('data-admin-styles', '')
    el.textContent = css
    document.head.appendChild(el)
    return () => el.remove()
  }, [])
}

function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return `${h}h ${m}m`
}

function formatDateTime(ts) {
  if (!ts) return '—'
  const d = typeof ts === 'string' ? new Date(ts) : ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const BADGE = {
  active:   { color: '#34d399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.25)', label: 'Active' },
  done:     { color: '#818cf8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.25)', label: 'Done' },
  admin:    { color: '#818cf8', bg: 'rgba(129,140,248,0.12)', border: 'rgba(129,140,248,0.25)', label: 'Admin' },
}

function Badge({ type }) {
  const s = BADGE[type] ?? BADGE.done
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '0.2rem 0.65rem', borderRadius: 9999,
      fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
    }}>
      {/* icon */}
      {type === 'active' && (
        <span style={{ width: 8, height: 8, borderRadius: 8, background: '#34d399', boxShadow: '0 0 6px rgba(52,211,153,0.6)' }} />
      )}
      {type === 'done' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
      )}
      {type === 'admin' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3 7h7l-5.7 4.1L20 22l-8-5-8 5 1.7-8.9L0 9h7l3-7z" /></svg>
      )}
      <span style={{ marginLeft: 4 }}>{s.label}</span>
    </span>
  )
}

function IconFolder({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}

function IconCalendar({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function IconChart({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20v-6" />
      <path d="M18 20v-10" />
      <path d="M6 20v-2" />
      <path d="M3 3h18v18H3z" />
    </svg>
  )
}

const TABS = [
  { key: 'punches', label: 'All Punches', icon: <IconFolder /> },
  { key: 'daily',   label: 'Daily Report', icon: <IconCalendar /> },
  { key: 'weekly',  label: 'Weekly Report', icon: <IconChart /> },
]

export default function Admin() {
  useInjectStyles(ADMIN_STYLES)

  const { currentUser } = useAuth()
  const [tab, setTab]       = useState('punches')
  const [punches, setPunches] = useState([])
  const [daily, setDaily]   = useState([])
  const [weekly, setWeekly] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function getToken() { return currentUser.getIdToken() }

  async function loadPunches() {
    setLoading(true); setError('')
    try {
      const { data } = await axios.get('/api/admin/punches', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      })
      setPunches(data)
    } catch (e) { setError(e.response?.data?.error ?? e.message) }
    finally { setLoading(false) }
  }

  async function loadDaily() {
    setLoading(true); setError('')
    try {
      const { data } = await axios.get('/api/admin/report/daily', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      })
      setDaily(data)
    } catch (e) { setError(e.response?.data?.error ?? e.message) }
    finally { setLoading(false) }
  }

  async function loadWeekly() {
    setLoading(true); setError('')
    try {
      const { data } = await axios.get('/api/admin/report/weekly', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      })
      setWeekly(data)
    } catch (e) { setError(e.response?.data?.error ?? e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    if (tab === 'punches') loadPunches()
    if (tab === 'daily')   loadDaily()
    if (tab === 'weekly')  loadWeekly()
  }, [tab])

  const MetricCell = ({ value, color }) => (
    <td style={{ padding: '0.875rem 1rem', color, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      {formatDuration(value)}
    </td>
  )

  return (
    <div className="bg-mesh" style={{ minHeight: '100vh' }}>
      <Navbar />

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem 3rem' }}>

        {/* ── Header ─────────────────────────────────────── */}
        <div className="animate-fade-in-up" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <Badge type="admin" />
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#f1f5f9' }}>
              Admin <span className="gradient-text">Panel</span>
            </h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            View and manage all employee punch records and reports.
          </p>
        </div>

        {/* ── Tabs ───────────────────────────────────────── */}
        <div
          className="animate-fade-in-up"
          style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', animationDelay: '0.05s' }}
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '0.5rem 1rem', borderRadius: '0.5rem', fontSize: '0.875rem',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease',
                border: tab === t.key ? '1px solid rgba(99,102,241,0.35)' : '1px solid transparent',
                background: tab === t.key ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: tab === t.key ? '#a5b4fc' : '#94a3b8',
                fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8
              }}
              onMouseEnter={e => { if (tab !== t.key) { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' } }}
              onMouseLeave={e => { if (tab !== t.key) { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'transparent' } }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', color: tab === t.key ? '#c7d2fe' : '#94a3b8' }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── Error ──────────────────────────────────────── */}
        {error && (
          <div style={{
            borderRadius: '0.5rem', background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)', padding: '0.75rem 1rem',
            color: '#f87171', fontSize: '0.875rem', marginBottom: '1.5rem',
          }}>
            {error}
          </div>
        )}

        {/* ── Table Card ─────────────────────────────────── */}
        <div
          className="glass-card animate-fade-in-up"
          style={{ overflow: 'hidden', animationDelay: '0.1s' }}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem' }}>
              <span className="spinner" />
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>

              {/* All Punches */}
              {tab === 'punches' && (
                <table className="hcm-table">
                  <thead>
                    <tr>
                      {['Employee','Date','Punch In','Punch Out','Regular','OT','Night Diff','Late','Undertime','Status'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {punches.length === 0 ? (
                      <tr><td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>No punch records found.</td></tr>
                    ) : punches.map((p) => (
                      <tr key={p.id}>
                        <td style={{ padding: '0.875rem 1rem', color: '#e2e8f0', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          {p.userName ?? p.userId}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{formatDateTime(p.date)}</td>
                        <td style={{ padding: '0.875rem 1rem', color: '#34d399', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{formatDateTime(p.punchIn)}</td>
                        <td style={{ padding: '0.875rem 1rem', color: '#f87171', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{formatDateTime(p.punchOut)}</td>
                        <MetricCell value={p.regular}   color="#34d399" />
                        <MetricCell value={p.overtime}  color="#fbbf24" />
                        <MetricCell value={p.nightDiff} color="#818cf8" />
                        <MetricCell value={p.late}      color="#f87171" />
                        <MetricCell value={p.undertime} color="#f87171" />
                        <td style={{ padding: '0.875rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <Badge type={!p.punchOut ? 'active' : 'done'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Daily Report */}
              {tab === 'daily' && (
                <table className="hcm-table">
                  <thead>
                    <tr>
                      {['Employee','Date','Regular','OT','Night Diff','Late','Undertime'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {daily.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>No daily summaries found.</td></tr>
                    ) : daily.map((d, i) => (
                      <tr key={i}>
                        <td style={{ padding: '0.875rem 1rem', color: '#e2e8f0', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{d.userName ?? d.userId}</td>
                        <td style={{ padding: '0.875rem 1rem', color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{d.date}</td>
                        <MetricCell value={d.regular}   color="#34d399" />
                        <MetricCell value={d.overtime}  color="#fbbf24" />
                        <MetricCell value={d.nightDiff} color="#818cf8" />
                        <MetricCell value={d.late}      color="#f87171" />
                        <MetricCell value={d.undertime} color="#f87171" />
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Weekly Report */}
              {tab === 'weekly' && (
                <table className="hcm-table">
                  <thead>
                    <tr>
                      {['Employee','Week','Regular','OT','Night Diff','Late','Undertime'].map(h => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {weekly.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>No weekly summaries found.</td></tr>
                    ) : weekly.map((w, i) => (
                      <tr key={i}>
                        <td style={{ padding: '0.875rem 1rem', color: '#e2e8f0', fontWeight: 500, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{w.userName ?? w.userId}</td>
                        <td style={{ padding: '0.875rem 1rem', color: '#cbd5e1', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{w.weekStart} → {w.weekEnd}</td>
                        <MetricCell value={w.regular}   color="#34d399" />
                        <MetricCell value={w.overtime}  color="#fbbf24" />
                        <MetricCell value={w.nightDiff} color="#818cf8" />
                        <MetricCell value={w.late}      color="#f87171" />
                        <MetricCell value={w.undertime} color="#f87171" />
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

            </div>
          )}
        </div>
      </main>
    </div>
  )
}