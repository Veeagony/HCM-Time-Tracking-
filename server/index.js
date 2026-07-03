import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import computeRouter from './routes/compute.js'
import adminRouter from './routes/admin.js'
import attendanceRouter from './routes/attendance.js'

const app  = express()
const PORT = process.env.PORT ?? 3001

// ── Middleware ────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// ── Routes ────────────────────────────────────────────────
app.use('/api/compute', computeRouter)
app.use('/api/admin',   adminRouter)
app.use('/api/attendance', attendanceRouter)

// ── Health check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── 404 handler ───────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' })
})

// ── Error handler ─────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: err.message ?? 'Internal server error.' })
})

app.listen(PORT, () => {
  console.log(`\n🚀 HCM Server running at http://localhost:${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health\n`)
})
