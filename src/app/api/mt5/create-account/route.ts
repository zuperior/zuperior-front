// client/src/app/api/mt5/create-account/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

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
    const {
      name,
      group,
      leverage = 2000,
      masterPassword,
      investorPassword,
      email,
      country,
      city,
      phone,
      comment,
      accountPlan
    } = body;

    // Validate required fields
    if (!name || !group || !masterPassword || !investorPassword) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: name, group, masterPassword, investorPassword'
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${API_URL}/Users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        group,
        leverage,
        masterPassword,
        investorPassword,
        email,
        country,
        city,
        phone,
        comment
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          message: errorData.message || 'Failed to create MT5 account'
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // After MT5 account is created, store account details in database
    if (data.data?.mt5Login) {
      try {
        const accountId = data.data.mt5Login.toString();

        // Determine account type from group (same logic as backend)
        const groupLower = group.toLowerCase();
        const isDemoGroup = groupLower.includes('demo');
        const accountType = isDemoGroup ? 'Demo' : 'Live';

        // Determine package from accountPlan or group
        let packageValue = accountPlan;
        if (!packageValue) {
          packageValue = groupLower.includes('pro') ? 'Pro' : 'Startup';
        }
        // Normalize: map 'standard' to 'Startup', keep 'Pro' as is
        if (packageValue) {
          if (/^standard$/i.test(packageValue)) {
            packageValue = 'Startup';
          } else if (/^pro$/i.test(packageValue)) {
            packageValue = 'Pro';
          } else {
            // Fallback title-case
            packageValue = packageValue.charAt(0).toUpperCase() + packageValue.slice(1);
          }
        }

        // Call internal API to store in database with password, leverage, nameOnAccount, and package
        const storeResponse = await fetch(`${API_URL}/mt5/store-account`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accountId: accountId,
            accountType: accountType,
            password: masterPassword,
            leverage: leverage,
            nameOnAccount: name, // Include nameOnAccount
            package: packageValue, // Include package
            group: group, // Include group for reference
            mt5Data: data
          })
        });

        if (!storeResponse.ok) {
          console.error('❌ Failed to store MT5 account details in database');
        }
      } catch (storeError) {
        console.error('❌ Error storing MT5 account in database:', storeError);
      }
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Error creating MT5 account:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
