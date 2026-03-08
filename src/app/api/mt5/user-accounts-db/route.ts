// client/src/app/api/mt5/user-accounts-db/route.ts
import { NextRequest, NextResponse } from 'next/server';

const RAW_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';
const API_URL = RAW_API_URL.replace(/\/+$/, '');

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if we should fetch all accounts (including archived)
    const searchParams = request.nextUrl.searchParams;
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // Fetch accounts - if includeArchived=true, get all accounts; otherwise get only non-archived
    const includeArchivedParam = includeArchived ? 'true' : 'false';
    const url = `${API_URL}/mt5/user-accounts?includeArchived=${includeArchivedParam}`;

    console.log(`[Next.js API] 🚀 Proxying to user-accounts-db:`, {
      method: 'GET',
      rawApiUrl: RAW_API_URL,
      targetUrl: url,
      timestamp: new Date().toISOString()
    });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          message: errorData.message || errorData.Message || 'Failed to fetch user MT5 accounts from database'
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    const allAccounts = data?.Data?.accounts || data?.data?.accounts || data?.accounts || [];

    // When includeArchived=true, server returns all accounts (both archived and non-archived)
    // When includeArchived=false, server returns only non-archived accounts

    // Return in the expected format
    return NextResponse.json({
      success: true,
      data: {
        accounts: allAccounts,
        total: allAccounts.length
      }
    });

  } catch (error) {
    console.error('Error fetching user MT5 accounts from database:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}

