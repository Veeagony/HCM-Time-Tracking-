import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const TIMEZONES = [
  { value: 'Asia/Manila', label: '🇵🇭  Asia/Manila (PHT)' },
  { value: 'Asia/Singapore', label: '🇸🇬  Asia/Singapore (SGT)' },
  { value: 'Asia/Tokyo', label: '🇯🇵  Asia/Tokyo (JST)' },
  { value: 'Asia/Dubai', label: '🇦🇪  Asia/Dubai (GST)' },
  { value: 'Europe/London', label: '🇬🇧  Europe/London (GMT)' },
  { value: 'America/New_York', label: '🇺🇸  US Eastern (EST)' },
  { value: 'America/Los_Angeles', label: '🇺🇸  US Pacific (PST)' },
  { value: 'UTC', label: '🌐  UTC' },
]

const Icons = {
  Clock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 text-white opacity-95">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  Lightning: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-indigo-400">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Chart: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-emerald-400">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Calendar: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-sky-400">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Shield: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-indigo-400">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-slate-400">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Briefcase: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-slate-400">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Globe: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-slate-400">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Mail: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-slate-400">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  Lock: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] text-slate-400">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Eye: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-400 hover:text-slate-200">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  EyeOff: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-slate-400 hover:text-slate-200">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ),
  Warning: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4.5 h-4.5 text-red-400 flex-shrink-0">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  Sparkles: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-yellow-300 animate-bounce inline-block ml-1">
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" />
    </svg>
  )
}

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState('login')
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({
    email: '', password: '', displayName: '',
    role: 'employee', timezone: 'Asia/Manila',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(form.email, form.password)
        navigate('/dashboard')
      } else {
        await register(form.email, form.password, form.displayName, form.role, form.timezone)
        setRegistered(true)
      }
    } catch (err) {
      setError(friendlyError(err.code ?? err.message))
    } finally {
      setLoading(false)
    }
  }

  function closeRegisteredModal() {
    setRegistered(false)
    setMode('login')
    setForm((p) => ({ ...p, password: '' }))
    setError('')
  }

  return (
    <div className="login-root">
      {/* ── Animated Background ── */}
      <div className="login-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-overlay" />
      </div>

      {/* ── Split Layout ── */}
      <div className="login-layout">

        {/* Left Panel — Branding */}
        <div className="login-left">
          <div className="brand-area">
            <div className="brand-logo">
              <span className="brand-logo-icon"><Icons.Clock /></span>
            </div>
            <h1 className="brand-title">HCM Tracker</h1>
            <p className="brand-subtitle">Human Capital Management<br />Time &amp; Attendance System</p>

            <div className="feature-list">
              {[
                { icon: <Icons.Lightning />, text: 'Real-time punch in/out' },
                { icon: <Icons.Chart />, text: 'Automatic OT & night differential' },
                { icon: <Icons.Calendar />, text: 'Daily & weekly summaries' },
                { icon: <Icons.Shield />, text: 'Role-based admin access' },
              ].map((f) => (
                <div key={f.text} className="feature-item">
                  <span className="feature-icon">{f.icon}</span>
                  <span className="feature-text">{f.text}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="brand-footer">Powered by React · Firebase · Node.js</p>
        </div>

        {/* Right Panel — Form */}
        <div className="login-right">
          <div className="login-card">

            {/* Mode Toggle */}
            <div className="mode-toggle">
              <button
                id="login-tab-btn"
                type="button"
                onClick={() => { setMode('login'); setError('') }}
                className={`mode-tab ${mode === 'login' ? 'mode-tab-active' : ''}`}
              >
                Sign In
              </button>
              <button
                id="register-tab-btn"
                type="button"
                onClick={() => { setMode('register'); setError('') }}
                className={`mode-tab ${mode === 'register' ? 'mode-tab-active' : ''}`}
              >
                Register
              </button>
              <div className={`mode-indicator ${mode === 'register' ? 'mode-indicator-right' : ''}`} />
            </div>

            {/* Title */}
            <div className="form-header">
              <h2 className="form-title">
                {mode === 'login' ? 'Welcome back 👋' : 'Create account'}
                {mode === 'register' && <Icons.Sparkles />}
              </h2>
              <p className="form-desc">
                {mode === 'login'
                  ? 'Sign in to track your time and view your records.'
                  : 'Fill in your details to get started today.'}
              </p>
            </div>

            <form id="auth-form" onSubmit={handleSubmit} className="auth-form">

              {/* Register-only fields — always in DOM, animated open/close */}
              <div className={`register-fields ${mode === 'register' ? 'register-fields-open' : ''}`}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon"><Icons.User /></span>
                    <input
                      id="register-name-input"
                      name="displayName"
                      type="text"
                      required={mode === 'register'}
                      placeholder="Juan dela Cruz"
                      value={form.displayName}
                      onChange={handleChange}
                      className="form-input"
                      tabIndex={mode === 'register' ? 0 : -1}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><Icons.Briefcase /></span>
                      <select
                        id="register-role-select"
                        name="role"
                        value={form.role}
                        onChange={handleChange}
                        className="form-input form-select"
                        tabIndex={mode === 'register' ? 0 : -1}
                      >
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Timezone</label>
                    <div className="input-wrapper">
                      <span className="input-icon"><Icons.Globe /></span>
                      <select
                        id="register-timezone-select"
                        name="timezone"
                        value={form.timezone}
                        onChange={handleChange}
                        className="form-input form-select"
                        tabIndex={mode === 'register' ? 0 : -1}
                      >
                        {TIMEZONES.map((tz) => (
                          <option key={tz.value} value={tz.value}>{tz.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Email address</label>
                <div className="input-wrapper">
                  <span className="input-icon"><Icons.Mail /></span>
                  <input
                    id="auth-email-input"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <div className="label-row">
                  <label className="form-label">Password</label>
                  {mode === 'login' && (
                    <span className="form-label" style={{ opacity: 0.5, cursor: 'default' }}>min. 6 chars</span>
                  )}
                </div>
                <div className="input-wrapper">
                  <span className="input-icon"><Icons.Lock /></span>
                  <input
                    id="auth-password-input"
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    className="form-input"
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="pass-toggle"
                    tabIndex={-1}
                    aria-label="Toggle password visibility"
                  >
                    {showPass ? <Icons.EyeOff /> : <Icons.Eye />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="form-error fade-in">
                  <Icons.Warning /> {error}
                </div>
              )}

              {/* Submit */}
              <button
                id="auth-submit-btn"
                type="submit"
                disabled={loading}
                className="submit-btn"
              >
                {loading
                  ? <><span className="spinner" /> Please wait…</>
                  : mode === 'login'
                    ? '→ Sign In'
                    : '✨ Create Account'}
              </button>

              {/* Divider */}
              <div className="divider">
                <span>or</span>
              </div>

              <p className="switch-mode">
                {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  type="button"
                  id={mode === 'login' ? 'go-register-btn' : 'go-login-btn'}
                  onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
                  className="switch-link"
                >
                  {mode === 'login' ? 'Register here' : 'Sign in instead'}
                </button>
              </p>
            </form>
          </div>
        </div>
      </div>

      {registered && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-icon">✓</div>
            <h3>Registration Successful</h3>
            <p>Your account was created successfully. Please sign in with your new credentials.</p>
            <button type="button" className="modal-btn" onClick={closeRegisteredModal}>
              Okay
            </button>
          </div>
        </div>
      )}

      <style>{loginStyles}</style>
    </div>
  )
}

function friendlyError(code) {
  const map = {
    'auth/invalid-email': 'Invalid email address format.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/invalid-api-key': 'Firebase not configured. Check your .env file.',
  }
  return map[code] ?? code
}

const loginStyles = `
  .login-root {
    min-height: 100vh;
    display: flex;
    position: relative;
    overflow: hidden;
    font-family: 'Inter', sans-serif;
  }

  /* ── Animated Background ── */
  .login-bg {
    position: fixed;
    inset: 0;
    background: #0a0a1a;
    z-index: 0;
  }

  .orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.55;
    animation: float 8s ease-in-out infinite;
  }

  .orb-1 {
    width: 500px; height: 500px;
    background: radial-gradient(circle, #4f46e5 0%, transparent 70%);
    top: -150px; left: -100px;
    animation-delay: 0s;
  }

  .orb-2 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, #0ea5e9 0%, transparent 70%);
    bottom: -100px; right: -80px;
    animation-delay: -3s;
  }

  .orb-3 {
    width: 300px; height: 300px;
    background: radial-gradient(circle, #10b981 0%, transparent 70%);
    top: 40%; left: 35%;
    animation-delay: -5s;
    opacity: 0.3;
  }

  @keyframes float {
    0%, 100% { transform: translate(0, 0) scale(1); }
    33%       { transform: translate(30px, -30px) scale(1.05); }
    66%       { transform: translate(-20px, 20px) scale(0.95); }
  }

  .grid-overlay {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  /* ── Layout ── */
  .login-layout {
    position: relative;
    z-index: 1;
    display: flex;
    width: 100%;
    min-height: 100vh;
  }

  /* ── Left Panel ── */
  .login-left {
    display: none;
    flex-direction: column;
    justify-content: space-between;
    padding: 3rem;
    width: 45%;
    border-right: 1px solid rgba(99,102,241,0.12);
    background: rgba(15,15,35,0.6);
    backdrop-filter: blur(20px);
    animation: slideInLeft 0.6s ease;
  }

  @media (min-width: 900px) {
    .login-left { display: flex; }
  }

  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-30px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  .brand-area { flex: 1; display: flex; flex-direction: column; justify-content: center; }

  .brand-logo {
    width: 80px; height: 80px;
    background: linear-gradient(135deg, #6366f1, #0ea5e9, #10b981);
    border-radius: 8px; /* Rectangular shape */
    display: flex; align-items: center; justify-content: center;
    font-size: 2.2rem;
    margin-bottom: 2rem;
    box-shadow: 0 0 40px rgba(99,102,241,0.4);
    animation: logoPulse 3s ease-in-out infinite;
  }

  @keyframes logoPulse {
    0%, 100% { box-shadow: 0 0 30px rgba(99,102,241,0.4); }
    50%       { box-shadow: 0 0 60px rgba(99,102,241,0.7), 0 0 100px rgba(14,165,233,0.3); }
  }

  .brand-title {
    font-size: 2.8rem;
    font-weight: 800;
    background: linear-gradient(135deg, #818cf8, #38bdf8, #34d399);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1.1;
    margin-bottom: 0.75rem;
  }

  .brand-subtitle {
    color: rgba(148,163,184,0.8);
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 3rem;
  }

  .feature-list { display: flex; flex-direction: column; gap: 1rem; }

  .feature-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.875rem 1rem;
    background: rgba(99,102,241,0.06);
    border: 1px solid rgba(99,102,241,0.12);
    border-radius: 6px; /* Rectangular shape */
    transition: all 0.2s;
  }

  .feature-item:hover {
    background: rgba(99,102,241,0.12);
    border-color: rgba(99,102,241,0.25);
    transform: translateX(4px);
  }

  .feature-icon { font-size: 1.3rem; }

  .feature-text {
    color: #cbd5e1;
    font-size: 0.9rem;
    font-weight: 500;
  }

  .brand-footer {
    color: rgba(148,163,184,0.4);
    font-size: 0.75rem;
    text-align: center;
    padding-top: 2rem;
    border-top: 1px solid rgba(99,102,241,0.08);
  }

  /* ── Right Panel ── */
  .login-right {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1.5rem;
    animation: slideInRight 0.6s ease;
  }

  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(30px); }
    to   { opacity: 1; transform: translateX(0); }
  }

  /* ── Card ── */
  .login-card {
    width: 100%;
    max-width: 420px;
    background: rgba(16,16,40,0.75);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(99,102,241,0.18);
    border-radius: 8px; /* More Rectangular Shape */
    padding: 2.5rem;
    box-shadow: 0 24px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
  }

  /* ── Mode Toggle ── */
  .mode-toggle {
    display: flex;
    position: relative;
    background: rgba(0,0,0,0.3);
    border: 1px solid rgba(99,102,241,0.15);
    border-radius: 6px; /* Rectangular shape */
    padding: 4px;
    margin-bottom: 2rem;
    gap: 0;
  }

  .mode-tab {
    flex: 1;
    padding: 0.6rem;
    border: none;
    background: transparent;
    color: rgba(148,163,184,0.7);
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    border-radius: 4px; /* Rectangular shape */
    transition: color 0.2s;
    position: relative;
    z-index: 1;
  }

  .mode-tab-active { color: #e2e8f0; }

  .mode-indicator {
    position: absolute;
    top: 4px; left: 4px;
    width: calc(50% - 4px);
    height: calc(100% - 8px);
    background: linear-gradient(135deg, rgba(99,102,241,0.5), rgba(14,165,233,0.3));
    border-radius: 4px; /* Rectangular shape */
    border: 1px solid rgba(99,102,241,0.3);
    transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
    box-shadow: 0 4px 12px rgba(99,102,241,0.2);
  }

  .mode-indicator-right { transform: translateX(100%); }

  /* ── Form Header ── */
  .form-header { margin-bottom: 1.75rem; }

  .form-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #f1f5f9;
    margin-bottom: 0.4rem;
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .form-desc {
    color: rgba(148,163,184,0.7);
    font-size: 0.85rem;
    line-height: 1.5;
  }

  /* ── Form ── */
  .auth-form { display: flex; flex-direction: column; gap: 1.1rem; }

  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

  .form-group { display: flex; flex-direction: column; gap: 0.45rem; }

  .label-row { display: flex; justify-content: space-between; align-items: center; }

  .form-label {
    font-size: 0.72rem;
    font-weight: 700;
    color: rgba(148,163,184,0.8);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon {
    position: absolute;
    left: 0.875rem;
    pointer-events: none;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .form-input {
    width: 100%;
    padding: 0.75rem 1rem 0.75rem 2.75rem;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(99,102,241,0.18);
    border-radius: 6px; /* Rectangular shape */
    color: #e2e8f0;
    font-size: 0.9rem;
    font-family: inherit;
    outline: none;
    transition: all 0.2s ease;
    appearance: none;
    -webkit-appearance: none;
  }

  .form-input::placeholder { color: rgba(148,163,184,0.35); }

  .form-input:focus {
    border-color: rgba(99,102,241,0.5);
    background: rgba(99,102,241,0.07);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.03);
  }

  .form-select {
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%2394a3b8' d='M1 1l5 5 5-5'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.875rem center;
    padding-right: 2.5rem;
    cursor: pointer;
  }

  .form-select option { background: #1a1a3e; color: #e2e8f0; }

  .pass-toggle {
    position: absolute;
    right: 0.75rem;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    opacity: 0.6;
    transition: opacity 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pass-toggle:hover { opacity: 1; }

  /* ── Error ── */
  .form-error {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(239,68,68,0.08);
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: 6px; /* Rectangular shape */
    color: #f87171;
    font-size: 0.83rem;
    font-weight: 500;
  }

  /* ── Submit ── */
  .submit-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.875rem;
    background: linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%);
    color: white;
    font-size: 0.95rem;
    font-weight: 700;
    font-family: inherit;
    border: none;
    border-radius: 6px; /* Rectangular shape */
    cursor: pointer;
    transition: all 0.25s ease;
    box-shadow: 0 4px 20px rgba(79,70,229,0.35), inset 0 1px 0 rgba(255,255,255,0.1);
    letter-spacing: 0.02em;
    margin-top: 0.25rem;
  }

  .submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(79,70,229,0.5), 0 0 0 1px rgba(99,102,241,0.3);
  }

  .submit-btn:active:not(:disabled) { transform: translateY(0); }

  .submit-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* ── Divider ── */
  .divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: rgba(148,163,184,0.3);
    font-size: 0.75rem;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(99,102,241,0.12);
  }

  /* ── Switch Mode ── */
  .switch-mode {
    text-align: center;
    font-size: 0.83rem;
    color: rgba(148,163,184,0.6);
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    display: grid;
    place-items: center;
    background: rgba(15, 23, 42, 0.72);
    backdrop-filter: blur(4px);
    z-index: 50;
    padding: 1rem;
  }

  .modal-card {
    width: min(420px, 100%);
    background: rgba(15, 23, 42, 0.98);
    border: 1px solid rgba(148, 163, 184, 0.12);
    border-radius: 16px;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
    padding: 2rem;
    text-align: center;
  }

  .modal-icon {
    width: 3rem;
    height: 3rem;
    border-radius: 9999px;
    margin: 0 auto 1rem;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #22c55e, #4ade80);
    color: white;
    font-size: 1.5rem;
    font-weight: 800;
    box-shadow: 0 16px 32px rgba(34, 197, 94, 0.25);
  }

  .modal-card h3 {
    margin-bottom: 0.75rem;
    color: #f8fafc;
    font-size: 1.25rem;
    font-weight: 700;
  }

  .modal-card p {
    color: rgba(148, 163, 184, 0.9);
    font-size: 0.95rem;
    line-height: 1.6;
    margin-bottom: 1.5rem;
  }

  .modal-btn {
    width: 100%;
    padding: 0.9rem 1rem;
    background: linear-gradient(135deg, #22c55e, #16a34a);
    border: none;
    border-radius: 10px;
    color: white;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .modal-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px rgba(34, 197, 94, 0.25);
  }

  .switch-link {
    background: transparent;
    border: none;
    color: #818cf8;
    font-size: 0.83rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 2px;
    transition: color 0.2s;
  }

  .switch-link:hover { color: #a5b4fc; }

  /* ── Animated Register Fields ── */
  .register-fields {
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transition: max-height 0.4s cubic-bezier(0.4,0,0.2,1),
                opacity 0.3s ease,
                margin 0.3s ease;
    margin-bottom: 0;
  }

  .register-fields-open {
    max-height: 300px;
    opacity: 1;
    margin-bottom: 0;
  }

  .spinner {
    width: 1rem; height: 1rem;
    border: 2px solid rgba(255,255,255,0.25);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin { to { transform: rotate(360deg); } }
`
