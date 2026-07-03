import { Router } from 'express'
import { db } from '../firebase-admin.js'
import { verifyToken } from '../middleware/auth.js'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

const router = Router()
router.use(verifyToken)

// GET /api/attendance
// Returns the current user's recent attendance records and today's summary.
router.get('/', async (req, res) => {
  try {
    const uid = req.user.uid
    const now = new Date()
    const todayKey = now.toISOString().split('T')[0]

    const attendanceSnap = await db.collection('attendance')
      .where('userId', '==', uid)
      .orderBy('punchIn', 'desc')
      .limit(12)
      .get()

    const attendance = attendanceSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      punchIn: doc.data().punchIn?.toDate?.() ?? doc.data().punchIn,
      punchOut: doc.data().punchOut?.toDate?.() ?? doc.data().punchOut,
    }))

    const summarySnap = await db.collection('dailySummary').doc(`${uid}_${todayKey}`).get()
    const todaySummary = summarySnap.exists ? summarySnap.data() : null

    return res.json({ attendance, todaySummary })
  } catch (err) {
    console.error('Attendance fetch error:', err)
    return res.status(500).json({ error: err.message })
  }
})

// POST /api/attendance
// Creates a new punch-in record if the user has no active punch.
router.post('/', async (req, res) => {
  try {
    const uid = req.user.uid
    const userDoc = await db.collection('users').doc(uid).get()

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found.' })
    }

    const profile = userDoc.data()
    const activeSnap = await db.collection('attendance')
      .where('userId', '==', uid)
      .where('punchOut', '==', null)
      .orderBy('punchIn', 'desc')
      .limit(1)
      .get()

    if (!activeSnap.empty) {
      return res.status(400).json({ error: 'You already have an active punch. Please punch out first.' })
    }

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const punchRef = await db.collection('attendance').add({
      userId: uid,
      userName: profile.displayName ?? profile.email ?? 'Employee',
      timezone: profile.timezone ?? 'Asia/Manila',
      schedule: profile.schedule ?? { start: '09:00', end: '18:00' },
      punchIn: Timestamp.fromDate(now),
      date: Timestamp.fromDate(startOfDay),
      createdAt: FieldValue.serverTimestamp(),
    })

    return res.status(201).json({ success: true, punchId: punchRef.id })
  } catch (err) {
    console.error('Punch in error:', err)
    return res.status(500).json({ error: err.message })
  }
})

export default router
