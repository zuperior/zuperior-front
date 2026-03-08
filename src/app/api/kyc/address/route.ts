// app/api/kyc/address/route.ts
// Updated to use backend API instead of calling Shufti Pro directly
import { AddressKYCRequestBody, AddressKYCResponse } from "@/types/kyc";
import { NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

export async function POST(request: Request) {
  let requestBody: AddressKYCRequestBody;
  
  try {
    requestBody = await request.json();
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log('📍 Address Verification Request (forwarding to backend):', {
      reference: requestBody.reference,
      documentTypes: requestBody.address?.supported_types,
      hasToken: !!token
    });

    // Forward request to backend API
    const response = await fetch(`${BACKEND_API_URL}/kyc/submit-address`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error('Failed to parse error response:', e);
        // If response is HTML or other non-JSON, return generic error
        return NextResponse.json(
          {
            error: 'Failed to submit address for verification',
            success: false,
            reference: requestBody.reference,
            event: 'request.invalid'
          },
          { status: response.status }
        );
      }
      
      console.error('❌ Backend API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      // If backend returned error but has a reference (KYC record was created), 
      // return success response with error info so frontend can handle it
      if (errorData.data?.reference || errorData.data?.kyc?.addressReference) {
        const reference = errorData.data?.reference || errorData.data?.kyc?.addressReference;
        return NextResponse.json({
          reference: reference || requestBody.reference,
          event: 'request.pending',
          error: errorData.message || errorData.error?.message || 'Verification submitted but encountered an error',
          verification_url: '',
          verification_result: {
            address: {
              status: 'pending',
              message: errorData.message || 'Address submitted but verification may be delayed'
            }
          },
          declined_reason: null
        }, { status: 200 }); // Return 200 so frontend can process it
      }
      
      return NextResponse.json(
        {
          error: errorData.message || errorData.error || 'Failed to submit address for verification',
          success: false,
          details: errorData.details || errorData.error,
          reference: requestBody.reference,
          event: 'request.invalid'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log('✅ Address submitted successfully:', {
      reference: requestBody.reference,
      status: data.data?.kyc?.verificationStatus
    });

    // Transform backend response to match expected frontend format
    // Handle both success and error responses
    const kycResponse: AddressKYCResponse = {
      reference: data.data?.reference || requestBody.reference,
      event: data.data?.event || data.success ? 'request.pending' : 'request.invalid',
      error: data.error || '',
      verification_url: data.data?.verification_url || '',
      verification_result: {
        address: {
          status: data.data?.kyc?.verificationStatus === 'Pending' ? 'pending' : 
                 data.data?.kyc?.verificationStatus === 'Verified' ? 'accepted' : 'pending',
          message: data.message || 'Address submitted for verification'
        }
      },
      declined_reason: data.data?.declined_reason || null
    };

    // If there was an error but we still have a reference, return it with error info
    if (!data.success && data.data?.reference) {
      return NextResponse.json(kycResponse, { status: 200 }); // Return 200 but with error in response
    }

    return NextResponse.json(kycResponse);

  } catch (error: any) {
    console.error("❌ Address verification error:", error);
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        success: false,
        status: 500
      },
      { status: 500 }
    );
  }
}
