# Vercel Deployment Guide for Wingman

## ✅ Pre-Deployment Checklist (COMPLETED)

All issues have been fixed and the app is ready for deployment!

### Fixed Issues:
1. ✅ Removed duplicate mongoose index warning in `Itinerary.ts`
2. ✅ Removed top-level await from `auth-client.ts` 
3. ✅ Created `.env.example` with all required variables
4. ✅ Build completes successfully with no errors

---

## 🚀 Deploy to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Import Project to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository: `Emna147/wingman`
4. Vercel will auto-detect Next.js settings

### Step 3: Configure Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

#### Required Variables:
```
BETTER_AUTH_SECRET=LmjwhlTd03sb1CDAkTXvNbrIxMBXZzSQ
BETTER_AUTH_URL=https://your-app.vercel.app
NEXT_PUBLIC_BETTER_AUTH_URL=https://your-app.vercel.app
MONGODB_URI=mongodb+srv://user:147ffae7@wingman.shqdrx7.mongodb.net/wingman?retryWrites=true&w=majority&appName=wingman
```

#### AI/Gemini Variables:
```
GOOGLE_AI_API_KEY=AIzaSyCmj4IBfg7fD2ON_QWz9BZC7MxKCyQAVyM
GEMINI_API_KEY=AIzaSyAiHyezlxKsPT6twScB56XKwFvUgTU3b9E
GEMINI_MODEL_NAME=gemini-2.5-flash
```

#### Optional (Google OAuth):
```
GOOGLE_CLIENT_ID=156865781069-k1hv05o9u79rdckr7rhdjn12u61jjb57.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

**⚠️ IMPORTANT:** After deployment, update `BETTER_AUTH_URL` and `NEXT_PUBLIC_BETTER_AUTH_URL` with your actual Vercel URL (e.g., `https://wingman.vercel.app`)

### Step 4: Deploy
Click "Deploy" and wait for the build to complete.

---

## 📝 Post-Deployment Steps

### 1. Update Auth URLs
Once deployed, get your Vercel URL (e.g., `https://wingman-xyz.vercel.app`) and:
1. Update environment variables in Vercel Dashboard
2. Redeploy to apply changes

### 2. Update Google OAuth (if using)
Add your Vercel URL to Google Console authorized redirect URIs:
- `https://your-app.vercel.app/api/auth/callback/google`

### 3. Test Your Deployment
- ✅ Authentication (sign up/sign in)
- ✅ Visa management features
- ✅ Trip planning features
- ✅ Database connections
- ✅ AI-powered forecasts

---

## 🔧 Build Configuration

The project uses:
- **Framework:** Next.js 15.5.6
- **Node Version:** 20+ (automatically configured by Vercel)
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

---

## 🎉 Your App is Ready!

All errors have been resolved:
- ✅ No TypeScript errors
- ✅ No build warnings
- ✅ All dependencies installed
- ✅ MongoDB connection working
- ✅ Clean build output

You can now deploy to Vercel with confidence!
