/**
 * Unread Count API Route
 * Proxy to backend /api/notifications/unread-count endpoint
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

export async function GET(req: NextRequest) {
  try {
    // Get token from Authorization header (format: "Bearer <token>" or just "<token>")
    let authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
    let token = authHeader;
    
    // If it doesn't start with "Bearer ", add it
    if (token && !token.toLowerCase().startsWith('bearer ')) {
      token = `Bearer ${token}`;
    }

    console.log('[Unread Count API] Token available:', !!token);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = token;
    }

    console.log('[Unread Count API] Proxying to backend...');

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    let response;
    try {
      response = await fetch(`${BACKEND_API_URL}/notifications/unread-count`, {
      headers,
      cache: 'no-store',
        signal: controller.signal,
    });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Handle connection errors gracefully
      if (fetchError.name === 'AbortError' || fetchError.code === 'ECONNABORTED') {
        console.error('❌ [Unread Count API] Request timeout');
        return NextResponse.json(
          { 
            success: true,
            unreadCount: 0,
            message: 'Request timeout - returning 0',
          },
          { status: 200 }
        );
      }
      
      if (fetchError.code === 'ECONNREFUSED' || fetchError.cause?.code === 'ECONNREFUSED') {
        console.error('❌ [Unread Count API] Connection refused - backend server is not running');
        // Return 0 count instead of error to prevent UI issues
        return NextResponse.json(
          { 
            success: true,
            unreadCount: 0,
            message: 'Backend server unavailable - returning 0',
          },
          { status: 200 }
        );
      }
      
      // Re-throw other errors
      throw fetchError;
    }

    if (!response.ok) {
      // Try to parse error response, but don't fail if it fails
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Unknown error';
      }
      console.error('❌ [Unread Count API] Backend error:', {
        status: response.status,
        error: errorText,
      });
      
      // Return success with 0 count instead of error to prevent UI issues
      return NextResponse.json(
        { 
          success: true,
          unreadCount: 0,
          message: 'Backend error, returning 0',
        },
        { status: 200 }
      );
    }

    const data = await response.json();
    console.log('✅ [Unread Count API] Unread count fetched successfully');

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [Unread Count API] Error:', {
      message: error?.message,
      code: error?.code,
      cause: error?.cause,
      name: error?.name,
    });
    
    // Return 0 count instead of error to prevent UI issues
    return NextResponse.json(
      { 
        success: true,
        unreadCount: 0,
        message: 'Error fetching unread count - returning 0',
      },
      { status: 200 }
    );
  }
}
