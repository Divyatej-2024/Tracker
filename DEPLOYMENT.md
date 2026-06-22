# Deployment Guide — Cyber Job Tracker

This guide covers all deployment options for the Cyber Job Tracker application.

## Table of Contents

1. [Local Development](#local-development)
2. [Vercel Deployment](#vercel-deployment)
3. [GitHub Integration](#github-integration)
4. [CI/CD Pipeline](#cicd-pipeline)
5. [Database Integration](#database-integration)
6. [Production Checklist](#production-checklist)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Local Development

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Vercel CLI (for local development with serverless functions)

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/tracker.git
cd tracker

# Install dependencies
npm install

# Install Vercel CLI globally
npm install -g vercel

# Copy environment template
cp .env.example .env.local
```

### Generate Secrets

```bash
# Generate a SHA-256 password hash
node -e "const crypto=require('crypto'); console.log(crypto.createHash('sha256').update('YourStrongPassword').digest('hex'))"

# Generate a random TOKEN_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Edit `.env.local`:
```env
APP_PASSWORD_HASH=<your-hash-here>
TOKEN_SECRET=<your-token-secret-here>
```

### Run Locally

```bash
# Start development server
npm run dev

# Open browser
# http://localhost:3000
```

The development server:
- Watches for file changes
- Loads environment variables from `.env.local`
- Emulates Vercel serverless functions locally
- Persists data to `data/logs.json`

---

## Vercel Deployment

### Option 1: GitHub Integration (Recommended)

**Easiest method — automatic deployments on every push!**

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

2. **Connect to Vercel**
   - Visit [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Select "Import Git Repository"
   - Choose your GitHub repo (may need to install Vercel GitHub app)

3. **Configure Project**
   - **Framework:** Other
   - **Root Directory:** `Tracker` (if not auto-detected)
   - **Build Command:** (Leave blank — Vercel auto-detects)
   - **Output Directory:** (Leave blank)

4. **Set Environment Variables**
   - Click "Environment Variables"
   - Add:
     - Name: `APP_PASSWORD_HASH`, Value: `<your-hash>`
     - Name: `TOKEN_SECRET`, Value: `<your-secret>`

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app is now live at `https://<your-project>.vercel.app`

### Option 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to your Vercel account
vercel login

# Deploy from project directory
cd Tracker
vercel --prod

# Follow interactive prompts to configure project
```

### Option 3: Docker Deployment

```bash
# If you want to run in Docker (optional)
docker build -t tracker .
docker run -p 3000:3000 -e APP_PASSWORD_HASH=... -e TOKEN_SECRET=... tracker
```

---

## GitHub Integration

### Enable GitHub Deployments

1. **Create Vercel Access Token**
   - Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - Create "New Token"
   - Give it a name, scope to your team
   - Copy the token

2. **Add GitHub Secrets**
   - Go to your GitHub repo
   - Navigate to **Settings → Secrets and variables → Actions**
   - Create these secrets:
     - `VERCEL_TOKEN`: Paste your Vercel token
     - `VERCEL_ORG_ID`: Your Vercel organization ID (from URL: `https://vercel.com/your-org-id`)
     - `VERCEL_PROJECT_ID`: Your project ID (from Vercel dashboard → Settings)

3. **Find Your IDs**
   - **Org ID:** `vercel.com/account/settings/teams` (in team URL or settings)
   - **Project ID:** Deploy once manually, then check `vercel.json` or Vercel dashboard

4. **Verify Workflow**
   - Commit to GitHub: `git push`
   - Check GitHub Actions tab to see pipeline run
   - Verify deployment completes on Vercel

---

## CI/CD Pipeline

The repository includes an automated GitHub Actions workflow (`.github/workflows/ci-cd.yml`):

### Workflow Steps

1. **Lint & Test** (runs on every push and PR)
   - Installs dependencies
   - Runs ESLint
   - Runs test suite

2. **Deploy to Vercel** (runs only on push to `main`)
   - Triggered after lint passes
   - Deploys to Vercel production
   - Creates automatic preview deployments for PRs

### View Pipeline Status

- Check GitHub repo → **Actions** tab
- Click on a workflow run to see details
- Review logs if a step fails

### Common Issues

| Issue | Solution |
|-------|----------|
| Tests fail | Fix linting errors: `npm run lint` |
| Vercel deploy fails | Check environment variables in Vercel dashboard |
| Token expired | Regenerate at `vercel.com/account/tokens` |

---

## Database Integration

### Current Setup (File-Based)

- Data stored in `data/logs.json`
- Works great for local development
- **Not recommended for production** (ephemeral in serverless)

### Upgrade to Real Database

For production, consider:

1. **Supabase** (PostgreSQL)
   ```bash
   npm install @supabase/supabase-js
   ```
   
   Create `api/_lib/storage.adapters/supabase.js`:
   ```javascript
   const { createClient } = require('@supabase/supabase-js');
   const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
   
   module.exports = {
     async saveLogs(logs) {
       return supabase.from('logs').insert(logs);
     },
     async getLogs() {
       const { data } = await supabase.from('logs').select('*');
       return data;
     }
   };
   ```

2. **PlanetScale** (MySQL)
3. **MongoDB Atlas** (Document DB)
4. **Firebase** (NoSQL)

### Add Database Env Variables

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Or any other DB
DATABASE_URL=postgresql://user:pass@host/db
```

---

## Production Checklist

Before going live:

- [ ] **Security**
  - [ ] Strong password hash set
  - [ ] `TOKEN_SECRET` is random and long (32+ chars)
  - [ ] `.env` and `.env.local` are in `.gitignore`
  - [ ] No secrets hardcoded in code

- [ ] **Performance**
  - [ ] Database configured (not file-based)
  - [ ] Enable Vercel caching
  - [ ] CDN enabled for static assets
  - [ ] Rate limiting configured

- [ ] **Reliability**
  - [ ] Health check endpoint available (`/api/health`)
  - [ ] Error logging configured
  - [ ] Backup strategy in place
  - [ ] Auto-scaling enabled

- [ ] **Monitoring**
  - [ ] Error tracking (Sentry, LogRocket)
  - [ ] Analytics enabled
  - [ ] Uptime monitoring set up
  - [ ] Alerts configured

- [ ] **Legal**
  - [ ] Privacy policy created
  - [ ] Terms of service reviewed
  - [ ] GDPR compliance (if EU users)
  - [ ] Data retention policy defined

---

## Monitoring & Maintenance

### Vercel Dashboard

- Monitor deployments: `vercel.com/dashboard`
- View logs: Click deployment → Logs
- Check analytics: Analytics tab
- Set up alerts: Settings → Alerts

### Health Checks

```bash
# Test your app
curl https://your-app.vercel.app/api/health

# Should return 200 OK
```

### Regular Updates

```bash
# Update dependencies
npm update

# Check for security vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

### Database Backups

```bash
# Supabase backups
# Automatic daily backups (check Supabase dashboard)

# Export data
npm run export-data
```

### Logs & Debugging

```bash
# View Vercel function logs
vercel logs <deployment-id>

# View GitHub Actions logs
# GitHub repo → Actions → Click workflow run
```

---

## Troubleshooting

### Deployment Fails

1. **Check Vercel logs**
   ```bash
   vercel logs
   ```

2. **Verify environment variables**
   - Vercel dashboard → Settings → Environment Variables
   - Ensure all required vars are present

3. **Run tests locally**
   ```bash
   npm run lint
   npm test
   ```

### Application Errors

| Error | Solution |
|-------|----------|
| 401 Unauthorized | Check `APP_PASSWORD_HASH` and `TOKEN_SECRET` |
| 500 Server Error | Check Vercel logs with `vercel logs` |
| Data not persisting | Ensure database is configured (file storage is ephemeral) |
| Slow response | Check database performance, enable caching |

### Performance Issues

```bash
# Check bundle size
npm run build

# Optimize dependencies
npm audit fix

# Profile with Vercel Analytics
# vercel.com/dashboard → project → Analytics
```

---

## Support & Resources

- **Vercel Docs:** https://vercel.com/docs
- **GitHub Actions:** https://docs.github.com/en/actions
- **Node.js API:** https://nodejs.org/docs
- **Issue Tracker:** GitHub repo → Issues

For help, create an issue with:
- Error message
- Deployment URL (if applicable)
- Steps to reproduce
- Environment details (Node version, OS, etc.)
