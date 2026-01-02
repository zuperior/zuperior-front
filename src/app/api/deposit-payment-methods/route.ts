import { NextRequest, NextResponse } from 'next/server';

// This endpoint calls zuperior-server, which queries the database directly
// zuperior-server checks the deposit_payment_methods table and returns only enabled methods
const SERVER_API_URL = process.env.NEXT_PUBLIC_SERVER_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Call zuperior-server which queries the database directly
    // The server checks deposit_payment_methods table and returns only enabled methods
    const res = await fetch(`${SERVER_API_URL}/deposit-payment-methods`, {
      cache: 'no-store',
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ [Deposit Payment Methods] Server error:', res.status, errorText);
      // Return empty array on error so frontend can still render
      return NextResponse.json(
        { ok: true, methods: [] },
        { status: 200 }
      );
    }
    
    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('❌ [Deposit Payment Methods] Error:', error);
    // Return empty array on error so frontend can still render
    return NextResponse.json(
      { ok: true, methods: [] },
      { status: 200 }
    );
  }
}

