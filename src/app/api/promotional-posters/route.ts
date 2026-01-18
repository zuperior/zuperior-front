/**
 * Promotional Posters API Route
 * Proxy to backend /api/promotional-posters endpoint
 */

import { NextRequest, NextResponse } from 'next/server';

// Use admin backend URL for promotional posters (they're managed in admin panel)
const ADMIN_BACKEND_URL = process.env.NEXT_PUBLIC_ADMIN_BACKEND_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:5003';

export async function GET(req: NextRequest) {
  try {
    const backendUrl = `${ADMIN_BACKEND_URL}/api/promotional-posters`;
    console.log('[Promotional Posters API] Proxying to:', backendUrl);

    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    let response;
    try {
      response = await fetch(backendUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[Promotional Posters API] Request timeout');
        return NextResponse.json(
          { ok: false, error: 'Request timeout' },
          { status: 504 }
        );
      }
      throw fetchError;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Promotional Posters API] Backend error:', response.status, errorText);
      return NextResponse.json(
        { ok: false, error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Promotional Posters API] Success:', data.posters?.length || 0, 'posters');
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Promotional Posters API] Error:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch promotional posters' },
      { status: 500 }
    );
  }
}
