import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }
  try {
    const body = await request.json();
    const { accountId, userName, userEmail, accountType, password, leverage, nameOnAccount, package: packageValue, group } = body;

    if (!accountId) {
      return NextResponse.json(
        { success: false, message: 'Account ID is required' },
        { status: 400 }
      );
    }

    if (!userName || !userEmail) {
      return NextResponse.json(
        { success: false, message: 'User name and email are required' },
        { status: 400 }
      );
    }

    // Call server-side API to store MT5 account with password and leverage
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';
    const response = await axios.post(
      `${baseUrl}/mt5/store-account`,
      {
        accountId: accountId.toString(),
        userName: userName,
        userEmail: userEmail,
        accountType: accountType,
        password: password,
        leverage: leverage,
        nameOnAccount: nameOnAccount,
        package: packageValue,
        group: group
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return NextResponse.json(response.data);

  } catch (error: any) {
    console.error('❌ API Error storing MT5 account:', error);

    if (error.response) {
      // Server responded with error status
      return NextResponse.json(
        error.response.data,
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}