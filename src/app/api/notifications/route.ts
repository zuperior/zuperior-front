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

    const response = await fetch(backendUrl, {
      headers,
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Notifications API] Backend error:', {
        status: response.status,
        error: errorText,
      });
      
      return NextResponse.json(
        { 
          success: false, 
          message: `Backend error: ${response.status}`,
          error: errorText 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ [Notifications API] Notifications fetched successfully');

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ [Notifications API] Error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error',
        error: error?.message || 'Unknown error'
      },
      { status: 500 }
    );
  }
}
