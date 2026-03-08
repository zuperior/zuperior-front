import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

export async function POST(req: NextRequest) {
  try {
    console.log('📥 [Unipayment] Webhook received');

    const body = await req.json();
    const signature = req.headers.get('x-unipayment-signature') || req.headers.get('signature');

    // Forward to backend
    const backendResponse = await fetch(`${BACKEND_API_URL}/deposit/unipayment-webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(signature && { 'x-unipayment-signature': signature }),
      },
      body: JSON.stringify(body),
    });

    const backendData = await backendResponse.json();

    if (!backendResponse.ok) {
      console.error('❌ [Unipayment] Backend webhook processing failed:', backendData);
      return NextResponse.json(
        {
          success: false,
          error: backendData.message || 'Webhook processing failed'
        },
        { status: backendResponse.status }
      );
    }

    console.log('✅ [Unipayment] Webhook processed successfully');
    return NextResponse.json({
      success: true,
      message: 'Webhook processed'
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("❌ [Unipayment] Webhook error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

