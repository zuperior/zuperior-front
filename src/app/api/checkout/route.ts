import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

const config = {
  SUCCESS_URL: process.env.CREGIS_SUCCESS_URL || "",
  CANCEL_URL: process.env.CREGIS_CANCEL_URL || "",
  VALID_TIME: process.env.CREGIS_VALID_TIME || "",
  PAYER_ID: process.env.CREGIS_PAYER_ID || "",
  // Static USDT TRC20 deposit address from Cregis WaaS
  USDT_DEPOSIT_ADDRESS: process.env.CREGIS_USDT_DEPOSIT_ADDRESS || "",
  // QR code for the deposit address (optional)
  USDT_QR_CODE: process.env.CREGIS_USDT_QR_CODE || "",
};

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

export async function POST(req: NextRequest) {
  try {
    console.log('🚀 [CHECKOUT] ========== NEW CHECKOUT REQUEST ==========');

    const body = (await req.json()) as {
      order_amount: string;
      order_currency: string;
      payer_id?: string;
      valid_time?: number;
      account_number?: string;
      account_type?: string;
      network?: string;
      crypto_symbol?: string;
    };

    console.log('📦 [CHECKOUT] Raw body received:', JSON.stringify(body, null, 2));

    const { order_amount, order_currency, payer_id, valid_time, account_number, account_type, network, crypto_symbol } = body;

    console.log('💳 [CHECKOUT] Parsed checkout request:', {
      order_amount,
      order_currency,
      account_number,
      network,
      crypto_symbol,
      order_amount_type: typeof order_amount,
      order_amount_length: order_amount?.length,
      order_currency_type: typeof order_currency,
      order_currency_length: order_currency?.length,
    });

    // Validate required fields
    if (!order_amount || !order_currency) {
      console.error('❌ [CHECKOUT] Missing required fields');
      return NextResponse.json(
        {
          code: "10000",
          msg: "Payment initiation failed",
          error: "Missing required fields: order_amount, order_currency"
        },
        { status: 400 }
      );
    }

    // Validate amount is not empty string
    if (order_amount.trim() === '' || order_amount === '0') {
      console.error('❌ [CHECKOUT] Invalid amount:', order_amount);
      return NextResponse.json(
        {
          code: "10000",
          msg: "Payment initiation failed",
          error: "Invalid amount: must be greater than 0"
        },
        { status: 400 }
      );
    }

    // Use fallback URLs if not configured
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const successUrl = config.SUCCESS_URL || `${baseUrl}/deposit/success`;
    const cancelUrl = config.CANCEL_URL || `${baseUrl}/deposit/cancel`;

    console.log('📋 [CHECKOUT] Using URLs:', {
      baseUrl,
      successUrl,
      cancelUrl,
      hasSuccessUrl: !!successUrl,
      hasCancelUrl: !!cancelUrl,
    });

    // Validate URLs are not empty
    if (!successUrl || !cancelUrl) {
      console.error('❌ [CHECKOUT] Empty URLs detected!');
      return NextResponse.json(
        {
          code: "10000",
          msg: "Payment initiation failed",
          error: "Server configuration error: Missing callback URLs"
        },
        { status: 500 }
      );
    }

    // Generate callback URL with additional parameters
    const callbackUrl = new URL(`${baseUrl}/api/cregis/payment-callback`);
    if (account_number) callbackUrl.searchParams.set('account', account_number);
    if (account_type) callbackUrl.searchParams.set('type', account_type);

    console.log('📝 [CHECKOUT] Callback URL:', callbackUrl.toString());

    // Call Cregis Checkout API to get dynamic payment address
    console.log('🔄 [CHECKOUT] Calling Cregis Checkout API...');

    const { createPaymentOrder } = await import('@/lib/cregis-payment.service');

    const cregisResult = await createPaymentOrder({
      orderAmount: order_amount,
      orderCurrency: order_currency,
      callbackUrl: callbackUrl.toString(),
      successUrl,
      cancelUrl,
      payerId: payer_id || account_number,
      validTime: valid_time || parseInt(config.VALID_TIME) || 30,
    });

    if (!cregisResult.success || !cregisResult.data) {
      console.error('❌ [CHECKOUT] Cregis API failed:', cregisResult.error);
      return NextResponse.json(
        {
          code: "10000",
          msg: "Failed to create payment order",
          error: cregisResult.error || "Cregis API error",
        },
        { status: 500 }
      );
    }

    const thirdPartyId = cregisResult.data.orderId;

    console.log('✅ [CHECKOUT] Cregis payment order created:', {
      cregisId: cregisResult.data.cregis_id,
      thirdPartyId,
      hasPaymentInfo: !!cregisResult.data.payment_info,
    });

    // STEP 2: Create deposit record in database (REQUIRED - must succeed before proceeding)
    // This creates the Deposit and CregisDeposit records with 'pending' status
    if (!account_number) {
      console.error('❌ [CHECKOUT] Missing account_number - cannot create deposit record');
      return NextResponse.json(
        {
          code: "10000",
          msg: "Payment initiation failed",
          error: "Missing account_number - cannot create deposit record"
        },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    let token = cookieStore.get('token')?.value;

    // Fallback: try 'userToken' or other common names if 'token' is missing
    if (!token) {
      token = cookieStore.get('userToken')?.value || cookieStore.get('auth_token')?.value;
    }

    // Fallback: try Authorization header
    if (!token) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
        console.log('🔑 [CHECKOUT] Token found in Authorization header');
      }
    }

    if (!token) {
      console.error('❌ [CHECKOUT] No auth token found - cannot create deposit record');
      return NextResponse.json(
        {
          code: "10000",
          msg: "Payment initiation failed",
          error: "Authentication required - please log in again"
        },
        { status: 401 }
      );
    }

    console.log('📞 [CHECKOUT] Creating deposit record in database (STEP 2)...');
    const backendEndpoint = `${BACKEND_API_URL}/deposit/cregis-crypto`;
    console.log('🔗 [CHECKOUT] Target Endpoint:', backendEndpoint);

    const depositPayload = {
      mt5AccountId: account_number,
      amount: order_amount,
      currency: order_currency,
      network: network || 'TRC20',
      cregisOrderId: thirdPartyId, // order_id (for reference)
      cregisId: cregisResult.data.cregis_id, // CRITICAL: This is what the callback uses to find the deposit
      paymentUrl: cregisResult.data.checkout_url,
    };

    console.log('📤 [CHECKOUT] Deposit payload:', JSON.stringify(depositPayload, null, 2));
    console.log('🔍 [CHECKOUT] Payload validation:', {
      hasMt5AccountId: !!depositPayload.mt5AccountId,
      hasAmount: !!depositPayload.amount,
      hasCregisId: !!depositPayload.cregisId,
      hasCregisOrderId: !!depositPayload.cregisOrderId,
      cregisId: depositPayload.cregisId,
      cregisOrderId: depositPayload.cregisOrderId,
    });

    try {
      const backendResponse = await fetch(backendEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(depositPayload),
      });

      console.log('📡 [CHECKOUT] Backend Response Status:', backendResponse.status);

      if (!backendResponse.ok) {
        let errorText = '';
        let errorData = null;

        try {
          errorText = await backendResponse.text();
          // Try to parse as JSON
          try {
            errorData = JSON.parse(errorText);
          } catch {
            // Not JSON, use as text
          }
        } catch (e: any) {
          errorText = `Failed to read error response: ${e.message}`;
        }

        console.error('❌ [CHECKOUT] Backend call failed with status:', backendResponse.status);
        console.error('❌ [CHECKOUT] Backend response body:', errorText);
        console.error('❌ [CHECKOUT] Backend error data:', errorData);

        // Extract actual error message from backend response
        const actualError = errorData?.error || errorData?.message || errorData?.msg || errorText || 'Unknown error';

        return NextResponse.json(
          {
            code: "10000",
            msg: "Failed to create deposit record",
            error: `Database error: ${actualError}. Please try again.`
          },
          { status: backendResponse.status || 500 }
        );
      }

      const backendData = await backendResponse.json();
      console.log('✅ [CHECKOUT] Deposit record created in database (pending status):', backendData);
      console.log('✅ [CHECKOUT] Deposit ID:', backendData.data?.depositId);
      console.log('✅ [CHECKOUT] Transaction ID:', backendData.data?.transactionId);
    } catch (fetchError) {
      console.error('❌ [CHECKOUT] Failed to create deposit record:', fetchError);
      return NextResponse.json(
        {
          code: "10000",
          msg: "Failed to create deposit record",
          error: "Network error: Could not connect to database. Please try again."
        },
        { status: 500 }
      );
    }

    // Return Cregis checkout data to frontend
    return NextResponse.json({
      code: "00000",
      msg: "Success",
      data: {
        cregis_id: cregisResult.data.cregis_id,
        order_currency: order_currency,
        expire_time: cregisResult.data.expire_time,
        checkout_url: cregisResult.data.checkout_url,
        payment_info: cregisResult.data.payment_info,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;

    console.error("❌ Checkout API error:", error);
    console.error("❌ Error stack:", error.stack);

    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error?.message || "Unknown error",
        code: "INTERNAL_ERROR"
      },
      { status: 500 }
    );
  }
}
