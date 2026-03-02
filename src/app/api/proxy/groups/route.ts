// client/src/app/api/proxy/groups/route.ts
import { NextRequest, NextResponse } from 'next/server';

const RAW_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';
const API_URL = RAW_API_URL.replace(/\/+$/, '');

export async function GET(request: NextRequest) {
  // Groups endpoint on backend is public, but forward auth if present
  const token = request.headers.get('authorization');

  // Add timeout control with AbortController
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60 seconds timeout

  try {
    const url = `${API_URL}/mt5/groups`;
    console.log(`[Next.js API] 🚀 Proxying to groups:`, {
      method: 'GET',
      rawApiUrl: RAW_API_URL,
      targetUrl: url,
      timestamp: new Date().toISOString()
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: token } : {}),
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to fetch MT5 groups',
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    // Backend returns an array; forward as-is
    return NextResponse.json(data);
  } catch (error: any) {
    clearTimeout(timeout);

    // Handle timeout errors gracefully
    if (error.name === 'AbortError' || error.message?.includes('aborted')) {
      console.error('Timeout fetching MT5 groups:', error);
      return NextResponse.json(
        { success: false, message: 'Request timeout - MT5 API is slow or unreachable' },
        { status: 504 }
      );
    }

    console.error('Error fetching MT5 groups:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

