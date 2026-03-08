import { NextRequest, NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [DigiPay247] Proof submission API route called');
    console.log('🔗 [DigiPay247] Backend URL:', BACKEND_API_URL);

    const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                  request.cookies.get('userToken')?.value;

    if (!token) {
      console.error('❌ [DigiPay247] No authentication token provided');
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('📋 [DigiPay247] Parsing form data...');
    const formData = await request.formData();
    
    const depositId = formData.get('depositId');
    const utrTransactionId = formData.get('utrTransactionId');
    const proofFile = formData.get('proofFile') as File | null;

    console.log('📊 [DigiPay247] Received proof data:', {
      depositId,
      utrTransactionId,
      hasFile: !!proofFile,
      fileName: proofFile?.name,
      fileSize: proofFile?.size
    });

    // Create new FormData for backend (to ensure proper formatting)
    const backendFormData = new FormData();
    backendFormData.append('depositId', depositId as string);
    backendFormData.append('utrTransactionId', utrTransactionId as string);
    if (proofFile && proofFile.size > 0) {
      backendFormData.append('proofFile', proofFile);
    }

    console.log('📡 [DigiPay247] Forwarding to backend:', `${BACKEND_API_URL}/deposit/digipay247/submit-proof`);
    
    // Forward to backend with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    let backendResponse: Response;
    try {
      backendResponse = await fetch(`${BACKEND_API_URL}/deposit/digipay247/submit-proof`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // DO NOT set Content-Type - let fetch set it automatically with boundary for FormData
        },
        body: backendFormData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      console.error('❌ [DigiPay247] Fetch error details:', {
        name: fetchError.name,
        message: fetchError.message,
        cause: fetchError.cause,
        code: fetchError.code,
        errno: fetchError.errno,
        syscall: fetchError.syscall,
        address: fetchError.address,
        port: fetchError.port,
        backendUrl: BACKEND_API_URL,
        envVar: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'NOT SET'
      });
      
      if (fetchError.name === 'AbortError') {
        console.error('❌ [DigiPay247] Request timeout when calling backend API');
        return NextResponse.json(
          {
            success: false,
            error: 'Request timeout: Backend API did not respond in time',
            details: 'The backend server may be slow or unreachable',
            backendUrl: BACKEND_API_URL
          },
          { status: 504 }
        );
      }
      
      // Handle various network errors
      if (fetchError instanceof TypeError || 
          fetchError.name === 'TypeError' ||
          fetchError.message?.includes('fetch') ||
          fetchError.message?.includes('ECONNREFUSED') ||
          fetchError.message?.includes('ENOTFOUND') ||
          fetchError.code === 'ECONNREFUSED' ||
          fetchError.code === 'ENOTFOUND') {
        console.error('❌ [DigiPay247] Network error when calling backend API:', {
          error: fetchError.message,
          code: fetchError.code,
          backendUrl: BACKEND_API_URL
        });
        return NextResponse.json(
          {
            success: false,
            error: 'Network error: Unable to reach backend API',
            details: fetchError.message || 'Connection failed',
            backendUrl: BACKEND_API_URL,
            suggestion: 'Please check that the backend server is running and accessible'
          },
          { status: 503 }
        );
      }
      
      // Re-throw unknown errors
      console.error('❌ [DigiPay247] Unknown fetch error:', fetchError);
      throw fetchError;
    }

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error('❌ [DigiPay247] Backend returned error:', backendResponse.status, errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText || 'Unknown error' };
      }
      
      return NextResponse.json(
        {
          success: false,
          error: errorData.error || `Backend error: ${backendResponse.status}`,
          details: errorData.details
        },
        { status: backendResponse.status }
      );
    }

    const result = await backendResponse.json();
    console.log('✅ [DigiPay247] Backend response received:', result.success ? 'Success' : 'Failed');

    return NextResponse.json(result, { status: backendResponse.status });
  } catch (error: any) {
    console.error('❌ [DigiPay247] Error submitting proof:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to submit proof',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
