# Deployment Notes

## Vercel Deployment & Cache Management

### Quick Reference
- **Production URL:** https://family-glitch.vercel.app
- **Git Branch:** main
- **Auto-Deploy:** ⚠️ **CURRENTLY BROKEN** - GitHub integration not triggering deploys

### ⚠️ IMPORTANT: Manual Deployment Required

**Current Issue:** Git pushes to `main` are NOT automatically triggering Vercel deployments.

**Workaround - Manual Deploy via CLI:**
```bash
# This is currently the ONLY way to deploy changes
npx vercel --prod --yes
```

**To Fix the Git Integration:**
1. Go to: https://vercel.com/taylors-projects-76c75866/family-glitch/settings/git
2. Check if Git repository is connected to `taylorbayouth/family-glitch`
3. Verify it's deploying from `main` branch
4. If disconnected, click "Connect Git Repository" and reconnect
5. Make sure "Auto-deploy" is enabled

**Until the integration is fixed:**
- After making changes and pushing to GitHub, you MUST run `npx vercel --prod --yes`
- The deployment takes ~30-40 seconds
- You'll see the build output in your terminal
- At the end, it will show the production URL

### Common Issues & Solutions

#### 1. Changes Not Showing on Production

**Symptoms:**
- Pushed to GitHub but production still shows old version
- Old chunk hashes in HTML (e.g., `page-1d3fa4d336c1e14a.js`)

**Causes:**
- Vercel build in progress (takes 1-3 minutes)
- Browser cache
- Vercel edge cache

**Solutions:**

**A. Wait for Vercel Build (Recommended)**
```bash
# Check if new chunk hash appears (wait 2-3 minutes after push)
curl -s "https://family-glitch.vercel.app/?t=$(date +%s)" | grep -o 'page-[a-f0-9]*\.js' | head -1

# Compare to local build
ls .next/static/chunks/app/ | grep page
```

**B. Force Redeployment**
```bash
# Option 1: Empty commit (triggers new build)
git commit --allow-empty -m "Force deployment"
git push origin main

# Option 2: Trigger via Vercel CLI
vercel --prod --force

# Option 3: Redeploy from Vercel Dashboard
# Go to: https://vercel.com/taylorbayouth/family-glitch/deployments
# Click "..." on latest deployment → "Redeploy"
```

**C. Clear Browser Cache**
```bash
# Hard refresh in browser
# Mac: Cmd+Shift+R
# Windows: Ctrl+Shift+R
# Or use incognito/private mode
```

#### 2. API Routes Not Updating

**Check API Route Cache:**
```bash
curl -I "https://family-glitch.vercel.app/api/llm" 2>&1 | grep -E "(cache|age|x-vercel)"
```

**Expected Response:**
```
cache-control: public, max-age=0, must-revalidate
x-vercel-cache: MISS  # or HIT with age: 0
```

**If Stuck:**
- API routes should auto-invalidate on new deployment
- Check Vercel function logs for errors
- Verify OPENAI_API_KEY is set in Vercel environment variables

#### 3. Verify Deployment Status

**Check Git Status:**
```bash
git log --oneline -3  # See recent commits
git status            # Ensure everything is pushed
```

**Check Vercel Deployment:**
```bash
# View deployment URL from git commit
# Vercel comments on GitHub commits with deployment URLs

# Check response headers
curl -I https://family-glitch.vercel.app/ | grep -E "(age|cache|etag|x-vercel-id)"
```

**Key Headers:**
- `age: 0` → Fresh deployment
- `age: 900+` → Old cached version
- `x-vercel-cache: HIT` → Served from cache
- `x-vercel-cache: MISS` → Fresh from origin
- `etag` → Changes when deployment updates

### Deployment Checklist

**Before Pushing:**
- [ ] `npm run build` succeeds locally
- [ ] Test changes in local dev mode
- [ ] Commit message describes changes
- [ ] All files staged and committed

**After Pushing:**
- [ ] Wait 2-3 minutes for Vercel build
- [ ] Check chunk hash changed (see command above)
- [ ] Test in incognito window (no browser cache)
- [ ] Verify API endpoints work (check browser console)
- [ ] Check that localStorage clears work as expected

**If Issues:**
1. Check Vercel build logs (Vercel Dashboard)
2. Verify environment variables are set
3. Force redeployment (empty commit or Vercel CLI)
4. Clear browser cache completely

### Cache-Busting Strategies

**For Testing:**
```bash
# Add timestamp to URL to bypass cache
curl "https://family-glitch.vercel.app/?_nocache=$(date +%s)"

# Or in browser:
# https://family-glitch.vercel.app/?_t=123456789
```

**For Users:**
- Next.js automatically cache-busts with chunk hashes
- Users should see updates automatically after Vercel deploys
- If stuck, users can hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### Monitoring Deployments

**Vercel Dashboard:**
- https://vercel.com/taylorbayouth/family-glitch
- Shows build status, logs, and deployment history
- Can manually trigger redeployments

**GitHub Actions:**
- Vercel bot comments on commits with deployment URLs
- Check commit status for deployment progress

**CLI Monitoring:**
```bash
# Check if deployment is live by comparing hashes
LOCAL_HASH=$(ls .next/static/chunks/app/ | grep page | cut -d'-' -f2 | cut -d'.' -f1)
PROD_HASH=$(curl -s https://family-glitch.vercel.app/ | grep -o 'page-[a-f0-9]*\.js' | head -1 | cut -d'-' -f2 | cut -d'.' -f1)

if [ "$LOCAL_HASH" = "$PROD_HASH" ]; then
  echo "✅ Production is up to date"
else
  echo "⏳ Waiting for deployment... Local: $LOCAL_HASH, Prod: $PROD_HASH"
fi
```

## OpenAI API Notes

### Current Configuration
- Model: `gpt-5.2`
- API: Uses `responses.create()` with `input` parameter (not the older `chat.completions` format)
- Response Format: JSON enforced via system prompt instructions
- Retries: 3 attempts with exponential backoff

### Common API Errors

**500 Errors:**
- Usually due to invalid model name or API format
- Check that OPENAI_API_KEY is valid and has GPT-5.2 access
- Verify request format matches OpenAI's latest spec

**JSON Parsing Errors:**
- Using `response_format: { type: 'json_object' }` should prevent this
- LLM is instructed to return valid JSON only
- Fallback safe content if parsing fails

### Testing API Locally

```bash
# Check if API route works
curl -X POST http://localhost:3000/api/llm \
  -H "Content-Type: application/json" \
  -d '{
    "requestType": "next-prompt",
    "currentState": "ACT1_FACT_PROMPT_PRIVATE",
    "currentAct": 1,
    "players": [{"id": "1", "name": "Test", "age": 25, "role": "dad"}],
    "activePlayerId": "1",
    "recentEvents": [],
    "factsDB": [],
    "currentScores": {},
    "timeElapsedMs": 0,
    "targetDurationMs": 900000,
    "act1FactCount": 0,
    "act2RoundsCompleted": 0,
    "safetyMode": "teen-adult"
  }'
```

## Environment Variables

**Required in Vercel:**
```
OPENAI_API_KEY=sk-...
```

**To Update:**
1. Go to Vercel Dashboard → Settings → Environment Variables
2. Update value
3. Trigger redeploy for changes to take effect

## Troubleshooting Quick Commands

```bash
# Full deployment check
echo "Checking deployment status..."
git log --oneline -1
npm run build
LOCAL=$(ls .next/static/chunks/app/ | grep page)
PROD=$(curl -s https://family-glitch.vercel.app/ | grep -o 'page-[a-f0-9]*\.js' | head -1)
echo "Local: $LOCAL"
echo "Prod:  $PROD"

# Force fresh deployment
git commit --allow-empty -m "Force deployment refresh"
git push origin main

# Check API health
curl -I https://family-glitch.vercel.app/api/llm
```

---

**Last Updated:** 2026-01-18
**Maintained By:** Taylor Bayouth + Claude
