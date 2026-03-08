/**
 * Test Backend Connection
 * Simple endpoint to test if backend is reachable
 */

import { NextResponse } from 'next/server';

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

export async function GET() {
  try {
    console.log('🧪 Testing backend connection...');
    console.log('🔗 Backend URL:', BACKEND_API_URL);
    
    // Test basic connectivity
    const response = await fetch(`http://localhost:5001/`, {
      method: 'GET',
    });

    const isBackendUp = response.ok;
    const backendResponse = await response.text();

    console.log('✅ Backend test result:', {
      isUp: isBackendUp,
      status: response.status,
      response: backendResponse
    });

    return NextResponse.json({
      success: true,
      backend: {
        url: BACKEND_API_URL,
        isReachable: isBackendUp,
        status: response.status,
        response: backendResponse,
      },
      frontend: {
        env: process.env.NEXT_PUBLIC_BACKEND_API_URL || 'NOT SET',
      }
    });
  } catch (error) {
    console.error('❌ Backend test failed:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        backend: {
          url: BACKEND_API_URL,
          isReachable: false,
        }
      },
      { status: 500 }
    );
  }
}



