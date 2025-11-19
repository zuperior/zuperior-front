# Production Environment Setup - Reset Password API

## Issue
The reset password API is trying to connect to `localhost:8000` in production, which causes `ECONNREFUSED` errors.

## Solution

### Option 1: Set Server-Side Environment Variable (Recommended)

Set the `ZUPERIOR_API_URL` environment variable in your production hosting environment.

**For Vercel:**
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add:
   - **Name:** `ZUPERIOR_API_URL`
   - **Value:** `https://your-zuperior-api-domain.com/api`
   - **Environment:** Production, Preview, Development

**For Other Hosting (Render, Railway, etc.):**
Add to your environment variables:
```bash
ZUPERIOR_API_URL=https://your-zuperior-api-domain.com/api
```

**For Docker/Container:**
```yaml
environment:
  - ZUPERIOR_API_URL=https://your-zuperior-api-domain.com/api
```

---

### Option 2: Use Client-Side Environment Variable

If you prefer to use `NEXT_PUBLIC_` prefix (exposed to client):

**For Vercel:**
- **Name:** `NEXT_PUBLIC_ZUPERIOR_API_URL`
- **Value:** `https://your-zuperior-api-domain.com/api`

**For Other Hosting:**
```bash
NEXT_PUBLIC_ZUPERIOR_API_URL=https://your-zuperior-api-domain.com/api
```

---

### Option 3: Use Existing Backend URL

If your `NEXT_PUBLIC_BACKEND_API_URL` points to the same server, the code will automatically use it.

**Example:**
```bash
NEXT_PUBLIC_BACKEND_API_URL=https://your-backend-domain.com/api
```

The reset password route will automatically detect and use this if `ZUPERIOR_API_URL` is not set.

---

## Finding Your Production API URL

Your zuperior-api (FastAPI) server should be running at a URL like:
- `https://api.zuperior.com/api`
- `https://zuperior-api.onrender.com/api`
- `https://your-custom-domain.com/api`

**To find it:**
1. Check where your zuperior-api is deployed
2. The URL should end with `/api` (e.g., `https://api.example.com/api`)
3. Test it by visiting: `https://your-api-url.com/docs` (should show Swagger UI)

---

## Verification

After setting the environment variable:

1. **Redeploy your frontend** (required for env vars to take effect)

2. **Test the connection:**
   ```bash
   curl https://your-frontend-domain.com/api/auth/reset-password \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"token":"test","newPassword":"test123"}'
   ```

3. **Check server logs** - you should see:
   ```
   [Reset Password API] Using backend URL: https://your-api-domain.com/api
   ```

4. **If still getting ECONNREFUSED:**
   - Verify the API URL is correct
   - Check if the backend server is running
   - Verify network/firewall allows connections
   - Check CORS settings on backend

---

## Environment Variable Priority

The code checks in this order:
1. `ZUPERIOR_API_URL` (server-side, preferred)
2. `NEXT_PUBLIC_ZUPERIOR_API_URL` (client-side)
3. `NEXT_PUBLIC_BACKEND_API_URL` (auto-detected)
4. `http://localhost:8000/api` (development fallback)

---

## Quick Fix for Production

**Immediate fix - Add to your production environment:**

```bash
# Replace with your actual API URL
ZUPERIOR_API_URL=https://your-zuperior-api-domain.com/api
```

Then **redeploy** your frontend application.

---

## Example Configuration

**Development (.env.local):**
```env
ZUPERIOR_API_URL=http://localhost:8000/api
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5000/api
```

**Production (Vercel/Render/etc.):**
```env
ZUPERIOR_API_URL=https://api.zuperior.com/api
NEXT_PUBLIC_BACKEND_API_URL=https://api.zuperior.com/api
```

---

## Troubleshooting

### Still getting ECONNREFUSED?

1. **Check the actual URL being used:**
   - Look at server logs when the error occurs
   - Should show: `[Reset Password API] Using backend URL: ...`

2. **Verify backend is accessible:**
   ```bash
   curl https://your-api-domain.com/api/health
   ```

3. **Check CORS on backend:**
   - Ensure your frontend domain is allowed
   - Check `BACKEND_CORS_ORIGINS` in zuperior-api

4. **Network issues:**
   - Verify DNS resolution
   - Check firewall rules
   - Ensure backend server is running

---

## Security Note

- **Server-side env vars** (`ZUPERIOR_API_URL` without `NEXT_PUBLIC_`) are more secure
- They're not exposed to the client-side code
- Use these for sensitive API URLs in production

