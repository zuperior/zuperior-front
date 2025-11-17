import { NextRequest, NextResponse } from 'next/server';

const MT5_API_URL = process.env.NEXT_PUBLIC_MT5_API_URL || 'http://18.175.242.21:5003/api';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ login: string }> }
) {
  try {
    const { login } = await params;
    const body = await request.json();
    const { type, amount, comment } = body;

    console.log('💰 [BALANCE-ADJUSTMENT] Request received:', {
      login,
      type,
      amount,
      comment
    });

    // Validate required fields
    if (!type || amount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, amount' },
        { status: 400 }
      );
    }

    // Determine the endpoint based on type
    let endpoint = '';
    if (type === 'BALANCE') {
      // For deposits (positive amount) use AddClientBalance
      // For withdrawals (negative amount) use DeductClientBalance
      endpoint = amount >= 0 
        ? `Users/${login}/AddClientBalance`
        : `Users/${login}/DeductClientBalance`;
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type. Must be BALANCE' },
        { status: 400 }
      );
    }

    const targetUrl = `${MT5_API_URL}/${endpoint}`;
    console.log('📤 [BALANCE-ADJUSTMENT] Proxying to MT5 API:', targetUrl);

    // Get auth token from request headers
    const authHeader = request.headers.get('authorization');
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(authHeader ? { 'Authorization': authHeader } : {}),
      },
      body: JSON.stringify({
        balance: Math.abs(amount), // Use absolute value for MT5 API
        comment: comment || (amount >= 0 ? 'Deposit' : 'Withdrawal')
      }),
    });

    const responseText = await response.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('❌ [BALANCE-ADJUSTMENT] Failed to parse JSON response:', jsonError);
      data = { error: responseText };
    }

    console.log('📥 [BALANCE-ADJUSTMENT] MT5 API response:', {
      status: response.status,
      success: data.Success,
      message: data.Message,
      data: data.Data
    });

    // Add CORS headers
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Content-Type', 'application/json');

    return new NextResponse(JSON.stringify(data), {
      status: response.status,
      headers,
    });
  } catch (error: any) {
    console.error('❌ [BALANCE-ADJUSTMENT] Proxy error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Proxy error', 
        message: error?.message || 'Unknown error' 
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}








