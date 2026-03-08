# Frontend Environment Variables

## Required Environment Variables

### Backend API URLs

#### Main Server Backend
- `NEXT_PUBLIC_BACKEND_API_URL` - Main server API URL (port 5001)
  - Example: `http://localhost:5001/api`
  - Production: `https://api.yourdomain.com/api`

#### Admin Backend (for payment method images)
- `NEXT_PUBLIC_ADMIN_BACKEND_URL` - Admin backend URL (port 5003)
  - **Required for payment method images to load correctly**
  - Example: `http://localhost:5003`
  - Production: `https://admin-api.yourdomain.com`
  - Alternative: `NEXT_PUBLIC_ADMIN_API_URL` (also supported)

### API Keys (Optional)
- `NEXT_PUBLIC_ADMIN_API_KEY` - Admin API key for email templates
  - Alternative: `NEXT_PUBLIC_EMAIL_API_KEY`

### Client URL
- `NEXT_PUBLIC_CLIENT_URL` - Frontend URL (for email links, etc.)
  - Example: `http://localhost:3000`
  - Production: `https://yourdomain.com`

## Example .env.local file

```env
# Main server backend
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5001/api

# Admin backend (for payment method images)
NEXT_PUBLIC_ADMIN_BACKEND_URL=http://localhost:5003

# Client URL
NEXT_PUBLIC_CLIENT_URL=http://localhost:3000

# Optional API keys
NEXT_PUBLIC_ADMIN_API_KEY=your_admin_api_key_here
```

## Payment Method Images

Payment method images are served from the admin backend at `/payment_method_images/`.
Make sure `NEXT_PUBLIC_ADMIN_BACKEND_URL` is set correctly, otherwise images will fail to load.

## Troubleshooting

If you see errors like:
```
[PaymentMethodCard] Failed to load image: http://localhost:5003/payment_method_images/...
```

1. Check that `NEXT_PUBLIC_ADMIN_BACKEND_URL` is set in your `.env.local` file
2. Verify the admin backend is running on the specified port
3. Ensure the admin backend has the `ADMIN_BACKEND_URL` environment variable set (if different from default)
