import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

export async function POST(req: NextRequest) {
  try {
    console.log('💳 [DigiPay247] Creating payment request...');

    const body = await req.json() as {
      amount: string;
      currency?: string;
      mt5AccountId: string;
      accountType?: string;
    };

    const { amount, currency = 'USD', mt5AccountId, accountType } = body;

    // Validate required fields
    if (!amount || !mt5AccountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: amount, mt5AccountId"
        },
        { status: 400 }
      );
    }

    // Get auth token from request
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || 
                  req.cookies.get('token')?.value ||
                  req.cookies.get('userToken')?.value;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required"
        },
        { status: 401 }
      );
    }

    // Forward request to backend
    console.log('📡 [DigiPay247] Forwarding to backend:', `${BACKEND_API_URL}/deposit/digipay247`);
    
    const backendResponse = await fetch(`${BACKEND_API_URL}/deposit/digipay247`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        mt5AccountId,
        accountType,
      }),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({ error: 'Unknown error' }));
      console.error('❌ [DigiPay247] Backend error:', backendResponse.status, errorData);
      return NextResponse.json(
        {
          success: false,
          error: errorData.error || errorData.message || 'Failed to create payment request'
        },
        { status: backendResponse.status }
      );
    }

    const backendData = await backendResponse.json();

    if (!backendData.success || !backendData.data) {
      console.error('❌ [DigiPay247] Backend returned error:', backendData);
      return NextResponse.json(
        {
          success: false,
          error: backendData.message || 'Failed to create payment request'
        },
        { status: 400 }
      );
    }

    console.log('✅ [DigiPay247] Payment request created:', {
      depositId: backendData.data.deposit?.id,
      transactionId: backendData.data.transactionId,
      hasPaymentUrl: !!backendData.data.paymentUrl,
    });

    return NextResponse.json({
      success: true,
      data: {
        depositId: backendData.data.deposit?.id,
        transactionId: backendData.data.transactionId,
        paymentUrl: backendData.data.paymentUrl,
      }
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("❌ [DigiPay247] Create payment error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

