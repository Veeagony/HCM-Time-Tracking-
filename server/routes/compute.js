import { Router } from 'express'
import { db } from '../firebase-admin.js'
import { verifyToken } from '../middleware/auth.js'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

const router = Router()

// ── POST /api/compute ─────────────────────────────────────────────────────────
// Body: { punchId: string }
// Marks punch out, computes hours, writes to attendance & dailySummary.
router.post('/', verifyToken, async (req, res) => {
  try {
    const { punchId } = req.body
    if (!punchId) return res.status(400).json({ error: 'punchId is required.' })

    const punchRef = db.collection('attendance').doc(punchId)
    const punchSnap = await punchRef.get()

    if (!punchSnap.exists) return res.status(404).json({ error: 'Punch record not found.' })

    const punch = punchSnap.data()

    // Security: only the owner can punch out their own record
    if (punch.userId !== req.user.uid) {
      return res.status(403).json({ error: 'Forbidden.' })
    }

    if (punch.punchOut) {
      return res.status(400).json({ error: 'Already punched out.' })
    }

    const punchOutTime = new Date()
    const punchInTime  = punch.punchIn.toDate()

    // ── Parse schedule ────────────────────────────────────────────────────────
    const scheduleStart = parseTime(punchInTime, punch.schedule?.start ?? '09:00')
    const scheduleEnd   = parseTime(punchInTime, punch.schedule?.end   ?? '18:00')

    // ── Compute metrics (in minutes) ──────────────────────────────────────────
    const computed = computeHours({ punchIn: punchInTime, punchOut: punchOutTime, scheduleStart, scheduleEnd })

    // ── Update punch record ───────────────────────────────────────────────────
    await punchRef.update({
      punchOut:    Timestamp.fromDate(punchOutTime),
      computedAt:  Timestamp.fromDate(new Date()),
      ...computed,
    })

    // ── Rebuild daily summary for the punch date ─────────────────────────────
    const dateKey = punchInTime.toISOString().split('T')[0]
    await rebuildDailySummary(punch.userId, dateKey)

    return res.json({ success: true, date: dateKey, ...computed })
  } catch (err) {
    console.error('Compute error:', err)
    return res.status(500).json({ error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Hour Computation Logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse "HH:MM" time string into a Date object on the same day as referenceDate.
 */
function parseTime(referenceDate, timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const d = new Date(referenceDate)
  d.setHours(h, m, 0, 0)
  return d
}

/**
 * Compute regular hours, OT, night differential, late, and undertime.
 * All values returned in MINUTES.
 *
 * Rules:
 *  - Regular: time worked within scheduled hours (capped at scheduled duration)
 *  - Overtime: time worked beyond schedule end
 *  - Night Differential: time worked between 22:00 and 06:00
 *  - Late: arrival after schedule start (minutes late)
 *  - Undertime: departure before schedule end (minutes early)
 */
function computeHours({ punchIn, punchOut, scheduleStart, scheduleEnd }) {
  const totalWorked = diffMinutes(punchIn, punchOut)

  // Late (arrival after schedule start)
  const late = Math.max(0, diffMinutes(scheduleStart, punchIn))

  // Undertime (departure before schedule end)
  const undertime = punchOut < scheduleEnd
    ? Math.max(0, diffMinutes(punchOut, scheduleEnd))
    : 0

  // Scheduled duration in minutes
  const scheduledMinutes = diffMinutes(scheduleStart, scheduleEnd)

  // Regular hours: time worked within schedule window, max = scheduled duration
  const workStart  = punchIn  > scheduleStart ? punchIn  : scheduleStart
  const workEnd    = punchOut < scheduleEnd   ? punchOut : scheduleEnd
  const regularRaw = workStart < workEnd ? diffMinutes(workStart, workEnd) : 0
  const regular    = Math.min(regularRaw, scheduledMinutes)

  // Overtime: time worked beyond schedule end
  const overtime = punchOut > scheduleEnd
    ? diffMinutes(scheduleEnd, punchOut)
    : 0

  // Night Differential: work between 22:00 – 06:00 next day
  const nightDiff = computeNightDiff(punchIn, punchOut)

  return {
    regular:   Math.round(regular),
    overtime:  Math.round(overtime),
    nightDiff: Math.round(nightDiff),
    late:      Math.round(late),
    undertime: Math.round(undertime),
  }
}

function diffMinutes(a, b) {
  return (b - a) / 60000
}

/**
 * Calculate minutes worked between 22:00 and 06:00.
 */
function computeNightDiff(punchIn, punchOut) {
  let total = 0
  let cursor = new Date(punchIn)

  while (cursor < punchOut) {
    const h = cursor.getHours()
    const isND = h >= 22 || h < 6
    if (isND) total++
    cursor = new Date(cursor.getTime() + 60000) // advance 1 minute
  }
  return total
}

function getDateRange(dateKey) {
  const start = new Date(`${dateKey}T00:00:00`)
  const end = new Date(`${dateKey}T23:59:59.999`)
  return { start, end }
}

export async function rebuildDailySummary(userId, dateKey) {
  const { Timestamp } = await import('firebase-admin/firestore')
  const { start, end } = getDateRange(dateKey)

  const snap = await db.collection('attendance')
    .where('userId', '==', userId)
    .where('date', '>=', Timestamp.fromDate(start))
    .where('date', '<=', Timestamp.fromDate(end))
    .get()

  let totals = { regular: 0, overtime: 0, nightDiff: 0, late: 0, undertime: 0 }
  let userName = null

  for (const doc of snap.docs) {
    const punch = doc.data()
    if (!punch.punchIn || !punch.punchOut) continue

    const punchIn = punch.punchIn.toDate()
    const punchOut = punch.punchOut.toDate()
    const scheduleStart = parseTime(punchIn, punch.schedule?.start ?? '09:00')
    const scheduleEnd = parseTime(punchIn, punch.schedule?.end ?? '18:00')
    const computed = computeHours({ punchIn, punchOut, scheduleStart, scheduleEnd })

    totals.regular += computed.regular
    totals.overtime += computed.overtime
    totals.nightDiff += computed.nightDiff
    totals.late += computed.late
    totals.undertime += computed.undertime

    if (!userName && punch.userName) {
      userName = punch.userName
    }
  }

  const summaryRef = db.collection('dailySummary').doc(`${userId}_${dateKey}`)
  await summaryRef.set({
    userId,
    userName: userName ?? `User ${userId}`,
    date: dateKey,
    ...totals,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true })

  return totals
}

export default router
