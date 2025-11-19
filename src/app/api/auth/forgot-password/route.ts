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
    console.log('[Forgot Password API] Using backend URL:', ZUPERIOR_API_URL);
    
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Call the zuperior-api forgot password endpoint
    const response = await axios.post(
      `${ZUPERIOR_API_URL}/auth/forgot-password`,
      { email },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: response.data?.message || "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error: any) {
    console.error("Forgot password error:", error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      
      // Handle connection errors specifically
      if (error.code === 'ECONNREFUSED' || error.message?.includes('ECONNREFUSED')) {
        console.error('[Forgot Password API] Connection refused. Backend URL:', ZUPERIOR_API_URL);
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
                     "Failed to send password reset email";
      
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
      { success: false, message: "Failed to send password reset email" },
      { status: 500 }
    );
  }
}

