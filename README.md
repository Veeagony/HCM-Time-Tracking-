# HCM-Time-Tracking- 

# Tech Stack

React
Node.js
Express
Firebase

# Install Dependencies

Frontend - cd client -> npm install
Backend - cd server -> npm install

# Run

Frontend - cd client -> npm run dev
Backend - cd server -> npm run dev

## Service account key (Firebase)

This project requires a Firebase service account JSON for certain server features (e.g. punch in/out).

- Do NOT commit your real `server/serviceAccountKey.json` to the repo.
- Use `server/serviceAccountKey.example.json` as a template.

Local setup options:

1. Place the downloaded JSON at `server/serviceAccountKey.json` (ensure it's ignored by git).
2. Or set the env var `FIREBASE_SERVICE_ACCOUNT` to the raw JSON string (preferred for CI/deploy).

CI / GitHub Actions:

- Add the full JSON content as a repository secret (e.g. `FIREBASE_SERVICE_ACCOUNT`).
- In your workflow write the secret to a file or set it as an env var for the server process.

If this key was accidentally exposed, rotate it immediately in the Firebase / Google Cloud console.
