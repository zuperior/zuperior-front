import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('userToken')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    
    // Forward to backend
    const backendResponse = await fetch(`${BACKEND_API_URL}/deposit/digipay247/submit-proof`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const result = await backendResponse.json();

    return NextResponse.json(result, { status: backendResponse.status });
  } catch (error: any) {
    console.error('❌ [DigiPay247] Error submitting proof:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit proof' },
      { status: 500 }
    );
  }
}
