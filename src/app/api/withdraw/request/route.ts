import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const backendBase = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';
    const authHeader = request.headers.get('authorization') || '';
    const body = await request.json();

    const resp = await fetch(`${backendBase}/withdraw/request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify({
        amount: body.amount,
        walletAddress: body.walletAddress,
        method: body.method,
        bankDetails: body.bankDetails,
      }),
    });

    const text = await resp.text();
    let data: any = {};
    try { data = JSON.parse(text); } catch { data = { success: false, message: text || 'Server Error' }; }
    return NextResponse.json(data, { status: resp.status });
  } catch (e: any) {
    console.error('Withdraw request proxy error:', e?.message || e);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

