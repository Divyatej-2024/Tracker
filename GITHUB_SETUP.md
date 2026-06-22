# GitHub + Vercel Deployment Setup

This guide walks you through setting up automatic deployments from GitHub to Vercel.

## ⚡ Quick Setup (5 minutes)

### Step 1: Sign Up for Vercel

1. Go to [vercel.com](https://vercel.com/signup)
2. Sign up with GitHub (click "Continue with GitHub")
3. You'll be redirected back to Vercel dashboard

### Step 2: Create Vercel Project

1. In Vercel dashboard, click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. Search for your repository (`tracker` or `Tracker`)
4. Click **"Import"**

### Step 3: Configure Project

**Framework Preset:** Select "Other"

**Build & Output Settings:**
- Build Command: *(leave empty)*
- Output Directory: *(leave empty)*
- Install Command: `npm install`

**Root Directory:** 
- If your `Tracker` folder is the root, leave empty
- If it's in a subfolder, enter `Tracker`

Click **"Continue"**

### Step 4: Add Environment Variables

You'll see "Environment Variables" section:

1. Add `APP_PASSWORD_HASH`
   - Value: Get from running `npm run setup` locally
   
2. Add `TOKEN_SECRET`
   - Value: Also from `npm run setup`

Example:
```
APP_PASSWORD_HASH=e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
TOKEN_SECRET=5f0e7f8c9a2b1d4e3f6g9h2i5j8k1l4m7n0o3p6q9r2s5t8
```

Click **"Deploy"** ✨

Your app is now deployed! You'll get a URL like `https://tracker.vercel.app`

---

## 🔄 Enable Automatic Deployments

This makes your app auto-deploy whenever you push to GitHub!

### Step 1: Create Vercel Access Token

1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Name: `GitHub CI/CD`
4. Scope: Select your team
5. Click **"Create"**
6. **Copy the token** (you'll only see it once!)

### Step 2: Create GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**

Add three secrets:

| Name | Value |
|------|-------|
| `VERCEL_TOKEN` | Paste your token from Step 1 |
| `VERCEL_ORG_ID` | Your Vercel org ID (see below) |
| `VERCEL_PROJECT_ID` | Your project ID (see below) |

**Finding Your IDs:**

- **Org ID:** Go to [vercel.com/account/teams](https://vercel.com/account/teams), find your team, copy the ID from URL or hover over name
- **Project ID:** 
  - Option 1: After first deploy, run `vercel link` and check `vercel.json`
  - Option 2: Vercel dashboard → Project Settings → Project ID

### Step 3: Test Auto-Deployment

```bash
# Make a small change
echo "# Updated" >> README.md

# Commit and push
git add .
git commit -m "Test auto-deployment"
git push origin main
```

Check:
1. **GitHub Actions:** Your repo → **Actions** tab → See workflow running
2. **Vercel:** [vercel.com/dashboard](https://vercel.com/dashboard) → See deployment in progress

That's it! 🎉 Now every push to `main` auto-deploys!

---

## 📝 How the Workflow Works

The file `.github/workflows/ci-cd.yml` defines:

1. **On every push or PR:**
   - Run ESLint (code quality)
   - Run tests

2. **On push to `main` only:**
   - If lint + tests pass → Deploy to Vercel

This ensures your production app only gets good code! ✨

---

## 🐛 Troubleshooting

### Workflow Fails with "401 Unauthorized"

**Solution:** Check your secrets in GitHub Settings
```bash
# Verify Vercel token is still valid
# Regenerate at vercel.com/account/tokens
```

### Deployment Succeeds but App Broken

**Solution:** Check Vercel deployment logs
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Find the failed deployment
4. Click it → scroll to see error messages

### Can't Find Org ID or Project ID

**Solution:** Use Vercel CLI
```bash
npm install -g vercel
vercel link

# This will show your IDs in .vercel/project.json
```

### Changes Don't Appear After Push

**Solution:** 
1. Check GitHub Actions workflow ran (Actions tab)
2. Check Vercel deployment completed (Vercel dashboard)
3. Hard refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)

---

## 🚀 Next Steps

✅ **Deployment working?**

1. **Set custom domain** (optional)
   - Vercel dashboard → Project Settings → Domains
   - Add your domain, follow DNS setup

2. **Enable git branches**
   - Create `develop` branch for testing
   - Vercel auto-creates preview deployments

3. **Set up monitoring**
   - Vercel Analytics → Enable monitoring
   - Get performance insights

4. **Invite team members** (optional)
   - Vercel dashboard → Members → Invite

---

## 📚 Resources

- [Vercel Docs](https://vercel.com/docs)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Vercel + GitHub Guide](https://vercel.com/guides/deploying-nextjs-with-vercel)

---

**You're all set! Your app now deploys automatically to Vercel with every push to GitHub.** 🎊
