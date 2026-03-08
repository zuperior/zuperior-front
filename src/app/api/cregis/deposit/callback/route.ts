// app/api/cregis/deposit/callback/route.ts

import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5001/api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("📥 Cregis deposit callback received:", body);

    const {
      cregis_id,
      third_party_id,
      order_id,
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
    } = body;

    // Forward to backend to update deposit status
    try {
      const backendResponse = await fetch(`${BACKEND_API_URL}/deposits/cregis-callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const backendResult = await backendResponse.json();
      console.log("✅ Backend callback processed:", backendResult);
    } catch (backendError) {
      console.error("❌ Failed to forward to backend:", backendError);
    }

    return NextResponse.json({ success: true, message: "Callback processed" });
  } catch (err: unknown) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error("❌ Callback error:", error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: "Callback error", 
        error: error.message 
      },
      { status: 500 }
    );
  }
}
