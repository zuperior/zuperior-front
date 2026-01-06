import { NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

export async function GET(req: Request) {
  try {
    const token = req.headers.get('authorization');
    const headers: Record<string, string> = token ? { Authorization: token } : {};
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    let response;
    try {
      response = await fetch(`${API_URL}/wallet`, { 
        headers, 
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Handle connection errors gracefully
      if (fetchError.name === 'AbortError' || fetchError.code === 'ECONNABORTED') {
        console.error('❌ [Wallet API] Request timeout:', `${API_URL}/wallet`);
        return NextResponse.json(
          { 
            success: true, 
            message: 'Request timeout - backend server may be slow or unavailable',
            data: {
              balance: 0,
              walletNumber: null,
              currency: 'USD'
            }
          },
          { status: 200 }
        );
      }
      
      if (fetchError.code === 'ECONNREFUSED' || fetchError.cause?.code === 'ECONNREFUSED') {
        console.error('❌ [Wallet API] Connection refused - backend server is not running:', `${API_URL}/wallet`);
        // Return empty wallet instead of error to prevent UI issues
        return NextResponse.json(
          { 
            success: true, 
            message: 'Backend server unavailable - returning default wallet',
            data: {
              balance: 0,
              walletNumber: null,
              currency: 'USD'
            }
          },
          { status: 200 }
        );
      }
      
      // Re-throw other errors
      throw fetchError;
    }

    if (!response.ok) {
      // Try to parse error response, but don't fail if it fails
      let errorText = '';
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Unknown error';
      }
      console.error('❌ [Wallet API] Backend error:', {
        status: response.status,
        error: errorText,
      });
      
      // Return default wallet instead of error to prevent UI issues
      return NextResponse.json(
        { 
          success: true,
          message: 'Backend error, returning default wallet',
          data: {
            balance: 0,
            walletNumber: null,
            currency: 'USD'
          }
        },
        { status: 200 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('❌ [Wallet API] Unexpected error:', error);
    // Return default wallet on any unexpected error
    return NextResponse.json(
      { 
        success: true,
        message: 'Unexpected error, returning default wallet',
        data: {
          balance: 0,
          walletNumber: null,
          currency: 'USD'
        }
      },
      { status: 200 }
    );
  }
}

