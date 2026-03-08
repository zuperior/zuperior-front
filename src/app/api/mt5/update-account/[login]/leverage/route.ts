// client/src/app/api/mt5/update-account/[login]/leverage/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ login: string }> }
) {
  let timeout: NodeJS.Timeout | null = null;
  try {
    const { login } = await params;
    
    if (!login) {
      return NextResponse.json(
        { success: false, message: 'Account number (login) is required' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.replace('Bearer ', '') 
      : authHeader;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      return NextResponse.json(
        { success: false, message: 'Invalid request body. Expected JSON.' },
        { status: 400 }
      );
    }

    const { leverage } = body;

    if (!leverage && leverage !== 0) {
      return NextResponse.json(
        { success: false, message: 'Leverage is required' },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

    let response;
    try {
      console.log(`[Leverage Update] Calling backend: ${API_URL}/mt5/update-account/${login}/leverage`);
      console.log(`[Leverage Update] Leverage value:`, leverage);
      
      response = await fetch(`${API_URL}/mt5/update-account/${login}/leverage`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leverage }),
        signal: controller.signal,
      });
      
      console.log(`[Leverage Update] Backend response status:`, response.status);
    } catch (fetchError: any) {
      // Handle network errors, timeouts, etc.
      console.error('[Leverage Update] Fetch error:', fetchError);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          {
            success: false,
            message: 'Request timeout. Please try again.'
          },
          { status: 408 }
        );
      }
      
      if (fetchError.code === 'ECONNREFUSED' || fetchError.message?.includes('ECONNREFUSED')) {
        return NextResponse.json(
          {
            success: false,
            message: 'Unable to connect to backend server. Please try again later.'
          },
          { status: 503 }
        );
      }

      throw fetchError;
    } finally {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    }

    // Parse response body
    let responseData;
    try {
      const responseText = await response.text();
      responseData = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid response from server'
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: responseData.message || responseData.error || 'Failed to update leverage'
        },
        { status: response.status }
      );
    }

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error('Error updating leverage:', error);
    
    // Determine appropriate error message and status
    let message = 'Internal server error';
    let status = 500;

    if (error.name === 'AbortError') {
      message = 'Request timeout. Please try again.';
      status = 408;
    } else if (error.message) {
      message = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        message: message
      },
      { status: status }
    );
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

