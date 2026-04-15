# Job Tracker Web App

A lightweight, mobile-first job tracking app for daily activity logging and deadline awareness.

## Stack
- Frontend: HTML, CSS, Vanilla JS
- Backend: Node.js serverless functions (Vercel `api/`)
- Storage: In-memory adapter (swap to DB adapter later)

## Local Run (Vercel)
1. Install Vercel CLI: `npm i -g vercel`
2. Copy env file: `cp .env.example .env.local` (or create env vars in Vercel dashboard)
3. Run: `vercel dev`
4. Open: `http://localhost:3000`

## Environment Variables
- `APP_PASSWORD_HASH`: SHA-256 hash of your app password (required)
- `TOKEN_SECRET`: server secret for signing auth tokens (required)

## Generate Password Hash
Example (Node):
```bash
node -e "const crypto=require('crypto'); console.log(crypto.createHash('sha256').update('YourStrongPassword').digest('hex'))"
```

## Deploy
1. Push to Git repository
2. Import in Vercel
3. Add env vars (`APP_PASSWORD_HASH`, `TOKEN_SECRET`)
4. Deploy
