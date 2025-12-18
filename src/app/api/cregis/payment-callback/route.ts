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

    const {
      pid,
      cregis_id,
      third_party_id,
      status,
      order_amount,
      order_currency,
      received_amount,
      paid_currency,
      txid,
      tx_hash,
      from_address,
      to_address,
      block_height,
      block_time,
      callback_url,
      success_url,
      cancel_url,
      sign,
      // Additional fields
      event_name,
      event_type,
      timestamp,
    } = body;

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

    // Map Cregis status to internal deposit status
    const depositStatus = mapCregisStatusToDepositStatus(status);
    console.log("📋 Mapped deposit status:", status, "->", depositStatus);

    // Find and update deposit record in database
    try {
      // First, try to find deposit by cregis_id or third_party_id
      const searchId = cregis_id || third_party_id;

      if (!searchId) {
        console.warn("⚠️ No cregis_id or third_party_id provided in callback");
        return NextResponse.json({
          success: false,
          message: "Missing cregis_id or third_party_id"
        }, { status: 400 });
      }

      // Call backend to update deposit status
      // Pass payment_detail array if present (contains receive_amount and tx_id)
      const updateResponse = await fetch(`${BACKEND_API_URL}/cregis/payment-callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cregis_id: cregis_id,
          third_party_id: third_party_id,
          status: depositStatus,
          event_type: event_type, // Pass event_type for proper status mapping fallback
          order_amount: order_amount,
          order_currency: order_currency,
          received_amount: received_amount,
          paid_currency: paid_currency,
          txid: txid,
          tx_hash: tx_hash,
          from_address: from_address,
          to_address: to_address,
          block_height: block_height,
          block_time: block_time,
          payment_detail: body.payment_detail, // Pass payment_detail array if present (contains receive_amount and tx_id)
        }),
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

      // Log important payment events
      if (status === 'paid' || status === 'complete') {
        console.log('✅ Payment confirmed! Transaction:', {
          cregisId: cregis_id,
          thirdPartyId: third_party_id,
          amount: received_amount || order_amount,
          currency: paid_currency || order_currency,
          txHash: tx_hash || txid
        });

        if (to_address) {
          console.log('📍 Crypto deposit address:', to_address);
        }
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

/**
 * Map Cregis payment status to internal deposit status
 */
function mapCregisStatusToDepositStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'pending': 'pending',
    'paid': 'approved', // Changed from 'processing' to 'approved' to trigger MT5 credit
    'complete': 'approved',
    'success': 'approved',
    'confirmed': 'approved',
    'expired': 'rejected',
    'cancelled': 'cancelled',
    'failed': 'failed',
  };

  return statusMap[status?.toLowerCase()] || 'pending';
}

// GET endpoint for testing (not used by Cregis)
export async function GET() {
  return NextResponse.json({
    message: "Cregis payment callback endpoint",
    info: "This endpoint receives payment notifications from Cregis",
  });
}
