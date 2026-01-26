import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ depositId: string }> }
) {
  try {
    console.log('🔗 [DigiPay247] Backend URL:', BACKEND_API_URL);

    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('userToken')?.value;

    if (!token) {
      console.error('❌ [DigiPay247] No authentication token provided');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { depositId } = await params;

    if (!depositId) {
      return NextResponse.json(
        { success: false, error: 'Deposit ID is required' },
        { status: 400 }
      );
    }

    console.log('📡 [DigiPay247] Checking status for deposit:', depositId);

    // Forward to backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    let backendResponse: Response;
    try {
      backendResponse = await fetch(`${BACKEND_API_URL}/deposit/digipay247/status/${depositId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        console.error('❌ [DigiPay247] Request timeout when checking status');
        return NextResponse.json(
          {
            success: false,
            error: 'Request timeout: Backend API did not respond in time'
          },
          { status: 504 }
        );
      }
      
      if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
        console.error('❌ [DigiPay247] Network error when checking status:', fetchError.message);
        return NextResponse.json(
          {
            success: false,
            error: 'Network error: Unable to reach backend API',
            details: fetchError.message,
            backendUrl: BACKEND_API_URL
          },
          { status: 503 }
        );
      }
      
      throw fetchError;
    }

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('❌ [DigiPay247] Backend returned error:', backendResponse.status, errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Unknown error' };
      }
      
      return NextResponse.json(
        {
          success: false,
          error: errorData.error || `Backend error: ${backendResponse.status}`,
          details: errorData.details
        },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    return NextResponse.json(result, { status: backendResponse.status });
  } catch (error: any) {
    console.error('❌ [DigiPay247] Error checking status:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to check status',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
