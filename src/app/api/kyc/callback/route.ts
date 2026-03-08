// client/src/app/api/kyc/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('🔔 Shufti Pro Webhook received (Next.js):', {
      reference: body.reference,
      event: body.event,
      timestamp: new Date().toISOString()
    });

    // Forward to backend
    const response = await fetch(`${API_URL}/kyc/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to process callback'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error processing Shufti Pro callback:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

