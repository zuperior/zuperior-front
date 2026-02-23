// app/api/shufti/aml-callback/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // 1. Get the webhook data
    const data = await request.json();

    // 2. Basic validation
    if (!data.reference || !data.event) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 4. Always respond successfully to prevent retries
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('AML Callback Error:', error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}