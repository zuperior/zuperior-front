import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ login: string }> }
) {
  try {
    const { login } = await params;
    // Use MT5 client endpoint that returns the client profile (balance/equity)
    // Add cache-busting param to force fresh data on every request
    const cacheBuster = Date.now();
    const targetUrl = `${process.env.MT5_API_URL}/client/getClientBalance/${login}?_t=${cacheBuster}`;

    console.log('Proxying user profile request to:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    let data;
    const responseText = await response.text();
    try {
      data = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError);
      data = responseText;
    }

    // Add CORS and no-cache headers to the response
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    headers.set('Pragma', 'no-cache');
    headers.set('Expires', '0');

    console.log('User profile proxy response status:', response.status);

    return new NextResponse(JSON.stringify(data), {
      status: response.status,
      headers,
    });
  } catch (error: any) {
    console.error('User profile proxy error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Proxy error', message: error?.message || 'Unknown error' }),
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

// Handle preflight requests to avoid 405 in some environments
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

// Provide a minimal HEAD handler
export async function HEAD() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  });
}
