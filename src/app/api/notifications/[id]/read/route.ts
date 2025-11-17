/**
 * Mark Notification as Read API Route
 * Proxy to backend /api/notifications/:id/read endpoint
 */

import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get token from Authorization header
    let authHeader = req.headers.get('authorization') || req.headers.get('Authorization') || '';
    let token = authHeader;
    
    if (token && !token.toLowerCase().startsWith('bearer ')) {
      token = `Bearer ${token}`;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = token;
    }

    const response = await fetch(`${BACKEND_API_URL}/notifications/${id}/read`, {
      method: 'PUT',
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Mark as Read API] Backend error:', {
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
  } catch (error: any) {
    console.error('❌ [Mark as Read API] Error:', error);
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
