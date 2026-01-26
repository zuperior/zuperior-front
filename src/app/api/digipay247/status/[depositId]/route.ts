import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { depositId: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('userToken')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { depositId } = params;

    if (!depositId) {
      return NextResponse.json(
        { success: false, error: 'Deposit ID is required' },
        { status: 400 }
      );
    }

    // Forward to backend
    const backendResponse = await fetch(`${BACKEND_API_URL}/deposit/digipay247/status/${depositId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await backendResponse.json();

    return NextResponse.json(result, { status: backendResponse.status });
  } catch (error: any) {
    console.error('❌ [DigiPay247] Error checking status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to check status' },
      { status: 500 }
    );
  }
}
