// client/src/app/api/mt5/user-profile/[login]/route.ts
import { NextRequest, NextResponse } from 'next/server';

// Prefer a server-only var if provided, else fall back to NEXT_PUBLIC_*
const API_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ login: string }> }
) {
  try {

    const { login } = await params;

    if (!login || login === '0' || !/^\d+$/.test(String(login))) {
      return NextResponse.json(
        { success: false, message: 'Valid login parameter is required' },
        { status: 400 }
      );
    }

    // Add a short timeout to fail fast if backend is unreachable
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    // Get cache-busting param from query string
    const { searchParams } = new URL(request.url);
    const cacheBuster = searchParams.get('_t') || Date.now().toString();

    // Try calling backend protected endpoint first (requires Authorization)
    const incomingAuth = request.headers.get('authorization');
    let response: Response | null = null;
    try {
      if (incomingAuth) {
        response = await fetch(`${API_URL}/mt5/user-profile/${login}`, {
          method: 'GET',
          headers: { 'Authorization': incomingAuth },
          signal: controller.signal,
          cache: 'no-store',
        });
      }
    } catch (_) { }

    // Fallback to direct MT5 endpoint if backend route not available or returns 401
    if (!response || response.status === 401) {
      response = await fetch(`${process.env.MT5_API_URL}/client/getClientBalance/${login}?_t=${cacheBuster}`, {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store',
      }).catch(() => null as any);
    }



    clearTimeout(timeout);

    if (!response) {
      console.log('[Next.js API] Backend not accessible');
      return NextResponse.json(
        { success: false, message: 'Backend unavailable' },
        { status: 503 }
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.log('[Next.js API] Backend error:', response.status, errorData);
      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to fetch MT5 user profile'
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Log the response to debug
    console.log(`[Next.js API] 📥 Response from backend for account ${login}:`, JSON.stringify(data, null, 2));

    // The backend returns: { success: true, data: { Balance: 22556, ... } }
    // We need to ensure this structure is preserved
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error fetching MT5 user profile:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
