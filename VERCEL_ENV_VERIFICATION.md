# Vercel Environment Variable Verification

## Steps to Verify Your Setup

### 1. Check Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Verify `ZUPERIOR_API_URL` exists
4. Check the value - it should be something like:
   ```
   https://zuperior-crm-api.onrender.com/api
   ```
5. Ensure it's enabled for **Production**, **Preview**, and **Development**

### 2. Redeploy Your Application

**Important:** After setting/changing environment variables, you MUST redeploy:

1. Go to **Deployments** tab
2. Click the **three dots** (⋯) on the latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

### 3. Test the Configuration Endpoint

After redeploying, visit:
```
https://your-frontend-domain.vercel.app/api/auth/test-config
```

This will show you:
- Which environment variable is being used
- The actual URL that will be called
- All environment variable values (for debugging)

### 4. Check Server Logs

In Vercel, go to your deployment → **Functions** tab → View logs

Look for:
```
[Reset Password API] Using backend URL: https://...
[Reset Password API] Environment check: { ... }
[Reset Password API] Calling: https://.../api/auth/reset-password
```

### 5. Verify the Backend Endpoint Exists

Test the endpoint directly on your zuperior-api server:

```bash
curl -X POST https://your-zuperior-api-domain.com/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"test","newPassword":"test123"}'
```

**Expected response:**
- `400 Bad Request` with "Invalid or expired reset token" = ✅ Endpoint exists!
- `404 Not Found` = ❌ Endpoint doesn't exist (wrong server or not deployed)

---

## Common Issues

### Issue 1: Environment Variable Not Being Read

**Symptoms:**
- Logs show `localhost:8000`
- `test-config` endpoint shows "NOT SET"

**Solution:**
1. Verify variable name is exactly: `ZUPERIOR_API_URL` (case-sensitive)
2. Ensure it's enabled for the correct environment (Production)
3. **Redeploy** after setting the variable
4. Clear Vercel build cache if needed

### Issue 2: Wrong URL Format

**Symptoms:**
- 404 errors
- URL looks wrong in logs

**Correct format:**
```
https://zuperior-crm-api.onrender.com/api
```

**Wrong formats:**
```
https://zuperior-crm-api.onrender.com        ❌ Missing /api
https://zuperior-crm-api.onrender.com/api/   ⚠️ Trailing slash (might work but not ideal)
http://localhost:8000                        ❌ Localhost won't work in production
```

### Issue 3: Pointing to Wrong Server

**Symptoms:**
- 404 errors persist
- Endpoint doesn't exist

**Remember:**
- `zuperior-server` (port 5000) = Does NOT have reset-password endpoint
- `zuperior-api` (port 8000) = HAS reset-password endpoint ✅

**Solution:**
Ensure `ZUPERIOR_API_URL` points to **zuperior-api**, not zuperior-server.

---

## Quick Test Commands

### Test 1: Check Configuration
```bash
curl https://your-frontend-domain.vercel.app/api/auth/test-config
```

### Test 2: Test Backend Endpoint
```bash
curl -X POST https://your-zuperior-api-domain.com/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"test","newPassword":"test123"}'
```

### Test 3: Check Backend Health
```bash
curl https://your-zuperior-api-domain.com/health
```

---

## Expected Values

After setting up correctly, `test-config` should return:

```json
{
  "environment": "production",
  "zuperiorApiUrl": "https://zuperior-crm-api.onrender.com/api",
  "fullResetPasswordUrl": "https://zuperior-crm-api.onrender.com/api/auth/reset-password",
  "environmentVariables": {
    "ZUPERIOR_API_URL": "https://zuperior-crm-api.onrender.com/api",
    "NEXT_PUBLIC_ZUPERIOR_API_URL": "NOT SET",
    "NEXT_PUBLIC_BACKEND_API_URL": "https://your-other-backend.com/api"
  },
  "priority": {
    "using": "ZUPERIOR_API_URL (server-side)"
  }
}
```

---

## Still Getting 404?

1. **Check the `test-config` endpoint** - see what URL is actually being used
2. **Check Vercel logs** - look for the actual URL being called
3. **Test backend directly** - verify the endpoint exists on your zuperior-api server
4. **Verify deployment** - ensure zuperior-api has the latest code with reset-password endpoint
5. **Check CORS** - ensure backend allows requests from your frontend domain

