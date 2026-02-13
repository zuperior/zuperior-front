// client/src/app/api/mt5/deposit/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { login, balance, comment } = body;

    // Validate required fields
    if (!login || !balance || balance <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing or invalid fields: login, balance (must be > 0)'
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${process.env.MT5_API_URL}/Users/${login}/AddClientBalance`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        balance: balance,
        comment: comment
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to deposit to MT5 account'
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error depositing to MT5 account:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}