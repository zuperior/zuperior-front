/**
 * Cregis WaaS Deposit Webhook Handler
 * Receives notifications when deposits are received
 * Documentation: https://developer.cregis.com/api-reference/request-apis/waas/address-management
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyCallbackSignature } from "@/lib/cregis-waas.service";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

export async function POST(req: NextRequest) {
  try {
    console.log('🔔 [DEPOSIT-CALLBACK] ========== NEW DEPOSIT NOTIFICATION ==========');
    
    const body = await req.json();
    console.log('📦 [DEPOSIT-CALLBACK] Webhook payload:', JSON.stringify(body, null, 2));

    // Extract signature
    const receivedSign = body.sign;
    if (!receivedSign) {
      console.error('❌ [DEPOSIT-CALLBACK] No signature in webhook');
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // Create params object without sign for verification
    const { sign, ...params } = body;
    
    // Verify signature
    const isValid = verifyCallbackSignature(params, receivedSign);
    
    if (!isValid) {
      console.error('❌ [DEPOSIT-CALLBACK] Invalid signature!');
      console.error('📋 [DEPOSIT-CALLBACK] Received sign:', receivedSign);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 403 }
      );
    }

    console.log('✅ [DEPOSIT-CALLBACK] Signature verified');

    // Extract deposit information
    const {
      third_party_id: thirdPartyId,
      address,
      amount,
      currency,
      status,
      tx_hash: txHash,
      confirmations,
    } = body;

    console.log('💰 [DEPOSIT-CALLBACK] Deposit info:', {
      thirdPartyId,
      address,
      amount,
      currency,
      status,
      txHash,
      confirmations,
    });

    // Update backend with deposit status
    try {
      console.log('📞 [DEPOSIT-CALLBACK] Updating backend...');
      
      const backendResponse = await fetch(`${BACKEND_API_URL}/deposit/cregis-waas/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          thirdPartyId,
          address,
          amount,
          currency,
          status,
          txHash,
          confirmations,
        }),
      });

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        console.log('✅ [DEPOSIT-CALLBACK] Backend updated:', backendData);
      } else {
        const errorText = await backendResponse.text();
        console.error('❌ [DEPOSIT-CALLBACK] Backend update failed:', errorText);
      }
    } catch (backendError) {
      console.error('❌ [DEPOSIT-CALLBACK] Error calling backend:', backendError);
    }

    // Return success to Cregis
    return NextResponse.json({
      code: "00000",
      msg: "Success",
    });

  } catch (error: unknown) {
    console.error("❌ [DEPOSIT-CALLBACK] Error processing webhook:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

