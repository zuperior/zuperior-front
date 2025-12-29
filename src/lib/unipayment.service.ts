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
  successUrl,
  cancelUrl,
}: {
  amount: string;
  currency?: string;
  paymentMethod: string;
  mt5AccountId: string;
  accountType?: string;
  network?: string;
  successUrl?: string;
  cancelUrl?: string;
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

    // Call backend API route (which calls Unipayment API)
    const response = await fetch(`${BACKEND_API_URL}/unipayment/create-invoice`, {
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
        successUrl,
        cancelUrl,
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

