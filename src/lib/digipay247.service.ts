/**
 * DigiPay247 Service
 * Handles DigiPay247 UPI payment integration
 */

/**
 * Create payment request
 * This function calls the Next.js API route which proxies to the backend
 */
export async function createPayment({
  amount,
  currency = 'USD',
  mt5AccountId,
  accountType,
}: {
  amount: string;
  currency?: string;
  mt5AccountId: string;
  accountType?: string;
}) {
  try {
    console.log('📤 [DigiPay247] Creating payment request:', {
      amount,
      currency,
      mt5AccountId,
    });

    // Get auth token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;

    if (!token) {
      console.error('❌ [DigiPay247] No authentication token found');
      return {
        success: false,
        error: 'Authentication required. Please log in again.',
      };
    }

    // Call Next.js API route (which proxies to backend)
    const response = await fetch('/api/digipay247/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount,
        currency,
        mt5AccountId,
        accountType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create payment request');
    }

    const data = await response.json();

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to create payment request');
    }

    console.log('✅ [DigiPay247] Payment request created successfully:', data.data);
    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    console.error('❌ [DigiPay247] Error creating payment request:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

