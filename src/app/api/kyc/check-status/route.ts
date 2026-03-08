// app/api/kyc/check-status/route.ts
// Check verification status directly from Shufti Pro API
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json(
        { success: false, message: 'Reference is required' },
        { status: 400 }
      );
    }

    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('🔍 Checking Shufti Pro status for reference:', reference);

    const response = await fetch(`${API_URL}/kyc/check-status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reference }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to check verification status'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log('✅ Shufti Pro status retrieved:', {
      reference,
      event: data.data?.event
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error checking verification status:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}



