/**
 * User Profile API Route
 * Proxy to backend /api/user/profile endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

export async function GET(req: NextRequest) {
  try {
    // Get token from cookies, else from Authorization header
    const cookieStore = await cookies();
    let token = cookieStore.get('token')?.value || '';
    if (!token) {
      const auth = req.headers.get('authorization') || '';
      if (auth.toLowerCase().startsWith('bearer ')) {
        token = auth.slice(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required'
        },
        { status: 401 }
      );
    }

    // Call backend API
    const response = await fetch(`${BACKEND_API_URL}/user/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Profile API] Backend error:', {
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

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ [Profile API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch profile',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
