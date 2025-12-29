import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'wire';
    const token = request.headers.get('authorization');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = token;

    const res = await fetch(`${API_URL}/manual-gateway?type=${encodeURIComponent(type)}`, {
      headers,
      cache: 'no-store',
    });
    
    // Handle 404 from backend - gateway not found in database
    if (res.status === 404) {
      const errorData = await res.json().catch(() => ({ success: false, message: 'Gateway not found' }));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Gateway not found' },
        { status: 200 } // Return 200 so frontend can handle it gracefully
      );
    }
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ [Manual Gateway] Backend error:', res.status, errorText);
      return NextResponse.json(
        { success: false, message: errorText || 'Failed to fetch manual gateway' },
        { status: res.status }
      );
    }
    
    const data = await res.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    console.error('❌ [Manual Gateway] Error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch manual gateway' },
      { status: 500 }
    );
  }
}
