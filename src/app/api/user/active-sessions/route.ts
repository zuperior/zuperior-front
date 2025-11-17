// client/src/app/api/user/active-sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

export async function GET(request: NextRequest) {
  try {
    // Try to get token from Authorization header (from axios interceptor)
    let token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                request.headers.get('Authorization')?.replace('Bearer ', '');

    // If no token in header, try to get from cookie
    if (!token) {
      const cookieStore = await cookies();
      token = cookieStore.get('token')?.value || null;
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const response = await fetch(`${API_URL}/user/active-sessions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error:', errorData);
      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to fetch active sessions'
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Error fetching active sessions:', error);
    console.error('Error details:', error.message, error.stack);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Internal server error'
      },
      { status: 500 }
    );
  }
}

