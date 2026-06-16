# 🚀 Quick Deployment Guide (5 Minutes)

## Easiest Way: Deploy to Vercel

Vercel is the easiest platform to deploy Next.js apps. It's made by the creators of Next.js!

---

## Method 1: One-Command Deployment (Fastest)

### Prerequisites:
- GitHub account
- Code pushed to GitHub

### Steps:

**1. Push Your Code to GitHub**
```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Ready to deploy"

# Create repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/leetcode-analyzer.git
git branch -M main
git push -u origin main
```

**2. Deploy with Vercel (No coding required!)**
1. Go to: **https://vercel.com**
2. Click **"Sign Up"** (use GitHub account)
3. Click **"Add New Project"**
4. **Import** your GitHub repository
5. Vercel auto-detects Next.js settings ✅
6. Click **"Deploy"**

**3. Add Environment Variables**
After deployment, go to:
- Project Settings → Environment Variables
- Add these one by one:

```
MONGODB_URI = mongodb+srv://your-connection-string
NEXTAUTH_SECRET = (generate with: openssl rand -base64 32)
NEXTAUTH_URL = https://your-app.vercel.app
GROQ_API_KEY = your-groq-key
NEXT_PUBLIC_APP_URL = https://your-app.vercel.app
```

**4. Redeploy**
- Go to Deployments tab
- Click "Redeploy" on latest deployment

**Done! Your app is live! 🎉**

---

## Method 2: Using Vercel CLI

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
cd "/Users/ashu/Desktop/untitled folder"
vercel

# 4. Follow prompts (accept defaults)

# 5. For production deployment:
vercel --prod
```

---

## Method 3: Automated Script

I've created a script for you!

```bash
# Make script executable
chmod +x deploy-to-vercel.sh

# Run it
./deploy-to-vercel.sh
```

The script will:
- ✅ Initialize Git
- ✅ Test your build
- ✅ Install Vercel CLI
- ✅ Deploy your app
- ✅ Give you next steps

---

## After Deployment Checklist

### 1. Update NEXTAUTH_URL
Once deployed, Vercel gives you a URL like: `https://your-app.vercel.app`

Update your environment variable:
```
NEXTAUTH_URL = https://your-app.vercel.app
```

### 2. Test Your App
Visit these URLs:
- `https://your-app.vercel.app` - Landing page
- `https://your-app.vercel.app/auth/register` - Register
- `https://your-app.vercel.app/auth/login` - Login
- `https://your-app.vercel.app/dashboard` - Dashboard

### 3. Update OAuth Callbacks (if using)

**Google OAuth:**
- Go to: https://console.cloud.google.com
- Add redirect URI: `https://your-app.vercel.app/api/auth/callback/google`

**GitHub OAuth:**
- Go to: https://github.com/settings/developers
- Add callback URL: `https://your-app.vercel.app/api/auth/callback/github`

---

## Custom Domain (Optional)

### Add Your Own Domain:

**1. Buy a domain** (NameCheap, GoDaddy, etc.)

**2. In Vercel:**
- Go to Project Settings → Domains
- Click "Add Domain"
- Enter your domain: `www.yoursite.com`

**3. Update DNS Records:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**4. Update Environment Variables:**
```
NEXTAUTH_URL = https://www.yoursite.com
NEXT_PUBLIC_APP_URL = https://www.yoursite.com
```

**Done! SSL is automatic! 🔒**

---

## Environment Variables Quick Reference

Copy these and fill in your values:

```bash
# Database
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/database"
MONGODB_DB="leetcode_progress_analyzer"

# Authentication
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="https://your-app.vercel.app"

# AI
GROQ_API_KEY="your-groq-api-key"
GROQ_MODEL="llama3-70b-8192"

# App
NEXT_PUBLIC_APP_NAME="LeetCode Progress Analyzer"
NEXT_PUBLIC_APP_URL="https://your-app.vercel.app"

# LeetCode
LEETCODE_GRAPHQL_URL="https://leetcode.com/graphql"

# Redis (Optional)
REDIS_URL="redis://your-redis-url"

# OAuth (Optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

---

## Generate NEXTAUTH_SECRET

```bash
# On Mac/Linux:
openssl rand -base64 32

# On Windows (PowerShell):
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Or use online generator:
# https://generate-secret.vercel.app/32
```

---

## Alternative Platforms

### Netlify:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Railway:
1. Go to: https://railway.app
2. New Project → Deploy from GitHub
3. Select repository → Deploy!

### Render:
1. Go to: https://render.com
2. New Web Service → Connect GitHub
3. Configure and deploy

---

## Troubleshooting

### Build Failed?
```bash
# Test locally first
npm run build

# Fix any errors
# Then push changes and redeploy
```

### Environment Variables Not Working?
```bash
# Make sure to:
# 1. Add ALL required variables
# 2. NO quotes around values in Vercel dashboard
# 3. Redeploy after adding variables
```

### Database Connection Failed?
```bash
# MongoDB Atlas:
# 1. Network Access → Allow 0.0.0.0/0
# 2. Database Access → Check username/password
# 3. Test connection string locally
```

### OAuth Not Working?
```bash
# Update redirect URLs:
# Google: Add https://your-app.vercel.app/api/auth/callback/google
# GitHub: Add https://your-app.vercel.app/api/auth/callback/github
```

---

## Cost

**Vercel Free Tier includes:**
- ✅ Unlimited deployments
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ 100GB bandwidth/month
- ✅ Serverless functions
- ✅ Preview deployments

**Perfect for this app! $0/month** 🎉

---

## Next Steps After Deployment

1. ✅ Share your app with friends
2. ✅ Monitor usage in Vercel dashboard
3. ✅ Set up analytics (Vercel Analytics)
4. ✅ Add more features
5. ✅ Collect user feedback

---

## Quick Commands Cheat Sheet

```bash
# Deploy to Vercel
vercel

# Deploy to production
vercel --prod

# Check deployment status
vercel ls

# View logs
vercel logs

# Open project in browser
vercel open
```

---

## Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Vercel Support:** https://vercel.com/support

---

## Summary

**Fastest Way:**
1. Push to GitHub (5 min)
2. Import to Vercel (1 min)
3. Add environment variables (2 min)
4. Deploy! ✅

**Total Time:** ~8 minutes

**Your app is now live and accessible worldwide! 🌍**

🎉 **Congratulations on deploying your app!** 🎉
