# Cyber Job Tracker — Career Application Management

A comprehensive job tracking and career management platform. Track job applications, prepare for interviews, manage recruiter relationships, optimize your CV, and gain actionable career insights.

**Features:**
- 📋 **Job Application Tracking** — Track all your applications with statuses, deadlines, and notes
- 🤖 **ATS Scanning** — Check how well your CV matches job descriptions
- 📄 **CV Management** — Upload, generate, export, and humanize your CV
- 🎯 **Interview Prep** — Get interview questions and tips by category
- 👥 **Recruiter CRM** — Manage recruiter contacts and relationships
- 📊 **Analytics** — View insights on your job search progress
- 🎨 **CV Templates** — Choose from multiple professional CV templates
- 🔐 **Secure** — Password-protected access with token-based authentication

## Stack
- **Frontend:** HTML, CSS, Vanilla JS (PWA-ready)
- **Backend:** Node.js serverless functions (Vercel `api/`)
- **Storage:** File-based persistence (dev) / ready for DB integration
- **Deployment:** Vercel with GitHub Actions CI/CD

## 🚀 Quick Start

### Local Development

**Prerequisites:** Node.js 20+

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/tracker.git
   cd tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Generate secrets**
   ```bash
   # Generate SHA-256 hash for your password
   node -e "const crypto=require('crypto'); console.log(crypto.createHash('sha256').update('YourStrongPassword').digest('hex'))"
   ```
   - Copy the hash and paste it as `APP_PASSWORD_HASH` in `.env.local`
   - Set `TOKEN_SECRET` to a random string (min 32 characters)

5. **Run locally**
   ```bash
   npm run dev
   ```
   Opens at `http://localhost:3000`

## Environment Variables

**Required:**
- `APP_PASSWORD_HASH`: SHA-256 hash of your app password
- `TOKEN_SECRET`: Secret for JWT token signing (min 32 chars)

**Optional:**
- `STORAGE_ADAPTER`: `file` (default) or `memory`
- `NODE_ENV`: `development` or `production`

## 📦 Deployment

### Deploy to Vercel (Recommended)

**Option 1: GitHub Integration (Auto-deploy)**
1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repository
4. Select `Tracker` as root directory
5. Add environment variables (`APP_PASSWORD_HASH`, `TOKEN_SECRET`)
6. Click Deploy — Your app is now live!

**Option 2: Vercel CLI**
```bash
npm i -g vercel
vercel --prod
```

### GitHub Actions CI/CD Setup

The repository includes a GitHub Actions workflow (`.github/workflows/ci-cd.yml`) that automatically:
- Runs linting and tests on every push
- Deploys to Vercel on push to `main` branch

**To enable auto-deployment:**

1. Create Vercel access token:
   - Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - Create a new token, copy it

2. Add GitHub Secrets:
   - Go to your GitHub repo → Settings → Secrets and variables → Actions
   - Add these secrets:
     - `VERCEL_TOKEN`: Your Vercel token
     - `VERCEL_ORG_ID`: Your Vercel org ID (from Vercel dashboard)
     - `VERCEL_PROJECT_ID`: Your project ID (from Vercel dashboard)

3. Commit and push to trigger the workflow

## 🔧 Development

### Scripts

```bash
npm run dev      # Start local development server
npm run lint     # Run ESLint
npm test         # Run tests
```

### Project Structure

```
Tracker/
├── api/
│   ├── _lib/              # Shared utilities
│   │   ├── auth.js        # Authentication
│   │   ├── storage.js     # Storage adapter
│   │   └── rate-limit.js  # Rate limiting
│   ├── login.js
│   ├── logout.js
│   ├── logs.js
│   ├── applications.js
│   ├── cv-export.js
│   ├── ats-scan.js
│   ├── interview-prep.js
│   ├── recruiters.js
│   └── analytics.js
├── public/
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── manifest.json
│   └── service-worker.js
├── data/          # Local dev storage
├── .github/       # GitHub Actions workflows
├── tests/
└── package.json
```

## 🔐 Security

- Passwords: SHA-256 hashed, never stored in plain text
- Tokens: JWT signed with `TOKEN_SECRET`, session-based
- Rate Limiting: IP-based on login endpoint
- CORS: Configured for secure requests
- CSP: Content Security Policy headers in production

## 🐛 Troubleshooting

**Login fails:**
- Verify password hash matches your password
- Check `TOKEN_SECRET` is set

**Vercel deployment fails:**
- Ensure Node.js 20.x in `vercel.json`
- Verify environment variables in Vercel dashboard
- Check [Vercel logs](https://vercel.com) for errors

**Local data issues:**
- File persistence is enabled; check `data/logs.json` exists
- For production, use a real database (Supabase, PlanetScale, etc.)

## 📝 License

MIT License — see LICENSE for details.
