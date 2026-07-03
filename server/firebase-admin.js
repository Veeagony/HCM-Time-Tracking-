// ─────────────────────────────────────────────────────────
// Firebase Admin SDK Initialisation
//
// Option A (recommended for local dev):
//   Set GOOGLE_APPLICATION_CREDENTIALS env var to the path
//   of your downloaded service account JSON file.
//
// Option B:
//   Set FIREBASE_SERVICE_ACCOUNT env var to the JSON string
//   of your service account (useful for cloud deployments).
// ─────────────────────────────────────────────────────────
import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import 'dotenv/config'

const __dirname = dirname(fileURLToPath(import.meta.url))

let credential

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // Cloud deployment: JSON string in env var
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  credential = admin.credential.cert(serviceAccount)
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  // Local dev: path to service account file
  credential = admin.credential.applicationDefault()
} else {
  // Fallback: look for serviceAccountKey.json in server root
  try {
    const keyPath = resolve(__dirname, 'serviceAccountKey.json')
    const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))
    credential = admin.credential.cert(serviceAccount)
  } catch {
    console.warn('⚠️  No Firebase credentials found. Auth middleware will reject all requests.')
    console.warn('    → Download a service account key from Firebase Console and save as server/serviceAccountKey.json')
    credential = null
  }
}

if (!admin.apps.length && credential) {
  admin.initializeApp({
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID,
  })
}

export const db    = admin.apps.length ? admin.firestore() : null
export const auth  = admin.apps.length ? admin.auth() : null
export default admin
