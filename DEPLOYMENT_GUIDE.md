# 🚀 Deployment Guide - LeetCode Progress Analyzer

## Overview
This guide covers deploying your Next.js app to popular platforms: Vercel, Netlify, Railway, Render, and AWS.

---

## 📋 Pre-Deployment Checklist

### 1. Prepare Your Code
```bash
# 1. Test production build locally
npm run build
npm start

# 2. Test at http://localhost:3000
# Make sure everything works!

# 3. Check for errors
npm run lint

# 4. Remove sensitive data from code
# Don't commit API keys, passwords, etc.
```

### 2. Environment Variables
Make sure you have these ready:
- `MONGODB_URI` - Your MongoDB connection string
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Will be your production URL
- `GROQ_API_KEY` - Your Groq API key
- `REDIS_URL` - Your Redis connection (optional)
- `NEXT_PUBLIC_APP_URL` - Your production URL
- `GOOGLE_CLIENT_ID` - (if using Google OAuth)
- `GOOGLE_CLIENT_SECRET` - (if using Google OAuth)
- `GITHUB_CLIENT_ID` - (if using GitHub OAuth)
- `GITHUB_CLIENT_SECRET` - (if using GitHub OAuth)

### 3. Database Setup
- ✅ MongoDB Atlas account created
- ✅ Database accessible from anywhere (0.0.0.0/0) or specific IPs
- ✅ User credentials work
- ✅ Test connection locally

---

## 🟢 Option 1: Deploy to Vercel (Recommended - Easiest)

### Why Vercel?
- Made by Next.js creators
- Zero configuration needed
- Automatic deployments from Git
- Free SSL certificates
- Excellent performance
- **FREE tier available**

### Step-by-Step Deployment:

#### Method A: Using Vercel CLI
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
cd "/Users/ashu/Desktop/untitled folder"
vercel

# Follow prompts:
# - Set up new project? Yes
# - Link to existing project? No
# - Project name? leetcode-progress-analyzer
# - Directory? ./
# - Modify settings? No

# 4. Add environment variables
vercel env add MONGODB_URI
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL
vercel env add GROQ_API_KEY
# ... add all your env variables

# 5. Deploy to production
vercel --prod
```

#### Method B: Using Vercel Dashboard (Easier)
```bash
# 1. Push code to GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/leetcode-analyzer.git
git push -u origin main

# 2. Go to https://vercel.com
# 3. Sign up/Login with GitHub
# 4. Click "Add New Project"
# 5. Import your GitHub repository
# 6. Configure:
#    - Framework Preset: Next.js
#    - Root Directory: ./
#    - Build Command: npm run build
#    - Output Directory: .next
# 7. Add Environment Variables (all from .env)
# 8. Click Deploy!
```

### After Deployment:
1. Vercel gives you a URL like: `https://your-app.vercel.app`
2. Update `NEXTAUTH_URL` to your Vercel URL
3. Redeploy if needed

### Custom Domain (Optional):
1. Go to Project Settings → Domains
2. Add your domain (e.g., `leetcode-tracker.com`)
3. Update DNS records as instructed
4. SSL certificate auto-configured!

---

## 🔵 Option 2: Deploy to Netlify

### Step-by-Step:

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Login
netlify login

# 3. Build for production
npm run build

# 4. Create netlify.toml
cat > netlify.toml << 'EOF'
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
EOF

# 5. Deploy
netlify deploy --prod

# 6. Add environment variables via Netlify dashboard
# Site Settings → Environment Variables
```

**Or use Netlify Dashboard:**
1. Push to GitHub
2. Go to https://netlify.com
3. New site from Git
4. Connect GitHub repo
5. Configure build settings
6. Add environment variables
7. Deploy!

---

## 🟣 Option 3: Deploy to Railway

### Why Railway?
- Simple deployment
- Built-in database services
- Automatic HTTPS
- $5 free credit/month

### Step-by-Step:

```bash
# 1. Push to GitHub first
git init
git add .
git commit -m "Deploy to Railway"
git push

# 2. Go to https://railway.app
# 3. Sign up with GitHub
# 4. New Project → Deploy from GitHub
# 5. Select your repository
# 6. Add environment variables:
#    - Go to Variables tab
#    - Add all from .env
#    - NEXTAUTH_URL will be: https://your-app.railway.app
# 7. Railway auto-deploys!
```

### Add MongoDB on Railway:
1. New → Database → MongoDB
2. Copy connection string
3. Update MONGODB_URI variable
4. Redeploy

---

## 🔴 Option 4: Deploy to Render

### Step-by-Step:

```bash
# 1. Push to GitHub

# 2. Go to https://render.com
# 3. New → Web Service
# 4. Connect GitHub repository
# 5. Configure:
#    - Name: leetcode-analyzer
#    - Environment: Node
#    - Build Command: npm install && npm run build
#    - Start Command: npm start
#    - Instance Type: Free
# 6. Add environment variables
# 7. Create Web Service
```

---

## 🟠 Option 5: Deploy to AWS (Advanced)

### Using AWS Amplify:

```bash
# 1. Install Amplify CLI
npm install -g @aws-amplify/cli

# 2. Configure Amplify
amplify configure

# 3. Initialize
amplify init

# 4. Add hosting
amplify add hosting

# 5. Publish
amplify publish
```

### Using AWS Elastic Beanstalk:
```bash
# 1. Install EB CLI
pip install awsebcli

# 2. Initialize
eb init

# 3. Create environment
eb create production

# 4. Deploy
eb deploy

# 5. Set environment variables
eb setenv MONGODB_URI=xxx NEXTAUTH_SECRET=yyy
```

---

## 🐳 Option 6: Deploy with Docker

### Create Dockerfile:

```dockerfile
# Create this file: Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy app files
COPY . .

# Build app
RUN npm run build

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
```

### Create docker-compose.yml:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=${MONGODB_URI}
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
      - GROQ_API_KEY=${GROQ_API_KEY}
    restart: unless-stopped
```

### Deploy:

```bash
# Build image
docker build -t leetcode-analyzer .

# Run container
docker run -p 3000:3000 --env-file .env leetcode-analyzer

# Or use docker-compose
docker-compose up -d
```

---

## 📝 Post-Deployment Steps

### 1. Update OAuth Redirect URLs

**Google OAuth:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Update Authorized redirect URIs:
   - Add: `https://your-domain.com/api/auth/callback/google`

**GitHub OAuth:**
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. OAuth Apps → Your App
3. Update Authorization callback URL:
   - Add: `https://your-domain.com/api/auth/callback/github`

### 2. Test Production Deployment

```bash
# Test these URLs:
https://your-domain.com                    # Landing page
https://your-domain.com/auth/login         # Login page
https://your-domain.com/auth/register      # Register page
https://your-domain.com/dashboard          # Dashboard (after login)
https://your-domain.com/api/auth/test      # API test
```

### 3. Monitor Your App

**Vercel:**
- Dashboard → Your Project → Analytics
- Real-time logs
- Performance metrics

**Railway:**
- Project → Deployments → Logs
- View build and runtime logs

**Render:**
- Dashboard → Logs tab
- Monitor requests and errors

### 4. Set Up Custom Domain

**Buy Domain:** (NameCheap, GoDaddy, Google Domains, etc.)

**Configure DNS:**
```
# For Vercel:
Type: CNAME
Name: @
Value: cname.vercel-dns.com

# For Netlify:
Type: CNAME  
Name: @
Value: your-app.netlify.app

# For Railway:
Type: CNAME
Name: @
Value: your-app.railway.app
```

---

## 🔐 Security Best Practices

### 1. Environment Variables
```bash
# Never commit .env to Git!
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore

# Use different secrets for production
NEXTAUTH_SECRET=$(openssl rand -base64 32)
```

### 2. CORS Configuration
```typescript
// In next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' },
        ],
      },
    ];
  },
};
```

### 3. Rate Limiting
Consider adding rate limiting to your API routes to prevent abuse.

---

## 💰 Cost Comparison

| Platform | Free Tier | Paid Plans |
|----------|-----------|------------|
| **Vercel** | Unlimited (Hobby) | $20/mo (Pro) |
| **Netlify** | 100GB bandwidth | $19/mo (Pro) |
| **Railway** | $5 credit/mo | $5+/mo (usage) |
| **Render** | 750 hrs/mo | $7/mo+ |
| **AWS** | 12 months free | Variable |

**Recommendation:** Start with **Vercel Free** tier - it's perfect for this app!

---

## 🐛 Common Deployment Issues

### Issue: "Module not found"
```bash
# Solution: Make sure all dependencies are in package.json
npm install
npm run build
# Then redeploy
```

### Issue: "Environment variable undefined"
```bash
# Solution: Add all env variables to deployment platform
# Check spelling and values
# Restart deployment after adding variables
```

### Issue: "Database connection failed"
```bash
# Solution: 
# 1. Check MongoDB allows connections from 0.0.0.0/0
# 2. Verify MONGODB_URI is correct
# 3. Test connection locally first
```

### Issue: "NextAuth redirect loop"
```bash
# Solution: Make sure NEXTAUTH_URL matches your production URL
NEXTAUTH_URL=https://your-actual-domain.com
```

---

## 📊 Monitoring & Analytics

### Add Analytics:

**Vercel Analytics:**
```bash
npm install @vercel/analytics
```

```typescript
// In src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## 🎯 Quick Start: Fastest Way to Deploy

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Ready for deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/leetcode-analyzer.git
git push -u origin main

# 2. Deploy to Vercel (1-click)
# Go to: https://vercel.com/new
# Import your GitHub repo
# Add environment variables
# Click Deploy!

# Done! ✅ Your app is live in ~2 minutes!
```

---

## 📚 Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Atlas Setup](https://docs.atlas.mongodb.com/)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)

---

## ✅ Deployment Checklist

Before going live:
- [ ] Test production build locally
- [ ] All environment variables set
- [ ] Database connection works
- [ ] OAuth redirect URLs updated
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Test all main features
- [ ] Monitor logs after deployment

---

## 🎉 Congratulations!

Your LeetCode Progress Analyzer is now live! 🚀

**Next Steps:**
1. Share with friends
2. Add more features
3. Monitor usage
4. Collect feedback
5. Iterate and improve!

Need help? Check platform-specific documentation or community forums!
