import { NextRequest, NextResponse } from 'next/server';

// Proxies password change to the Express backend
export async function PUT(request: NextRequest) {
  try {
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

    // Pass through Authorization header (Bearer token) if present
    const authHeader = request.headers.get('authorization');

    const body = await request.json().catch(() => ({}));

    const resp = await fetch(`${backendBase}/user/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        oldPassword: body.oldPassword,
        newPassword: body.newPassword,
        confirmPassword: body.confirmPassword,
      }),
    });

    const data = await resp.json().catch(() => ({}));
    return NextResponse.json(data, { status: resp.status });
  } catch (error: any) {
    console.error('Password proxy error:', error?.message || error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

