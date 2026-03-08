// // app/api/epay/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import axios from "axios";
// import { randomUUID } from "crypto";

// export async function POST(req: NextRequest) {
//   try {
//     const body = await req.json();

//     const {
//       countrycode,
//       mobilenumber,
//       orderAmount,
//       user_name,
//       orderCurrency,
//     } = body;

//     // ✅ Generate alphanumeric-only orderID
//     const orderID = "ORD" + Date.now() + randomUUID().replace(/-/g, "").slice(0, 8);
//     const customerId = "CUS" + Date.now() + randomUUID().replace(/-/g, "").slice(0, 8);

//     const payload = {
//       channelId : "WEB",
//       customerId,
//       merchantId :process.env.EPAY_SERVICES_MERCHANT_ID,
//       merchantType :"ECOMMERCE",
//       orderID,
//       email : process.env.EPAY_SERVICES_EMAIL,
//       countrycode,
//       mobilenumber,
//       orderDescription: "Adding Funds to Zuperior Account",
//       orderAmount,
//       user_name,
//       orderCurrency,
//       success_url: process.env.EPAY_SERVICES_SUCCESS_URL,
//       failure_url: process.env.EPAY_SERVICES_FAILED_URL,
//       callback_url: process.env.EPAY_SERVICES_CALLBACK_URL,
//     };

//     const response = await axios.post(
//       "https://api.paymentservice.me/v1/stage/create-new-order",
//       payload,
//       { headers: { "Content-Type": "application/json" } }
//     );

//     return NextResponse.json(response.data, { status: 200 });
//   // eslint-disable-next-line @typescript-eslint/no-explicit-any
//   } catch (error: any) {
//     console.error("EPAY Create Order Error:", error.response?.data || error.message);
//     return NextResponse.json(
//       { error: error.response?.data || "Failed to create order" },
//       { status: error.response?.status || 500 }
//     );
//   }
// }


/**
 * app/api/epay/route.ts - USDT TRC20/BEP20 Payment Gateway (Cregis)
 * 
 * NOTE: Despite the "epay" name, this endpoint now handles USDT cryptocurrency deposits via Cregis.
 * Supports both TRC20 (TRON) and BEP20 (BNB Smart Chain) networks.
 * Card/debit card payments have been removed. Only USDT payments via Cregis are supported.
 * 
 * Payment Flow:
 * 1. User initiates USDT deposit (TRC20 or BEP20)
 * 2. Creates payment order with Cregis
 * 3. User is redirected to Cregis to complete USDT payment
 * 4. Cregis processes payment and sends callback
 * 5. User is redirected back to success/cancel page
 */

import { NextRequest, NextResponse } from "next/server";
import { createPaymentOrder, getOrderCurrencyList } from "@/lib/cregis-payment.service";
import { cookies } from "next/headers";

const config = {
  SUCCESS_URL: process.env.CREGIS_SUCCESS_URL || "",
  CANCEL_URL: process.env.CREGIS_CANCEL_URL || "",
  VALID_TIME: process.env.CREGIS_VALID_TIME || "",
  PAYER_ID: process.env.CREGIS_PAYER_ID || "",
  // Payment currency - USDT for TRC20 crypto payments
  PAYMENT_CURRENCY: process.env.CREGIS_PAYMENT_CURRENCY || "USDT",
};

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

export async function POST(req: NextRequest) {
  console.log('🚀 [EPAY] Starting USDT payment request processing');
  try {
    const body = await req.json();
    console.log('💳 [EPAY] Received payment request:', body);

    const {
      orderAmount,
      success_url,
      failure_url,
      account_number,
      account_type,
      network, // TRC20 or BEP20
    } = body;

    console.log('📊 Request body received:', {
      orderAmount,
      account_number,
      account_type,
      network,
      has_success_url: !!success_url,
      has_failure_url: !!failure_url,
    });

    // Validate and format orderAmount
    if (!orderAmount) {
      console.error('❌ Missing orderAmount in request');
      return NextResponse.json(
        { error: "Missing required field: orderAmount" },
        { status: 400 }
      );
    }

    // Convert to string and ensure proper format
    const formattedAmount = String(orderAmount).trim();
    if (!formattedAmount || formattedAmount === '0' || formattedAmount === '') {
      console.error('❌ Invalid orderAmount:', orderAmount);
      return NextResponse.json(
        { error: "Invalid amount: must be greater than 0" },
        { status: 400 }
      );
    }

    // Use provided URLs or fallback to config
    let successUrl = success_url || config.SUCCESS_URL;
    let cancelUrl = failure_url || config.CANCEL_URL;

    // If URLs are still empty, set defaults
    if (!successUrl) {
      successUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/deposit/success`;
      console.warn('⚠️ Using default success URL');
    }
    if (!cancelUrl) {
      cancelUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/deposit/cancel`;
      console.warn('⚠️ Using default cancel URL');
    }

    console.log('📋 Payment URLs configured:', { successUrl, cancelUrl });

    // Generate callback URL
    const callbackUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/cregis/payment-callback`);
    if (account_number) callbackUrl.searchParams.set('account', account_number);
    if (account_type) callbackUrl.searchParams.set('type', account_type);

    // Determine network (default to TRC20 for backward compatibility)
    const selectedNetwork = network || 'TRC20';
    console.log('💰 [EPAY] Creating Cregis payment order for USDT deposit:', {
      orderAmount,
      account_number,
      account_type,
      network: selectedNetwork,
      callbackUrl: callbackUrl.toString(),
    });
    
    // First, fetch available currency list to verify USDT support
    console.log('📋 [EPAY] Fetching available payment currencies from Cregis...');
    const currencyListResult = await getOrderCurrencyList();
    if (currencyListResult.success) {
      console.log('✅ [EPAY] Available payment currencies:', JSON.stringify(currencyListResult.data, null, 2));
    } else {
      console.warn('⚠️ [EPAY] Could not fetch currency list:', currencyListResult.error);
    }

    // Create payment order using Cregis for USDT TRC20 crypto payments
    // Note: Cregis may require payer_id, using account number as unique ID
    const payerId = account_number || `${Date.now()}`;
    const paymentCurrency = config.PAYMENT_CURRENCY;
    
    console.log('📝 [EPAY] Using payer_id:', payerId);
    console.log('💎 [EPAY] Using payment currency:', paymentCurrency, `(USDT ${selectedNetwork})`);
    console.log('📝 [EPAY] Calling createPaymentOrder with:', {
      orderAmount: formattedAmount,
      orderCurrency: paymentCurrency,
      callbackUrl: callbackUrl.toString(),
      successUrl,
      cancelUrl,
      payerId,
      validTime: Number(config.VALID_TIME) || 30, // Default 30 minutes (range: 10-60 minutes)
    });
    
    try {
      const result = await createPaymentOrder({
        orderAmount: formattedAmount,
        orderCurrency: paymentCurrency, // USDT for TRC20 crypto payments
        callbackUrl: callbackUrl.toString(),
        successUrl,
        cancelUrl,
        payerId: payerId,
        validTime: Number(config.VALID_TIME) || 30, // Default 30 minutes (Cregis accepts 10-60 minutes)
      });

      console.log('📥 [EPAY] createPaymentOrder result:', {
        success: result.success,
        hasError: !!result.error,
        hasData: !!result.data
      });

      if (!result.success) {
        console.error("❌ [EPAY] Cregis payment order failed:", result.error);
        console.error("❌ [EPAY] Full result:", JSON.stringify(result, null, 2));
        return NextResponse.json(
          {
            error: "Payment initiation failed",
            details: result.error,
            code: "CREGIS_ERROR",
          },
          { status: 400 }
        );
      }

      console.log(`✅ [EPAY] Cregis payment order created successfully for USDT ${selectedNetwork} deposit`);
      console.log("📋 [EPAY] Payment data:", JSON.stringify(result.data, null, 2));

      // Call backend to create deposit record
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;

        if (token) {
          console.log('📞 [EPAY] Calling backend to create deposit record...');
          
          const backendResponse = await fetch(`${BACKEND_API_URL}/deposit/cregis-crypto`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              mt5AccountId: account_number,
              amount: formattedAmount,
              cregisOrderId: result.data?.orderId,
              paymentUrl: result.data?.paymentUrl,
              currency: 'USDT',
              network: selectedNetwork, // TRC20 or BEP20
            }),
          });

          if (backendResponse.ok) {
            const backendData = await backendResponse.json();
            console.log('✅ [EPAY] Deposit record created in backend:', backendData);
          } else {
            console.warn('⚠️ [EPAY] Failed to create deposit record in backend:', await backendResponse.text());
          }
        } else {
          console.warn('⚠️ [EPAY] No auth token found in cookies, skipping backend call');
        }
      } catch (backendError) {
        console.error('❌ [EPAY] Error calling backend:', backendError);
        // Continue even if backend call fails - we still want to return the payment URL
      }

      // Return data in format expected by frontend
      return NextResponse.json({
        orderId: result.data?.orderId,
        transactionId: result.data?.cregisId,
        redirectUrl: result.data?.paymentUrl,
      }, { status: 200 });
    
    } catch (createOrderError) {
      console.error('❌ [EPAY] Error creating payment order:', createOrderError);
      console.error('❌ [EPAY] createOrderError type:', typeof createOrderError);
      console.error('❌ [EPAY] createOrderError details:', JSON.stringify(createOrderError, null, 2));
      console.error('❌ [EPAY] createOrderError message:', createOrderError instanceof Error ? createOrderError.message : String(createOrderError));
      
      // Return error response directly instead of throwing
      const errorMsg = createOrderError instanceof Error ? createOrderError.message : String(createOrderError);
      return NextResponse.json(
        {
          error: "Payment initiation failed",
          details: errorMsg,
          code: "CREGIS_ERROR"
        },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error("❌ [EPAY] Credit card deposit error:", error);
    console.error("❌ [EPAY] Error stack:", error.stack);
    console.error("❌ [EPAY] Error type:", typeof error);
    console.error("❌ [EPAY] Error details:", JSON.stringify(error, null, 2));
    
    // Provide helpful error message
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error("❌ [EPAY] Returning error response:", {
      error: "Payment initiation failed",
      details: errorMessage,
      code: "INTERNAL_ERROR"
    });
    
    return NextResponse.json(
      {
        error: "Payment initiation failed",
        details: errorMessage,
        code: "INTERNAL_ERROR"
      },
      { status: 500 }
    );
  }
}