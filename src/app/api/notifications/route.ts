/**
 * Notifications API Route
 * Proxy to backend /api/notifications endpoint
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
    
    const { searchParams } = new URL(req.url);
    const isRead = searchParams.get('isRead');
    const limit = searchParams.get('limit');

    console.log('[Notifications API] Request params:', { isRead, limit });
    console.log('[Notifications API] Token available:', !!token);
    console.log('[Notifications API] Auth header:', authHeader ? 'Present' : 'Missing');

    const params = new URLSearchParams();
    if (isRead !== null) params.append('isRead', isRead);
    if (limit) params.append('limit', limit);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = token;
    }

    const queryString = params.toString();
    const backendUrl = `${BACKEND_API_URL}/notifications${queryString ? `?${queryString}` : ''}`;
    console.log('[Notifications API] Proxying to:', backendUrl);

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    let response;
    try {
      response = await fetch(backendUrl, {
      headers,
      cache: 'no-store',
        signal: controller.signal,
    });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Handle connection errors gracefully
      if (fetchError.name === 'AbortError' || fetchError.code === 'ECONNABORTED') {
        console.error('❌ [Notifications API] Request timeout:', backendUrl);
        return NextResponse.json(
          { 
            success: false, 
            message: 'Request timeout - backend server may be slow or unavailable',
            data: [],
            notifications: []
          },
          { status: 408 }
        );
      }
      
      if (fetchError.code === 'ECONNREFUSED' || fetchError.cause?.code === 'ECONNREFUSED') {
        console.error('❌ [Notifications API] Connection refused - backend server is not running:', backendUrl);
        // Return empty notifications instead of error to prevent UI issues
        return NextResponse.json(
          { 
            success: true, 
            message: 'Backend server unavailable - returning empty notifications',
            data: [],
            notifications: []
          },
          { status: 200 }
        );
      }
      
      // Re-throw other errors
      throw fetchError;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Notifications API] Backend error:', {
        status: response.status,
        error: errorText,
      });
      
      // Return empty notifications for client errors (4xx) to prevent UI issues
      if (response.status >= 400 && response.status < 500) {
        return NextResponse.json(
          { 
            success: true,
            message: 'Backend returned error - returning empty notifications',
            data: [],
            notifications: []
          },
          { status: 200 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false, 
          message: `Backend error: ${response.status}`,
          error: errorText,
          data: [],
          notifications: []
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [Notifications API] Notifications fetched successfully');

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [Notifications API] Error:', {
      message: error?.message,
      code: error?.code,
      cause: error?.cause,
      name: error?.name,
    });
    
    // Return empty notifications instead of error to prevent UI issues
    return NextResponse.json(
      { 
        success: true,
        message: 'Error fetching notifications - returning empty list',
        data: [],
        notifications: []
      },
      { status: 200 }
    );
  }
}
