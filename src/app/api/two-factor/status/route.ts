import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';
    
    // Get token from cookie or Authorization header
    const token = request.cookies.get('token')?.value || 
                  request.headers.get('authorization')?.replace('Bearer ', '') || '';

    const resp = await fetch(`${backendBase}/two-factor/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const text = await resp.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: false, message: text || 'Server Error' };
    }
    return NextResponse.json(data, { status: resp.status });
  } catch (e: any) {
    console.error('2FA status proxy error:', e?.message || e);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

