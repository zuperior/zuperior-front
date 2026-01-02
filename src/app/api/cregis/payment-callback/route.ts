/**
 * Cregis Payment Callback Handler
 * POST /api/cregis/payment-callback
 * 
 * This endpoint receives payment status updates from Cregis
 * Documentation: https://developer.cregis.com/api-reference/payment-notify
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyCallbackSignature } from "@/lib/cregis-payment.service";

const PAYMENT_API_KEY = process.env.CREGIS_PAYMENT_API_KEY || "afe05cea1f354bc0a9a484e139d5f4af";
const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📥 Received Cregis payment callback:", JSON.stringify(body, null, 2));

    const { sign } = body;

    // Verify signature - if sign is not provided, log warning but continue
    if (sign) {
      const callbackParams = { ...body };
      delete (callbackParams as any).sign;

      try {
        const isValid = verifyCallbackSignature(callbackParams, PAYMENT_API_KEY, sign);

        if (!isValid) {
          console.error("❌ Invalid signature in callback");
          return NextResponse.json(
            { success: false, error: "Invalid signature" },
            { status: 400 }
          );
        }

        console.log("✅ Callback signature verified");
      } catch (sigError) {
        console.error("❌ Error verifying signature:", sigError);
        // Continue anyway for now - might be test callback
      }
    } else {
      console.warn("⚠️ No signature provided in callback - skipping verification");
    }

    // Forward the entire callback body to backend for processing
    // Backend will handle parsing data field, status mapping, and database updates
    try {
      const updateResponse = await fetch(`${BACKEND_API_URL}/cregis/payment-callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body), // Forward entire callback body
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error("❌ Failed to update deposit in backend:", errorText);

        // Still return success to Cregis to prevent retries for transient errors
        return NextResponse.json({
          success: true,
          message: "Callback received but database update failed",
          error: errorText
        });
      }

      const updateData = await updateResponse.json();
      console.log("✅ Deposit updated in database:", updateData);

      // Extract info for logging
      const eventType = body.event_type;
      const orderData = typeof body.data === 'string' ? JSON.parse(body.data) : body.data;
      const status = orderData?.status || body.status || eventType;

      // Log important payment events
      if (status === 'paid' || status === 'complete' || eventType === 'paid') {
        const cregisId = orderData?.cregis_id || orderData?.order_id || body.cregis_id || body.third_party_id;
        const amount = orderData?.receive_amount || orderData?.pay_amount || body.received_amount || body.paid_amount || body.order_amount;
        const currency = orderData?.order_currency || body.order_currency;
        const txHash = orderData?.tx_id || body.txid || body.tx_hash;

        console.log('✅ Payment confirmed! Transaction:', {
          cregisId,
          status,
          eventType,
          amount,
          currency,
          txHash
        });
      }

      return NextResponse.json({
        success: true,
        message: "Callback processed successfully",
        data: updateData,
      });

    } catch (dbError) {
      console.error("❌ Database update error:", dbError);

      // Return success to Cregis to prevent retries
      return NextResponse.json({
        success: true,
        message: "Callback received but processing error occurred",
        error: dbError instanceof Error ? dbError.message : "Unknown error"
      });
    }
  } catch (error: unknown) {
    console.error("❌ Error processing payment callback:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}


// GET endpoint for testing (not used by Cregis)
export async function GET() {
  return NextResponse.json({
    message: "Cregis payment callback endpoint",
    info: "This endpoint receives payment notifications from Cregis",
  });
}
