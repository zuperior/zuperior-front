// client/src/app/api/user/logout-all-devices/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

export async function POST(request: NextRequest) {
  try {
    console.log('[Logout All Devices API] Starting request...');
    
    // Try to get token from Authorization header (from axios interceptor)
    let token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                request.headers.get('Authorization')?.replace('Bearer ', '');

    console.log('[Logout All Devices API] Token from header:', token ? 'Found' : 'Not found');

    // If no token in header, try to get from cookie
    if (!token) {
      try {
        const cookieStore = await cookies();
        token = cookieStore.get('token')?.value || null;
        console.log('[Logout All Devices API] Token from cookie:', token ? 'Found' : 'Not found');
      } catch (cookieError: any) {
        console.warn('[Logout All Devices API] Error reading cookies:', cookieError.message);
        // Continue without cookie token
      }
    }

    if (!token) {
      console.error('[Logout All Devices API] No token found');
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('[Logout All Devices API] Calling backend:', `${API_URL}/user/logout-all-devices`);

    const response = await fetch(`${API_URL}/user/logout-all-devices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('[Logout All Devices API] Backend response status:', response.status);

    if (!response.ok) {
      let errorData: any = {};
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('[Logout All Devices API] Error parsing backend response:', parseError);
      }
      
      console.error('[Logout All Devices API] Backend error:', errorData);
      return NextResponse.json(
        {
          success: false,
          message: errorData.message || `Backend error: ${response.status}`,
          error: errorData.error || errorData
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Logout All Devices API] Success:', data);

    // Clear cookies in the response
    const jsonResponse = NextResponse.json(data);
    
    // Clear token and clientId cookies
    jsonResponse.cookies.delete('token');
    jsonResponse.cookies.delete('clientId');
    
    // Also set them to expire in the past
    jsonResponse.cookies.set('token', '', {
      expires: new Date(0),
      path: '/',
    });
    jsonResponse.cookies.set('clientId', '', {
      expires: new Date(0),
      path: '/',
    });

    return jsonResponse;

  } catch (error: any) {
    console.error('[Logout All Devices API] Unexpected error:', error);
    console.error('[Logout All Devices API] Error type:', typeof error);
    console.error('[Logout All Devices API] Error message:', error?.message);
    console.error('[Logout All Devices API] Error stack:', error?.stack);
    
    // Check if it's a network error
    if (error?.code === 'ECONNREFUSED' || error?.message?.includes('fetch failed')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Cannot connect to backend server. Please ensure the backend is running.',
          error: error.message
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Internal server error',
        error: error?.stack || String(error)
      },
      { status: 500 }
    );
  }
}

