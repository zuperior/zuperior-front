import { NextRequest, NextResponse } from "next/server";

/**
 * Debug endpoint to check environment variable configuration
 * This helps verify that environment variables are set correctly in Vercel
 * 
 * Access: GET /api/auth/test-config
 */

function getZuperiorApiUrl(): string {
  // Helper to ensure URL ends with /api
  const ensureApiSuffix = (url: string): string => {
    const cleanUrl = url.replace(/\/+$/, ''); // Remove trailing slashes
    if (cleanUrl.endsWith('/api')) {
      return cleanUrl;
    }
    return cleanUrl + '/api';
  };
  
  // Priority 1: Server-side env var (preferred for production)
  if (process.env.ZUPERIOR_API_URL) {
    return ensureApiSuffix(process.env.ZUPERIOR_API_URL);
  }
  
  // Priority 2: Client-side env var
  if (process.env.NEXT_PUBLIC_ZUPERIOR_API_URL) {
    return ensureApiSuffix(process.env.NEXT_PUBLIC_ZUPERIOR_API_URL);
  }
  
  // Priority 3: Try to use existing backend URL (if it points to same server)
  if (process.env.NEXT_PUBLIC_BACKEND_API_URL) {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
    // If backend URL already has /api, use it; otherwise assume same base URL
    if (backendUrl.includes('/api')) {
      return backendUrl;
    }
    // If no /api, try to construct (though this is less common)
    return backendUrl.endsWith('/') ? backendUrl + 'api' : backendUrl + '/api';
  }
  
  // Priority 4: Development fallback
  return "http://localhost:8000/api";
}

export async function GET(req: NextRequest) {
  const zuperiorApiUrl = getZuperiorApiUrl();
  const fullResetUrl = `${zuperiorApiUrl.replace(/\/+$/, '')}/auth/reset-password`;
  
  return NextResponse.json({
    environment: process.env.NODE_ENV || 'development',
    zuperiorApiUrl: zuperiorApiUrl,
    fullResetPasswordUrl: fullResetUrl,
    environmentVariables: {
      ZUPERIOR_API_URL: process.env.ZUPERIOR_API_URL || 'NOT SET',
      NEXT_PUBLIC_ZUPERIOR_API_URL: process.env.NEXT_PUBLIC_ZUPERIOR_API_URL || 'NOT SET',
      NEXT_PUBLIC_BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'NOT SET',
    },
    priority: {
      using: process.env.ZUPERIOR_API_URL ? 'ZUPERIOR_API_URL (server-side)' :
             process.env.NEXT_PUBLIC_ZUPERIOR_API_URL ? 'NEXT_PUBLIC_ZUPERIOR_API_URL (client-side)' :
             process.env.NEXT_PUBLIC_BACKEND_API_URL ? 'NEXT_PUBLIC_BACKEND_API_URL (fallback)' :
             'Development fallback (localhost:8000)'
    },
    note: 'Check the "fullResetPasswordUrl" - this is what will be called. Verify it points to your zuperior-api server.'
  });
}

