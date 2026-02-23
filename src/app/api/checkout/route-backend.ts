/**
 * Backend-Proxied Checkout Route
 * 
 * This version proxies Cregis requests through the backend server.
 * Benefits:
 * - Only need to whitelist backend server IP
 * - Better API key security
 * - Centralized Cregis integration
 * 
 * To use this:
 * 1. Rename this file to route.ts
 * 2. Rename the current route.ts to route-direct.ts
 * 3. Make sure backend server is running with Cregis routes
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

export async function POST(req: NextRequest) {
  try {

    const body = (await req.json()) as {
      order_amount: string;
      order_currency: string;
      account_number?: string;
      account_type?: string;
      network?: string;
      crypto_symbol?: string;
    };

    const { order_amount, order_currency, account_number, account_type, network, crypto_symbol } = body;

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

    // Validate amount
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

    // Get auth token from cookies
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      console.error('❌ [CHECKOUT] No auth token found');
      return NextResponse.json(
        {
          code: "10000",
          msg: "Authentication required",
          error: "Please log in to continue"
        },
        { status: 401 }
      );
    }

    // Build callback URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/deposit/success`;
    const cancelUrl = `${baseUrl}/deposit/cancel`;
    const callbackUrl = `${BACKEND_API_URL}/cregis/payment-callback`;

    // Prepare payment request for backend
    const paymentRequest = {
      orderAmount: order_amount.trim(),
      orderCurrency: order_currency.trim(),
      callbackUrl,
      successUrl,
      cancelUrl,
      payerId: account_number || `${Date.now()}`,
      validTime: 30, // 30 minutes
      mt5AccountId: account_number,
      accountType: account_type,
      network: network || 'TRC20',
    };

    // Call backend Cregis API
    const response = await fetch(`${BACKEND_API_URL}/cregis/create-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(paymentRequest),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [CHECKOUT] Backend API error:', {
        status: response.status,
        error: errorText,
      });
      throw new Error(`Backend API error: ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      console.error('❌ [CHECKOUT] Backend returned error:', data.error);
      return NextResponse.json(
        {
          code: "10000",
          msg: "Payment initiation failed",
          error: data.error || "Unknown error",
        },
        { status: 400 }
      );
    }

    // Transform backend response to match frontend expectations
    const checkoutDataResponse = {
      cregis_id: data.data.cregisId || "",
      order_currency: order_currency,
      expire_time: data.data.expireTime || new Date(Date.now() + 1800000).toISOString(),
      payment_url: data.data.paymentUrl || "",
      qr_code: data.data.qrCode || "",
      payment_info: data.data.paymentUrl ? [
        {
          payment_address: data.data.paymentUrl,
          receive_currency: order_currency,
          blockchain: network || crypto_symbol || order_currency,
          token_symbol: crypto_symbol || order_currency,
        }
      ] : [],
    };

    console.log('✅ [CHECKOUT] Payment order created successfully');

    // Return data in format expected by frontend
    return NextResponse.json({
      code: "00000",
      msg: "Success",
      data: checkoutDataResponse,
    });
  } catch (err: unknown) {
    const error = err as Error;

    console.error("❌ [CHECKOUT] Error:", error);
    console.error("❌ [CHECKOUT] Stack:", error.stack);

    return NextResponse.json(
      {
        code: "10000",
        msg: "Payment initiation failed",
        error: error?.message || "Internal Server Error",
      },
      { status: 500 }
    );
  }
}



