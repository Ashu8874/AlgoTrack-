# 🚀 How to Run the LeetCode Progress Analyzer

## Quick Start

### Development Mode (Recommended)
```bash
npm run dev
```
Then open: **http://localhost:3000**

---

## All Available Commands

### 1. Development Server
```bash
npm run dev
```
- Starts development server with hot reload
- Default port: 3000
- Access at: http://localhost:3000 or http://127.0.0.1:3000

### 2. Production Build
```bash
npm run build
```
- Creates optimized production build
- Compiles TypeScript
- Optimizes assets
- Use before deploying

### 3. Start Production Server
```bash
npm run build && npm start
```
- First builds the project
- Then starts production server
- Runs on port 3000

### 4. Run Linter
```bash
npm run lint
```
- Checks code quality
- Shows ESLint warnings/errors

### 5. Format Code (if prettier configured)
```bash
npm run format
```
- Auto-formats all code files

---

## Complete Setup & Run Process

### First Time Setup
```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Make sure .env file is configured
# Check MongoDB URI, Redis URL, API keys

# 3. Start development server
npm run dev
```

### Daily Development
```bash
# Just run this command
npm run dev
```

---

## Environment Requirements

### Check Before Running
1. ✅ **Node.js** installed (v18+ recommended)
2. ✅ **.env file** exists with all variables set
3. ✅ **MongoDB** connection URL is valid
4. ✅ **Port 3000** is available (not used by another app)

### Optional Services
- **Redis**: For caching (optional, will work without it)
- **Groq API**: For AI features (optional)

---

## Access Points After Starting

### Main Application
- **Homepage**: http://localhost:3000
- **Login**: http://localhost:3000/auth/login
- **Register**: http://localhost:3000/auth/register
- **Dashboard**: http://localhost:3000/dashboard
- **Settings**: http://localhost:3000/dashboard/settings

### API Endpoints (Test)
- **Health Check**: http://localhost:3000/api/auth/test
- **User Profile**: http://localhost:3000/api/user/update

---

## Troubleshooting

### Port Already in Use
```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process (replace PID with actual number)
kill -9 PID

# Or use a different port
PORT=3001 npm run dev
```

### Clear Cache & Restart
```bash
# Remove build cache
rm -rf .next

# Restart dev server
npm run dev
```

### Module Not Found Errors
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
npm run dev
```

### .env Issues
```bash
# Make sure .env exists in project root
ls -la .env

# Check required variables are set
cat .env | grep -E "(MONGODB_URI|NEXTAUTH_SECRET|NEXTAUTH_URL)"
```

---

## Development Workflow

### 1. Start Development
```bash
npm run dev
```

### 2. Make Changes
- Edit files in `src/`
- Changes auto-reload in browser
- Check terminal for errors

### 3. Test Changes
- Open http://localhost:3000
- Test features manually
- Check browser console (F12)
- Check server terminal logs

### 4. Build for Production
```bash
# Test if build works
npm run build

# If successful, start production
npm start
```

---

## Key URLs Reference

| Page | URL | Description |
|------|-----|-------------|
| Home | http://localhost:3000 | Landing page |
| Login | http://localhost:3000/auth/login | User login |
| Register | http://localhost:3000/auth/register | New user signup |
| Dashboard | http://localhost:3000/dashboard | Main dashboard |
| Settings | http://localhost:3000/dashboard/settings | Add LeetCode account |
| Charts | http://localhost:3000/dashboard/charts | Analytics |
| Submissions | http://localhost:3000/dashboard/submissions | Problem history |

---

## Quick Testing Flow

### Test Complete Authentication Flow
```bash
# 1. Start server
npm run dev

# 2. Open browser to http://localhost:3000/auth/register
# 3. Register with:
#    - Name: Test User
#    - Email: test@example.com
#    - Password: Test123456!
#    - LeetCode Username: your_username

# 4. Login with same credentials
# 5. Should redirect to dashboard or settings
```

### Test LeetCode Integration
```bash
# 1. Go to http://localhost:3000/dashboard/settings
# 2. Enter your actual LeetCode username
# 3. Click "Connect LeetCode Account"
# 4. Dashboard should load with your stats
```

---

## Common Issues & Solutions

### ❌ Error: Port 3000 already in use
**Solution:**
```bash
# Kill the existing process
killall -9 node

# Or use different port
PORT=3001 npm run dev
```

### ❌ Error: NEXTAUTH_URL mismatch
**Solution:**
- Check .env has: `NEXTAUTH_URL="http://localhost:3000"`
- Restart dev server after changing .env
- Access at same URL as NEXTAUTH_URL

### ❌ Error: MongoDB connection failed
**Solution:**
- Check MongoDB URI is correct
- Test connection: `curl http://localhost:3000/api/auth/test`
- Verify network access to MongoDB Atlas

### ❌ Error: Module not found
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

## Production Deployment

### Build for Production
```bash
# 1. Clean install dependencies
npm ci

# 2. Build optimized version
npm run build

# 3. Start production server
npm start
```

### Environment for Production
- Set `NODE_ENV=production`
- Use production MongoDB database
- Set secure `NEXTAUTH_SECRET`
- Configure proper domain in `NEXTAUTH_URL`

---

## Need Help?

### Check Logs
- **Server logs**: Terminal where npm run dev is running
- **Browser logs**: F12 → Console tab
- **Build errors**: Output of `npm run build`

### Verify Setup
```bash
# Check Node version
node --version

# Check npm version  
npm --version

# Check if .env exists
cat .env

# Test MongoDB connection
curl http://localhost:3000/api/auth/test
```

---

## Summary - Most Common Commands

```bash
# Start development (use this most often)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Check for code issues
npm run lint

# Clear cache and restart
rm -rf .next && npm run dev
```

**Main URL:** http://localhost:3000

**That's it! Your project should now be running! 🎉**
