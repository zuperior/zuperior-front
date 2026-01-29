// app/api/kyc/document/route.ts
// Updated to use backend API instead of calling Shufti Pro directly
import { DocumentKYCRequestBody, DocumentKYCResponse } from "@/types/kyc";
import { NextResponse } from "next/server";

// Increase body size limit for this route (handles base64-encoded images)
export const maxDuration = 30; // 30 seconds max execution time
export const runtime = 'nodejs'; // Use Node.js runtime

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

// Create an AbortController for timeout
function createFetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 30000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  return fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));
}

export async function POST(request: Request) {
  let body: DocumentKYCRequestBody;
  
  try {
    // Validate environment variable
    if (!process.env.NEXT_PUBLIC_BACKEND_API_URL) {
      console.error('❌ NEXT_PUBLIC_BACKEND_API_URL environment variable is not set');
      return NextResponse.json(
        { 
          success: false, 
          error: "Server configuration error: Backend API URL not configured",
          details: "Please check server environment variables"
        },
        { status: 500 }
      );
    }

    // Get authorization header - try both cases
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      console.error('❌ Missing authorization token in request headers');
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Parse request body with error handling
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('❌ Failed to parse request body:', parseError);
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid request body",
          details: parseError instanceof Error ? parseError.message : "Could not parse JSON"
        },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.reference || !body.document) {
      console.error('❌ Missing required fields in request body');
      return NextResponse.json(
        { 
          success: false, 
          error: "Missing required fields: reference and document are required"
        },
        { status: 400 }
      );
    }

    console.log('📝 Document Verification Request (forwarding to backend):', {
      reference: body.reference,
      documentType: body.document?.supported_types,
      hasToken: !!token,
      backendUrl: BACKEND_API_URL
    });

    // Forward request to backend API with timeout
    let response: Response;
    try {
      response = await createFetchWithTimeout(
        `${BACKEND_API_URL}/kyc/submit-document`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        },
        30000 // 30 second timeout
      );
    } catch (fetchError: any) {
      // Handle network errors, timeouts, etc.
      if (fetchError.name === 'AbortError') {
        console.error('❌ Request timeout when calling backend API');
        return NextResponse.json(
          {
            error: "Request timeout: Backend API did not respond in time",
            success: false,
            details: "The backend server may be slow or unreachable"
          },
          { status: 504 }
        );
      }
      
      if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
        console.error('❌ Network error when calling backend API:', fetchError.message);
        return NextResponse.json(
          {
            error: "Network error: Unable to reach backend API",
            success: false,
            details: fetchError.message,
            backendUrl: BACKEND_API_URL
          },
          { status: 503 }
        );
      }
      
      throw fetchError; // Re-throw unknown errors
    }

    if (!response.ok) {
      let errorData: any = {};
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error('Failed to parse error response:', e);
        errorData = { message: `Backend returned status ${response.status}` };
      }
      
      console.error('❌ Backend API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        backendUrl: BACKEND_API_URL
      });
      
      // Preserve Shufti Pro error details if available
      const errorMessage = errorData.message || errorData.error?.message || errorData.error || 'Failed to submit document for verification';
      const errorDetails = errorData.details || errorData.error || `Backend returned ${response.status}`;
      
      return NextResponse.json(
        {
          error: errorMessage,
          success: false,
          details: errorDetails,
          event: errorData.event || errorData.data?.event,
          status: response.status,
          reference: errorData.data?.reference || body.reference
        },
        { status: response.status }
      );
    }

    let data: any;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('❌ Failed to parse backend response:', parseError);
      return NextResponse.json(
        {
          error: "Invalid response from backend server",
          success: false,
          details: "Backend response could not be parsed as JSON"
        },
        { status: 502 }
      );
    }
    
    console.log('✅ Document submitted successfully:', {
      reference: body.reference,
      status: data.data?.kyc?.verificationStatus
    });

    // Transform backend response to match expected frontend format
    const kycResponse: DocumentKYCResponse = {
      reference: body.reference,
      event: data.data?.event || 'request.pending',
      error: '',
      verification_url: data.data?.verification_url || '',
      verification_result: {
        document: {
          status: data.data?.kyc?.verificationStatus === 'Pending' ? 'pending' : 'accepted',
          message: data.message || 'Document submitted for verification'
        }
      },
      additional_data: {
        document: {
          proof: {
            dob: '',
            full_name: `${body.document.name.first_name} ${body.document.name.last_name}`,
            document_number: ''
          }
        }
      },
      declined_reason: null
    };

    return NextResponse.json(kycResponse);

  } catch (error: any) {
    // Catch-all for any unexpected errors
    console.error("❌ KYC verification error:", {
      error: error,
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      backendUrl: BACKEND_API_URL
    });
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        success: false,
        status: 500,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
