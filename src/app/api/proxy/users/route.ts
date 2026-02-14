import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const targetUrl = `${process.env.MT5_API_URL}/Users`;

    console.log('Proxying users request to:', targetUrl);

    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    const data = await response.json();

    // Add CORS headers to the response
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    console.log('Users proxy response status:', response.status);
    console.log('Users proxy response data length:', JSON.stringify(data).length);

    return new NextResponse(JSON.stringify(data), {
      status: response.status,
      headers,
    });
  } catch (error: any) {
    console.error('Users proxy error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Proxy error', message: error?.message || 'Unknown error' }),
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

export async function POST(request: NextRequest) {
  try {

    let body;
    let rawBodyText = '';
    const contentType = request.headers.get('content-type') || '';

    // Read the body as text first to avoid consumption issues
    rawBodyText = await request.text();
    console.log('Raw body text received:', rawBodyText);
    console.log('Content-Type:', contentType);

    if (contentType.includes('application/json')) {
      try {
        body = JSON.parse(rawBodyText);
        console.log('Successfully parsed JSON body:', body);
      } catch (jsonError) {
        console.error('Failed to parse request body as JSON:', jsonError);
        console.error('Raw request body:', rawBodyText);
        return new NextResponse(
          JSON.stringify({
            error: 'Invalid JSON in request body',
            details: jsonError instanceof Error ? jsonError.message : String(jsonError),
            rawBody: rawBodyText
          }),
          {
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
          }
        );
      }
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // Handle form data
      try {
        const params = new URLSearchParams(rawBodyText);
        body = Object.fromEntries(params.entries());
        console.log('Successfully parsed form body:', body);
      } catch (formError) {
        console.error('Failed to parse form data:', formError);
        return new NextResponse(
          JSON.stringify({
            error: 'Invalid form data in request body',
            details: formError instanceof Error ? formError.message : String(formError),
            rawBody: rawBodyText
          }),
          {
            status: 400,
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Content-Type': 'application/json',
            },
          }
        );
      }
    } else {
      // Handle other content types as text
      body = rawBodyText;
      console.log('Treating as raw text body:', body);
    }

    const targetUrl = `${process.env.MT5_API_URL}/Users`;
    console.log('Request body:', body);
    console.log('Content-Type:', contentType);

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    let data;
    const responseContentType = response.headers.get('content-type') || '';
    if (responseContentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Add CORS headers to the response
    const headers = new Headers();
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    console.log('Users POST proxy response status:', response.status);
    console.log('Users POST proxy response data:', data);

    // After MT5 account is created, determine and store accountType in our database
    if (response.ok && data && body.group) {
      console.log('🔍 Extracting group from MT5 response:', body.group);

      // Determine account type from group (handle both single and double backslashes)
      const groupFromRequest = body.group;
      const groupLower = groupFromRequest.toLowerCase();
      const isDemoGroup = groupLower.includes('demo');
      const accountType = isDemoGroup ? 'Demo' : 'Live';

      console.log('📝 Determined account type:', accountType, 'from group:', groupFromRequest);

      // If we got an accountId from the response, store it in our database
      const accountId = data?.Login || data?.login || data?.Data?.Login || data?.Data?.login;

      if (accountId) {
        try {
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';
          const token = request.headers.get('authorization');

          // Determine package from group or accountPlan
          let packageValue = body.accountPlan;
          if (!packageValue) {
            const groupLower = groupFromRequest.toLowerCase();
            packageValue = groupLower.includes('pro') ? 'Pro' : 'Startup';
          }
          // Normalize: map 'standard' -> 'Startup'
          if (packageValue) {
            if (/^standard$/i.test(packageValue)) {
              packageValue = 'Startup';
            } else if (/^pro$/i.test(packageValue)) {
              packageValue = 'Pro';
            } else {
              packageValue = packageValue.charAt(0).toUpperCase() + packageValue.slice(1);
            }
          }

          console.log('💾 Storing account with accountType:', accountType, 'and package:', packageValue);

          const storeResponse = await fetch(`${backendUrl}/mt5/store-account`, {
            method: 'POST',
            headers: {
              'Authorization': token || '',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              accountId: accountId.toString(),
              accountType: accountType,
              group: groupFromRequest,
              leverage: body.leverage || 100,
              nameOnAccount: body.name,
              package: packageValue
            })
          });

          if (storeResponse.ok) {
            console.log('✅ Account stored with accountType:', accountType);
          } else {
            console.error('❌ Failed to store account with accountType');
          }
        } catch (storeError) {
          console.error('❌ Error storing account with accountType:', storeError);
        }
      }
    }

    return new NextResponse(JSON.stringify(data), {
      status: response.status,
      headers,
    });
  } catch (error: any) {
    console.error('Users POST proxy error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Proxy error', message: error?.message || 'Unknown error' }),
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
