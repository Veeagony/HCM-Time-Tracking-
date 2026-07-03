import { Router } from 'express'
import { db } from '../firebase-admin.js'
import { verifyToken, requireAdmin } from '../middleware/auth.js'
import { rebuildDailySummary } from './compute.js'

const router = Router()

// All admin routes require auth + admin role
router.use(verifyToken, requireAdmin)

// ── GET /api/admin/punches ────────────────────────────────────────────────────
// Returns all attendance records (last 7 days by default)
router.get('/punches', async (req, res) => {
  try {
    const daysBack = parseInt(req.query.days ?? '7', 10)
    const from = new Date()
    from.setDate(from.getDate() - daysBack)
    from.setHours(0, 0, 0, 0)

    const { Timestamp } = await import('firebase-admin/firestore')
    const snap = await db.collection('attendance')
      .where('date', '>=', Timestamp.fromDate(from))
      .orderBy('date', 'desc')
      .limit(500)
      .get()

    const records = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      date:     d.data().date?.toDate()?.toISOString() ?? null,
      punchIn:  d.data().punchIn?.toDate()?.toISOString() ?? null,
      punchOut: d.data().punchOut?.toDate()?.toISOString() ?? null,
    }))

    return res.json(records)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// ── PATCH /api/admin/punches/:id ──────────────────────────────────────────────
// Admin: edit a punch record's punchIn / punchOut
router.patch('/punches/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { punchIn, punchOut } = req.body

    const updates = {}
    const { Timestamp } = await import('firebase-admin/firestore')
    if (punchIn)  updates.punchIn  = Timestamp.fromDate(new Date(punchIn))
    if (punchOut) updates.punchOut = Timestamp.fromDate(new Date(punchOut))

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update.' })
    }

    const punchRef = db.collection('attendance').doc(id)
    const beforeSnap = await punchRef.get()
    const beforePunch = beforeSnap.exists ? beforeSnap.data() : null
    const beforeDateKey = beforePunch?.punchIn?.toDate ? beforePunch.punchIn.toDate().toISOString().split('T')[0] : null

    await punchRef.update(updates)

    const afterSnap = await punchRef.get()
    const afterPunch = afterSnap.exists ? afterSnap.data() : null
    const afterDateKey = afterPunch?.punchIn?.toDate ? afterPunch.punchIn.toDate().toISOString().split('T')[0] : null

    if (beforeDateKey) await rebuildDailySummary(beforePunch.userId, beforeDateKey)
    if (afterDateKey && afterDateKey !== beforeDateKey) await rebuildDailySummary(afterPunch.userId, afterDateKey)

    return res.json({ success: true })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// ── GET /api/admin/report/daily ───────────────────────────────────────────────
// Returns daily summaries for all employees (last 7 days)
router.get('/report/daily', async (req, res) => {
  try {
    const daysBack = parseInt(req.query.days ?? '7', 10)
    const from = new Date()
    from.setDate(from.getDate() - daysBack)
    const fromStr = from.toISOString().split('T')[0]

    const snap = await db.collection('dailySummary')
      .where('date', '>=', fromStr)
      .orderBy('date', 'desc')
      .limit(500)
      .get()

    const records = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    return res.json(records)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// ── GET /api/admin/report/weekly ──────────────────────────────────────────────
// Aggregates daily summaries into weekly totals per employee
router.get('/report/weekly', async (req, res) => {
  try {
    // Pull last 35 days of daily summaries
    const from = new Date()
    from.setDate(from.getDate() - 35)
    const fromStr = from.toISOString().split('T')[0]

    const snap = await db.collection('dailySummary')
      .where('date', '>=', fromStr)
      .orderBy('date', 'asc')
      .limit(1000)
      .get()

    const summaries = snap.docs.map((d) => d.data())

    // Group by userId + ISO week
    const grouped = {}
    for (const s of summaries) {
      const weekStart = getWeekStart(s.date)
      const weekEnd   = getWeekEnd(s.date)
      const key = `${s.userId}_${weekStart}`
      if (!grouped[key]) {
        grouped[key] = {
          userId:    s.userId,
          userName:  s.userName,
          weekStart,
          weekEnd,
          regular:   0,
          overtime:  0,
          nightDiff: 0,
          late:      0,
          undertime: 0,
        }
      }
      grouped[key].regular   += s.regular   ?? 0
      grouped[key].overtime  += s.overtime  ?? 0
      grouped[key].nightDiff += s.nightDiff ?? 0
      grouped[key].late      += s.late      ?? 0
      grouped[key].undertime += s.undertime ?? 0
    }

    const records = Object.values(grouped).sort((a, b) =>
      b.weekStart.localeCompare(a.weekStart),
    )
    return res.json(records)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
})

// ── Helpers ───────────────────────────────────────────────────────────────────
function getWeekStart(dateStr) {
  const d = new Date(dateStr)
  const day = d.getDay() // 0=Sun
  d.setDate(d.getDate() - day)
  return d.toISOString().split('T')[0]
}

function getWeekEnd(dateStr) {
  const d = new Date(dateStr)
  const day = d.getDay()
  d.setDate(d.getDate() + (6 - day))
  return d.toISOString().split('T')[0]
}

export default router
