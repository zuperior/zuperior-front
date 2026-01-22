import { NextRequest, NextResponse } from "next/server";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';
// Production API URL
const UNIPAYMENT_API_URL = process.env.UNIPAYMENT_API_URL || 'https://api.unipayment.io';
const UNIPAYMENT_CLIENT_ID = process.env.UNIPAYMENT_CLIENT_ID || 'd1bfecf2-5f65-429f-abf3-8006bfea64e1';
const UNIPAYMENT_CLIENT_SECRET = process.env.UNIPAYMENT_CLIENT_SECRET || 'GKq8a6dvnsTvC9bxJg2rXUFmXKcAcptwU';
const UNIPAYMENT_APP_ID = process.env.UNIPAYMENT_APP_ID || 'bedf6753-9b4e-4321-9eaa-722397d4214b';
const UNIPAYMENT_WEBHOOK_URL = process.env.UNIPAYMENT_WEBHOOK_URL || 'https://dashboard.zuperior.com/transactions';

export async function POST(req: NextRequest) {
  try {
    console.log('💳 [Unipayment] Creating invoice...');

    const body = await req.json() as {
      amount: string;
      currency?: string;
      paymentMethod: string;
      mt5AccountId: string;
      accountType?: string;
      network?: string;
      successUrl?: string;
      cancelUrl?: string;
    };

    const { amount, currency = 'USD', paymentMethod, mt5AccountId, accountType, network, successUrl, cancelUrl } = body;

    // Validate required fields
    if (!amount || !paymentMethod || !mt5AccountId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: amount, paymentMethod, mt5AccountId"
        },
        { status: 400 }
      );
    }

    // Get access token first
    const tokenEndpoint = `${UNIPAYMENT_API_URL}/connect/token`;
    console.log(`🔐 [Unipayment] Getting token from: ${tokenEndpoint}`);
    
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: UNIPAYMENT_CLIENT_ID,
        client_secret: UNIPAYMENT_CLIENT_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('❌ [Unipayment] Token request failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        error: errorText,
        endpoint: tokenEndpoint
      });
      return NextResponse.json(
        {
          success: false,
          error: `Failed to get access token: ${tokenResponse.status} ${errorText}`
        },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('❌ [Unipayment] Access token not found in response:', tokenData);
      return NextResponse.json(
        {
          success: false,
          error: 'Access token not found in response'
        },
        { status: 500 }
      );
    }

    // Generate callback URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const defaultSuccessUrl = successUrl || `${baseUrl}/deposit/success`;
    const defaultCancelUrl = cancelUrl || `${baseUrl}/deposit/cancel`;
    // Use production webhook URL from environment
    const notifyUrl = UNIPAYMENT_WEBHOOK_URL;

    // Map payment method to Unipayment format
    const paymentMethodMap: Record<string, string> = {
      crypto: 'crypto',
      card: 'card',
      'credit_debit_cards': 'card',
      binance_pay: 'binance_pay',
      google_apple_pay: 'google_apple_pay',
      upi: 'upi',
    };

    const unipaymentMethod = paymentMethodMap[paymentMethod] || paymentMethod;

    // Create invoice via Unipayment API
    const invoicePayload: any = {
      app_id: UNIPAYMENT_APP_ID,
      amount: parseFloat(amount),
      currency: currency.toUpperCase(),
      payment_method: unipaymentMethod,
      success_url: defaultSuccessUrl,
      cancel_url: defaultCancelUrl,
      notify_url: notifyUrl,
      order_id: `deposit_${mt5AccountId}_${Date.now()}`,
      description: `Deposit to MT5 Account ${mt5AccountId}`,
    };

    // ✅ FIX: Map network to Unipayment format (they expect NETWORK_* format)
    // Unipayment expects: NETWORK_TRX, NETWORK_ETH, NETWORK_BSC, NETWORK_BTC, NETWORK_SOL
    if (paymentMethod === 'crypto' && network) {
      // Map common network formats to Unipayment format (matching backend service)
      const networkMap: Record<string, string> = {
        'TRC20': 'NETWORK_TRX',
        'TRX': 'NETWORK_TRX',
        'ERC20': 'NETWORK_ETH',
        'ETH': 'NETWORK_ETH',
        'BEP20': 'NETWORK_BSC',
        'BSC': 'NETWORK_BSC',
        'BTC': 'NETWORK_BTC',
        'SOL': 'NETWORK_SOL',
        // Also handle if already in correct format
        'NETWORK_TRX': 'NETWORK_TRX',
        'NETWORK_ETH': 'NETWORK_ETH',
        'NETWORK_BSC': 'NETWORK_BSC',
        'NETWORK_BTC': 'NETWORK_BTC',
        'NETWORK_SOL': 'NETWORK_SOL',
      };
      
      const mappedNetwork = networkMap[network.toUpperCase()] || network.toUpperCase();
      invoicePayload.network = mappedNetwork;
      console.log('🌐 [Unipayment] Network mapping:', { original: network, mapped: mappedNetwork });
    }

    console.log('📤 [Unipayment] Creating invoice:', invoicePayload);

    // ✅ FIX: Use correct Unipayment API endpoint (v1.0, not v2.0)
    const invoiceResponse = await fetch(`${UNIPAYMENT_API_URL}/v1.0/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(invoicePayload),
    });

    if (!invoiceResponse.ok) {
      const errorText = await invoiceResponse.text();
      console.error('❌ [Unipayment] Invoice creation failed:', errorText);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to create invoice: ${errorText}`
        },
        { status: 500 }
      );
    }

    const invoiceResponseData = await invoiceResponse.json();

    console.log('✅ [Unipayment] Invoice created:', invoiceResponseData);

    // ✅ FIX: Unipayment API returns { code: "OK", msg: "", data: {...} } structure
    // Extract invoice data from response
    let invoiceData = invoiceResponseData;
    if (invoiceResponseData.code === 'OK' && invoiceResponseData.data) {
      invoiceData = invoiceResponseData.data;
    }

    // Extract crypto address and QR code from host_to_host_data if available
    let cryptoAddress = invoiceData.address || invoiceData.crypto_address;
    let qrCode = invoiceData.qr_code || invoiceData.qrCode;
    
    if (invoiceData.host_to_host_data) {
      const hostData = invoiceData.host_to_host_data;
      if (hostData.address) {
        cryptoAddress = hostData.address;
      }
      if (hostData.qr_code) {
        qrCode = hostData.qr_code;
      }
    }

    // ✅ FIX: Extract all fields including payAmount and payCurrency for crypto payments
    const invoiceResult = {
      invoiceId: invoiceData.invoice_id || invoiceData.id,
      invoiceUrl: invoiceData.invoice_url || invoiceData.invoiceUrl,
      status: invoiceData.status,
      amount: invoiceData.price_amount || invoiceData.amount,
      currency: invoiceData.price_currency || invoiceData.currency,
      paymentMethod: invoiceData.payment_method || invoiceData.paymentMethod || paymentMethod,
      qrCode: qrCode,
      cryptoAddress: cryptoAddress,
      expiresAt: invoiceData.expiration_time || invoiceData.expires_at || invoiceData.expiresAt,
      // For crypto payments, include pay amount and currency
      payAmount: invoiceData.pay_amount || invoiceData.payAmount || (paymentMethod === 'crypto' ? (invoiceData.price_amount || invoiceData.amount) : undefined),
      payCurrency: invoiceData.pay_currency || invoiceData.payCurrency || (paymentMethod === 'crypto' ? (invoiceData.price_currency || invoiceData.currency) : undefined),
      priceAmount: invoiceData.price_amount || invoiceData.amount, // Original order amount
      priceCurrency: invoiceData.price_currency || invoiceData.currency, // Original order currency
    };

    // Create deposit record in backend
    try {
      const token = req.headers.get('authorization')?.replace('Bearer ', '') || 
                    req.cookies.get('token')?.value ||
                    req.cookies.get('userToken')?.value;

      if (token && mt5AccountId) {
        const backendResponse = await fetch(`${BACKEND_API_URL}/deposit/unipayment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            mt5AccountId,
            amount,
            currency,
            paymentMethod,
            network: paymentMethod === 'crypto' ? network : undefined,
            invoiceId: invoiceResult.invoiceId,
            invoiceUrl: invoiceResult.invoiceUrl,
            qrCodeUrl: invoiceResult.qrCode,
            cryptoAddress: invoiceResult.cryptoAddress,
            expiresAt: invoiceResult.expiresAt,
          }),
        });

        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          console.log('✅ [Unipayment] Deposit record created in backend:', backendData);
        } else {
          const errorText = await backendResponse.text();
          console.error('❌ [Unipayment] Backend call failed:', backendResponse.status, errorText);
        }
      }
    } catch (backendError) {
      console.warn('⚠️ [Unipayment] Backend error (continuing anyway):', backendError);
    }

    return NextResponse.json({
      success: true,
      data: invoiceResult
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error("❌ [Unipayment] Create invoice error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

