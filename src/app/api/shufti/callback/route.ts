// app/api/shufti/callback/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // 1. Verify the request is JSON
    if (req.headers.get('content-type') !== 'application/json') {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // 2. Parse and validate the payload
    const data = await req.json();
    if (!data.reference || !data.event) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 3. Log the result (replace with your database logic)


    // 4. Always return 200 OK to Shufti (avoid retries)
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Callback Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}