import { auth } from '../firebase-admin.js'

/**
 * Middleware: verify Firebase ID token from Authorization header.
 * Attaches decoded token to req.user.
 */
export async function verifyToken(req, res, next) {
  const header = req.headers.authorization ?? ''
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header.' })
  }

  const idToken = header.slice(7)

  if (!auth) {
    return res.status(500).json({ error: 'Firebase Admin not initialised. Check server credentials.' })
  }

  try {
    const decoded = await auth.verifyIdToken(idToken)
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.', detail: err.message })
  }
}

/**
 * Middleware: require admin role.
 * Must run after verifyToken.
 */
export async function requireAdmin(req, res, next) {
  try {
    const userRecord = await auth.getUser(req.user.uid)
    const claims = userRecord.customClaims ?? {}
    // Also check Firestore role (set during registration)
    if (claims.admin) return next()

    // Fallback: check Firestore users collection
    const { db } = await import('../firebase-admin.js')
    const snap = await db.collection('users').doc(req.user.uid).get()
    if (snap.exists && snap.data().role === 'admin') return next()

    return res.status(403).json({ error: 'Admin access required.' })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
