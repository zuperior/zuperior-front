import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

// Backend API URL for zuperior-api (FastAPI)
// Use server-side env var (without NEXT_PUBLIC) for security, fallback to client-side or default
// In production, set ZUPERIOR_API_URL in your hosting environment
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

const ZUPERIOR_API_URL = getZuperiorApiUrl();

export async function POST(req: NextRequest) {
  try {
    // Log the API URL being used (for debugging - remove in production if sensitive)
    console.log('[Reset Password API] Using backend URL:', ZUPERIOR_API_URL);
    console.log('[Reset Password API] Environment check:', {
      ZUPERIOR_API_URL: process.env.ZUPERIOR_API_URL ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_ZUPERIOR_API_URL: process.env.NEXT_PUBLIC_ZUPERIOR_API_URL ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_BACKEND_API_URL: process.env.NEXT_PUBLIC_BACKEND_API_URL ? 'SET' : 'NOT SET',
    });
    
    const { token, newPassword } = await req.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Construct the full URL (ensure no double slashes)
    const fullUrl = `${ZUPERIOR_API_URL.replace(/\/+$/, '')}/auth/reset-password`;
    console.log('[Reset Password API] Calling:', fullUrl);
    console.log('[Reset Password API] Request payload:', { token: token?.substring(0, 10) + '...', newPassword: '***' });
    
    // Call the zuperior-api reset password endpoint
    const response = await axios.post(
      fullUrl,
      {
        token: token,
        newPassword: newPassword,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 30000, // 30 second timeout
      }
    );

    return NextResponse.json({
      success: true,
      message: response.data?.message || "Password reset successfully",
    });
  } catch (error: any) {
    console.error("Password reset error:", error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      
      // Handle 404 errors specifically
      if (status === 404) {
        console.error('[Reset Password API] 404 Not Found. URL called:', `${ZUPERIOR_API_URL}/auth/reset-password`);
        console.error('[Reset Password API] Response:', error.response?.data);
        return NextResponse.json(
          {
            success: false,
            message: "Password reset endpoint not found. Please check your backend API configuration.",
            error: `Endpoint not found at ${ZUPERIOR_API_URL}/auth/reset-password. Ensure ZUPERIOR_API_URL points to your zuperior-api server (not zuperior-server).`,
            debug: {
              urlUsed: `${ZUPERIOR_API_URL}/auth/reset-password`,
              envVar: process.env.ZUPERIOR_API_URL || process.env.NEXT_PUBLIC_ZUPERIOR_API_URL || 'NOT SET'
            }
          },
          { status: 404 }
        );
      }
      
      // Handle connection errors specifically
      if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
        console.error('[Reset Password API] Connection refused. Backend URL:', ZUPERIOR_API_URL);
        return NextResponse.json(
          {
            success: false,
            message: "Unable to connect to server. Please check your backend API configuration.",
            error: "Connection refused. Ensure ZUPERIOR_API_URL is set correctly in production.",
          },
          { status: 503 }
        );
      }
      
      const message = error.response?.data?.detail || 
                     error.response?.data?.message || 
                     "Failed to reset password";
      
      return NextResponse.json(
        {
          success: false,
          message: message,
        },
        { status: status }
      );
    }
    
    // Handle other errors
    if (error.message?.includes('ECONNREFUSED')) {
      return NextResponse.json(
        {
          success: false,
          message: "Unable to connect to server. Please check your backend API configuration.",
          error: "Connection refused. Ensure ZUPERIOR_API_URL is set correctly in production.",
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: "Failed to reset password" },
      { status: 500 }
    );
  }
}

