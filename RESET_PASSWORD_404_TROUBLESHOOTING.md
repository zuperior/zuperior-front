# Reset Password 404 Error - Troubleshooting Guide

## Problem
Getting `404 Not Found` when trying to reset password.

## Root Cause
The frontend is likely calling the wrong backend server:
- **zuperior-server** (port 5000) - Does NOT have `/api/auth/reset-password`
- **zuperior-api** (port 8000) - HAS `/api/auth/reset-password` ✅

## Solution

### Step 1: Identify Your Backend Servers

You have **two different backend servers**:

1. **zuperior-server** (Node.js/Express)
   - Default: `http://localhost:5000`
   - Production: Your zuperior-server URL
   - Does NOT have forgot/reset password endpoints

2. **zuperior-api** (FastAPI/Python)
   - Default: `http://localhost:8000`
   - Production: `https://zuperior-crm-api.onrender.com` (or your custom domain)
   - HAS `/api/auth/forgot-password` and `/api/auth/reset-password` ✅

### Step 2: Set the Correct Environment Variable

**For Production, set:**

```bash
ZUPERIOR_API_URL=https://zuperior-crm-api.onrender.com/api
```

Or if you have a custom domain:
```bash
ZUPERIOR_API_URL=https://api.zuperior.com/api
```

**Important:** This should point to your **zuperior-api** server, NOT zuperior-server!

### Step 3: Verify the Endpoint Exists

Test if the endpoint exists on your backend:

```bash
# Test the endpoint directly
curl -X POST https://zuperior-crm-api.onrender.com/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"test","newPassword":"test123"}'
```

**Expected responses:**
- `400 Bad Request` with "Invalid or expired reset token" = ✅ Endpoint exists!
- `404 Not Found` = ❌ Endpoint doesn't exist (wrong server or URL)

### Step 4: Check Server Logs

After setting the environment variable and redeploying, check your frontend server logs. You should see:

```
[Reset Password API] Using backend URL: https://zuperior-crm-api.onrender.com/api
[Reset Password API] Calling: https://zuperior-crm-api.onrender.com/api/auth/reset-password
```

If you see `localhost:8000` or a different URL, the environment variable is not set correctly.

---

## Common Mistakes

### ❌ Wrong: Using zuperior-server URL
```bash
ZUPERIOR_API_URL=https://your-zuperior-server.com/api  # Wrong!
```
This server doesn't have the reset-password endpoint.

### ✅ Correct: Using zuperior-api URL
```bash
ZUPERIOR_API_URL=https://zuperior-crm-api.onrender.com/api  # Correct!
```

### ❌ Wrong: Missing /api suffix
```bash
ZUPERIOR_API_URL=https://zuperior-crm-api.onrender.com  # Missing /api
```

### ✅ Correct: Includes /api suffix
```bash
ZUPERIOR_API_URL=https://zuperior-crm-api.onrender.com/api  # Correct!
```

---

## Quick Diagnostic

Add this to your frontend to see what URL is being used:

```typescript
// In your reset-password page or API route
console.log('ZUPERIOR_API_URL:', process.env.ZUPERIOR_API_URL);
console.log('NEXT_PUBLIC_ZUPERIOR_API_URL:', process.env.NEXT_PUBLIC_ZUPERIOR_API_URL);
console.log('NEXT_PUBLIC_BACKEND_API_URL:', process.env.NEXT_PUBLIC_BACKEND_API_URL);
```

---

## Production Setup Checklist

- [ ] Identify your zuperior-api production URL
- [ ] Set `ZUPERIOR_API_URL` environment variable in hosting platform
- [ ] Ensure URL includes `/api` suffix
- [ ] Redeploy frontend application
- [ ] Test the endpoint directly with curl
- [ ] Check server logs for the actual URL being used
- [ ] Verify 404 is resolved

---

## Example Production Configuration

**Vercel Environment Variables:**
```
ZUPERIOR_API_URL=https://zuperior-crm-api.onrender.com/api
```

**Render Environment Variables:**
```
ZUPERIOR_API_URL=https://zuperior-crm-api.onrender.com/api
```

**Docker/Container:**
```yaml
environment:
  - ZUPERIOR_API_URL=https://zuperior-crm-api.onrender.com/api
```

---

## Still Getting 404?

1. **Check the actual URL in logs:**
   - Look for: `[Reset Password API] Calling: ...`
   - Verify it's pointing to zuperior-api, not zuperior-server

2. **Test the endpoint manually:**
   ```bash
   curl https://your-api-url.com/api/auth/reset-password \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"token":"test","newPassword":"test123"}'
   ```

3. **Verify zuperior-api is running:**
   - Check if the server is accessible
   - Visit: `https://your-api-url.com/docs` (should show Swagger UI)

4. **Check API route registration:**
   - Verify the endpoint exists in zuperior-api
   - Check: `app/main.py` - should have `app.include_router(auth.router, prefix="/api/auth")`

