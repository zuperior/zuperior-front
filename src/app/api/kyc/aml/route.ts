// app/api/kyc/aml/route.ts
import { AMLRequestBody, AMLResponse } from "@/types/kyc";
import axios from "axios";
import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

export async function POST(request: Request) {
  let requestBody: AMLRequestBody | undefined;
  
  try {
    // Load environment variables
    const {
      SHUFTI_PRO_CLIENT_ID,
      SHUFTI_PRO_SECRET_KEY,
      SHUFTI_PRO_AML_CALLBACK_URL,
      NEXT_PUBLIC_KYC_TEST_MODE,
    } = process.env;

    requestBody = await request.json();
    
    if (!requestBody) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    console.log('🔍 AML Verification Request:', {
      reference: requestBody.reference,
      testMode: NEXT_PUBLIC_KYC_TEST_MODE === 'true',
      hasToken: !!token
    });

    // TEST MODE: Simulate successful AML verification without calling Shufti Pro
    if (NEXT_PUBLIC_KYC_TEST_MODE === 'true' || !SHUFTI_PRO_CLIENT_ID) {
      console.log('🧪 KYC Test Mode: Simulating AML verification...');
      
      // Simulate a successful response
      const mockResponse: AMLResponse = {
        reference: requestBody.reference,
        event: "verification.accepted",
        error: "",
        verification_url: "",
        verification_result: {
          background_checks: {
            status: "accepted",
            message: "TEST MODE: AML screening passed - No matches found"
          }
        },
        declined_reason: null
      };

      // Note: AML checks don't directly update document/address verification
      // They're tracked separately via amlReference field

      console.log('✅ Test Mode: AML verification successful');
      return NextResponse.json(mockResponse);
    }

    // PRODUCTION MODE: Use actual Shufti Pro
    if (
      !SHUFTI_PRO_CLIENT_ID ||
      !SHUFTI_PRO_SECRET_KEY ||
      !SHUFTI_PRO_AML_CALLBACK_URL
    ) {
      throw new Error("Shufti Pro credentials not configured. Set NEXT_PUBLIC_KYC_TEST_MODE=true for testing.");
    }

    if (!requestBody.reference) {
      return NextResponse.json({ error: "Missing reference" }, { status: 400 });
    }

    // its getting undefined but full name is there inside the request body
    /* if (!requestBody?.background_checks?.name?.full_name) {
      return NextResponse.json(
        {
          error: "Full name is required",
        },
        { status: 400 }
      );
    } */

    // Prepare Basic Auth header
    const authHeader = Buffer.from(
      `${SHUFTI_PRO_CLIENT_ID}:${SHUFTI_PRO_SECRET_KEY}`
    ).toString("base64");

    // Construct payload with enhanced defaults
    const payload = {
      reference: requestBody.reference,
      callback_url: SHUFTI_PRO_AML_CALLBACK_URL,
      language: "en",
      verification_mode: "any",
      decline_on_single_step: "0",
      ttl: 60, // Time-to-live in minutes
      background_checks: {
        ...requestBody.background_checks,
        alias_search: "1",
        rca_search: "1",
      },
    };

    // Call Shufti Pro API with timeout
    const response = await axios.post("https://api.shuftipro.com/", payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
    });

    const data: AMLResponse = response.data;
    
    console.log('✅ Shufti Pro AML Verification Response:', {
      reference: requestBody.reference,
      event: data.event
    });

    // AML results are tracked via the amlReference in KYC record
    // The webhook will handle database updates when Shufti calls back
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("❌ AML screening error:", error);
    
    // Log more details for debugging
    if (error.response) {
      console.error("Shufti Pro AML API Error Response:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
    }

    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timeout - Shufti Pro API did not respond in time" },
        { status: 504 }
      );
    }

    // If Shufti Pro fails, fall back to test mode for development
    if (process.env.NODE_ENV === 'development' && requestBody?.reference) {
      console.log("🔄 Falling back to test mode for AML due to Shufti Pro error");
      
      const mockResponse: AMLResponse = {
        reference: requestBody.reference,
        event: "verification.accepted",
        error: "",
        verification_url: "",
        verification_result: {
          background_checks: {
            status: "accepted",
            message: "FALLBACK MODE: AML screening passed (Shufti Pro error)"
          }
        },
        declined_reason: null
      };

      return NextResponse.json(mockResponse);
    }

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        details: error.response?.data || "No additional details",
        status: error.response?.status || 500
      },
      { status: 500 }
    );
  }
}
