import { NextResponse } from "next/server";

// Production API URL
const UNIPAYMENT_API_URL = process.env.UNIPAYMENT_API_URL || 'https://api.unipayment.io';
const UNIPAYMENT_CLIENT_ID = process.env.UNIPAYMENT_CLIENT_ID || 'd1bfecf2-5f65-429f-abf3-8006bfea64e1';
const UNIPAYMENT_CLIENT_SECRET = process.env.UNIPAYMENT_CLIENT_SECRET || 'GKq8a6dvnsTvC9bxJg2rXUFmXKcAcptwU';

export async function POST() {
  try {
    console.log('🔐 [Unipayment] Getting access token...');

    // Unipayment OAuth token endpoint
    // Based on Unipayment API documentation: https://api.unipayment.io/connect/token
    const tokenEndpoint = `${UNIPAYMENT_API_URL}/connect/token`;

    console.log('🔐 [Unipayment] Using credentials:', {
      clientId: UNIPAYMENT_CLIENT_ID.substring(0, 8) + '...',
      hasSecret: !!UNIPAYMENT_CLIENT_SECRET,
      apiUrl: UNIPAYMENT_API_URL,
      endpoint: tokenEndpoint
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: UNIPAYMENT_CLIENT_ID,
        client_secret: UNIPAYMENT_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [Unipayment] Token request failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        endpoint: tokenEndpoint
      });
      return NextResponse.json(
        {
          success: false,
          error: `Failed to get access token: ${response.status} ${errorText}`
        },
        { status: 500 }
      );
    }

    const tokenData = await response.json();

    if (!tokenData || !tokenData.access_token) {
      console.error('❌ [Unipayment] Access token not found in response:', tokenData);
      return NextResponse.json(
        {
          success: false,
          error: 'Access token not found in response'
        },
        { status: 500 }
      );
    }

    console.log('✅ [Unipayment] Access token obtained successfully');
    return NextResponse.json({
      success: true,
      access_token: tokenData?.access_token
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("❌ [Unipayment] Access token error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

