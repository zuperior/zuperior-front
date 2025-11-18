import { NextRequest, NextResponse } from 'next/server';

const buildCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 60 * 60 * 24, // 1 day in seconds
});

const buildPublicCookieOptions = () => ({
  ...buildCookieOptions(),
  httpOnly: false,
});

export async function POST(request: NextRequest) {
  try {
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';
    const body = await request.json();

    const resp = await fetch(`${backendBase}/verify-two-factor-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: body.email,
        otpKey: body.otpKey,
        otp: body.otp,
      }),
    });

    const text = await resp.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: false, message: text || 'Server Error' };
    }

    const jsonResponse = NextResponse.json(data, { status: resp.status });

    // Set cookies if verification successful
    if (data.success && data.token) {
      jsonResponse.cookies.set('token', data.token, buildCookieOptions());
      if (data.clientId) {
        jsonResponse.cookies.set('clientId', data.clientId, buildPublicCookieOptions());
      }
    }

    return jsonResponse;
  } catch (e: any) {
    console.error('2FA verification proxy error:', e?.message || e);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

