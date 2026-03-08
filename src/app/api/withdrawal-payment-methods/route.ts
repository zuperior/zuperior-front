import { NextRequest, NextResponse } from 'next/server';

// This endpoint calls zuperior-server, which queries the database directly
// zuperior-server checks the withdrawal_payment_methods table and returns only enabled methods
const SERVER_API_URL = process.env.NEXT_PUBLIC_SERVER_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Call zuperior-server which queries the database directly
    // The server checks withdrawal_payment_methods table and returns only enabled methods
    const url = `${SERVER_API_URL}/withdrawal-payment-methods`;
    console.log('🔍 [Withdrawal Payment Methods] Fetching from:', url);
    
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📡 [Withdrawal Payment Methods] Response status:', res.status);
    
    if (!res.ok) {
      let errorText = '';
      try {
        errorText = await res.text();
        // Try to parse as JSON
        try {
          const errorJson = JSON.parse(errorText);
          errorText = errorJson.error || errorText;
        } catch {
          // Not JSON, use as is
        }
      } catch {
        errorText = `HTTP ${res.status}`;
      }
      
      console.error('❌ [Withdrawal Payment Methods] Server error:', res.status, errorText);
      console.error('❌ [Withdrawal Payment Methods] Server URL was:', url);
      
      // If it's a 500 error, the server might be down or database issue
      // Return empty array but with error info for debugging
      return NextResponse.json(
        { 
          ok: false, 
          error: `Server error (${res.status}): ${errorText}`,
          methods: [],
          serverError: true
        },
        { status: 200 } // Return 200 so frontend can still render
      );
    }
    
    const data = await res.json();
    console.log('✅ [Withdrawal Payment Methods] Received data:', {
      ok: data.ok,
      methodCount: data.methods?.length || 0,
      methods: data.methods?.map((m: any) => m.method_key) || []
    });
    
    // Ensure we always return the expected format
    if (!data.ok) {
      console.warn('⚠️ [Withdrawal Payment Methods] Response ok is false:', data);
    }
    
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('❌ [Withdrawal Payment Methods] Error:', error);
    console.error('❌ [Withdrawal Payment Methods] Error details:', {
      message: error.message,
      stack: error.stack,
      SERVER_API_URL
    });
    // Return empty array on error so frontend can still render
    return NextResponse.json(
      { ok: false, error: error.message || 'Network error', methods: [] },
      { status: 200 }
    );
  }
}

