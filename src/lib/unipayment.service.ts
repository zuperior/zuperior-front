/**
 * Unipayment Service Integration
 * Documentation: https://unipayment.readme.io/reference/
 * All API calls go through the backend server to avoid Cloudflare IP blocking
 */

const BACKEND_API_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';

// Token cache: { token: string, expiresAt: number }
let tokenCache: { token: string; expiresAt: number } | null = null;
const TOKEN_TTL_MS = 50 * 60 * 1000; // 50 minutes

/**
 * Get OAuth access token from Unipayment (via backend)
 */
export async function getAccessToken(): Promise<string> {
  try {
    // Check cache first
    if (tokenCache && tokenCache.expiresAt > Date.now()) {
      console.log('🔐 [Unipayment] Using cached access token');
      return tokenCache.token;
    }

    console.log('🔐 [Unipayment] Fetching new access token via backend...');

    // Get auth token from localStorage (same as other services)
    const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;

    if (!token) {
      console.error('❌ [Unipayment] No authentication token found');
      throw new Error('Authentication required. Please log in again.');
    }

    // Call backend API route (which calls Unipayment API)
    const response = await fetch(`${BACKEND_API_URL}/unipayment/access-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get access token');
    }

    const data = await response.json();

    if (!data.success || !data.access_token) {
      throw new Error(data.error || 'Access token not found in response');
    }

    // Cache the token
    tokenCache = {
      token: data.access_token,
      expiresAt: Date.now() + TOKEN_TTL_MS,
    };

    console.log('✅ [Unipayment] Access token obtained successfully');
    return data.access_token;
  } catch (error) {
    console.error('❌ [Unipayment] Error getting access token:', error);
    throw error;
  }
}

/**
 * Create invoice for payment
 * This function calls the backend API route which handles the actual invoice creation
 */
export async function createInvoice({
  amount,
  currency = 'USD',
  paymentMethod,
  mt5AccountId,
  accountType,
  network,
  cryptoSymbol,
  successUrl,
  cancelUrl,
  inrAmount,
}: {
  amount: string;
  currency?: string;
  paymentMethod: string;
  mt5AccountId: string;
  accountType?: string;
  network?: string;
  cryptoSymbol?: string;
  successUrl?: string;
  cancelUrl?: string;
  inrAmount?: string;
}) {
  try {
    console.log('📤 [Unipayment] Creating invoice via backend:', {
      amount,
      currency,
      paymentMethod,
      mt5AccountId,
    });

    // Get auth token from localStorage (same as other services)
    const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;

    if (!token) {
      console.error('❌ [Unipayment] No authentication token found');
      return {
        success: false,
        error: 'Authentication required. Please log in again.',
      };
    }

    // ✅ FIX: Call Next.js API route (which proxies to backend and handles Unipayment API)
    // The Next.js route at /api/unipayment/create-invoice handles the Unipayment API call
    // and creates the deposit record in the backend
    const response = await fetch('/api/unipayment/create-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        paymentMethod,
        network,
        cryptoSymbol,
        mt5AccountId,
        accountType,
        successUrl,
        cancelUrl,
        inrAmount,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create invoice');
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to create invoice');
    }

    console.log('✅ [Unipayment] Invoice created successfully:', data.data);
    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error('❌ [Unipayment] Error creating invoice:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get exchange rate and converted amount (via backend)
 * Uses Get Quote API for accurate real-time conversion
 */
export async function getExchangeRate(fromCurrency: string = 'USD', toCurrency: string = 'BTC', amount: number = 1) {
  try {
    console.log(`💱 [Unipayment] Getting exchange rate: ${amount} ${fromCurrency} -> ${toCurrency}`);

    // Get auth token from localStorage (same as other services)
    const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;

    if (!token) {
      console.error('❌ [Unipayment] No authentication token found');
      return {
        success: false,
        error: 'Authentication required. Please log in again.',
      };
    }

    // Call backend API route
    const response = await fetch(`${BACKEND_API_URL}/unipayment/exchange-rate?fiat=${fromCurrency}&crypto=${toCurrency}&amount=${amount}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error || 'Failed to get exchange rate';
      
      // Handle minimum amount error gracefully (don't show error if amount is too low)
      if (errorMessage.includes('minimum amount') || errorMessage.includes('below the minimum')) {
        console.log('⚠️ [Unipayment] Amount below minimum, will retry when amount is sufficient');
        return {
          success: false,
          error: errorMessage,
          isMinimumAmountError: true,
        };
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.success || data.netAmount === undefined) {
      throw new Error(data.error || 'Failed to get exchange rate');
    }

    console.log(`✅ [Unipayment] Exchange rate obtained: rate=${data.rate}, netAmount=${data.netAmount}`);
    return {
      success: true,
      rate: data.rate,
      netAmount: data.netAmount,
      quoteId: data.quoteId,
    };
  } catch (error) {
    console.error('❌ [Unipayment] Error getting exchange rate:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get invoice status (via backend)
 */
export async function getInvoiceStatus(invoiceId: string) {
  try {
    console.log('📥 [Unipayment] Getting invoice status via backend:', invoiceId);

    // Get auth token from localStorage (same as other services)
    const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;

    if (!token) {
      console.error('❌ [Unipayment] No authentication token found');
      return {
        success: false,
        error: 'Authentication required. Please log in again.',
      };
    }

    // Call backend API route
    const response = await fetch(`${BACKEND_API_URL}/deposit/unipayment/status/${invoiceId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to get invoice status');
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.message || data.error || 'Failed to get invoice status');
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error('❌ [Unipayment] Error getting invoice status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

