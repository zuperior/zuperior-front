/**
 * Cregis Payment Engine Integration
 * Documentation: https://developer.cregis.com/api-reference/request
 */

import crypto from "crypto";

// Cregis Payment Engine Configuration (Deposits)
const PAYMENT_CONFIG = {
  PROJECT_ID: process.env.CREGIS_PAYMENT_PROJECT_ID || "1435226128711680",
  API_KEY: process.env.CREGIS_PAYMENT_API_KEY || "afe05cea1f354bc0a9a484e139d5f4af",
  GATEWAY_URL: process.env.CREGIS_GATEWAY_URL || "https://t-rwwagnvw.cregis.io",
};

// Log configuration on first load (in development)
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 [Cregis] Payment Config:', {
    hasEnvProjectId: !!process.env.CREGIS_PAYMENT_PROJECT_ID,
    hasEnvApiKey: !!process.env.CREGIS_PAYMENT_API_KEY,
    hasEnvGateway: !!process.env.CREGIS_GATEWAY_URL,
    gatewayUrl: PAYMENT_CONFIG.GATEWAY_URL
  });
}

// Cregis WaaS Configuration (Withdrawals)
const WAAS_CONFIG = {
  PROJECT_ID: process.env.CREGIS_WAAS_PROJECT_ID || "1435226266132480",
  API_KEY: process.env.CREGIS_WAAS_API_KEY || "f2ce7723128e4fdb88daf9461fce9562",
  GATEWAY_URL: process.env.CREGIS_GATEWAY_URL || "https://t-rwwagnvw.cregis.io",
};

/**
 * Generate MD5 signature for Cregis API requests
 * @param params - Request parameters
 * @param secretKey - API key
 * @returns MD5 signature in lowercase hex
 */
function generateSignature(
  params: Record<string, unknown>,
  secretKey: string
): string {
  // Filter out null, undefined, and empty string values
  const filtered = Object.entries(params).filter(
    ([, value]) => value !== null && value !== undefined && value !== ""
  );

  // Sort parameters by key
  const sorted = filtered.sort(([a], [b]) => a.localeCompare(b));

  // Create string to sign: secretKey + sorted key-value pairs
  const stringToSign = secretKey + sorted.map(([k, v]) => `${k}${v}`).join("");

  // Generate MD5 hash in lowercase
  const signature = crypto
    .createHash("md5")
    .update(stringToSign)
    .digest("hex")
    .toLowerCase();

  return signature;
}

/**
 * Create payment order for deposits
 * @param orderAmount - Amount to deposit
 * @param orderCurrency - Currency (e.g., "USDT")
 * @param callbackUrl - Callback URL for payment notifications
 * @param successUrl - Redirect URL after successful payment
 * @param cancelUrl - Redirect URL after cancelled payment
 * @param payerId - Optional payer ID
 * @param validTime - Optional valid time in MINUTES (default 30, range: 10-60 minutes)
 */
export async function createPaymentOrder({
  orderAmount,
  orderCurrency,
  callbackUrl,
  successUrl,
  cancelUrl,
  payerId,
  validTime = 30,
}: {
  orderAmount: string;
  orderCurrency: string;
  callbackUrl: string;
  successUrl: string;
  cancelUrl: string;
  payerId?: string;
  validTime?: number;
}) {
  try {
    // Validate all required parameters
    if (!orderAmount || orderAmount.trim() === '') {
      throw new Error('orderAmount must not be empty');
    }
    if (!orderCurrency || orderCurrency.trim() === '') {
      throw new Error('orderCurrency must not be empty');
    }
    if (!callbackUrl || callbackUrl.trim() === '') {
      throw new Error('callbackUrl must not be empty');
    }
    if (!successUrl || successUrl.trim() === '') {
      throw new Error('successUrl must not be empty');
    }
    if (!cancelUrl || cancelUrl.trim() === '') {
      throw new Error('cancelUrl must not be empty');
    }

    // Validate validTime is within Cregis acceptable range (10-60 minutes)
    if (validTime < 10 || validTime > 60) {
      console.warn(`⚠️ validTime ${validTime} is outside Cregis range (10-60 minutes). Clamping to valid range.`);
      validTime = Math.max(10, Math.min(60, validTime));
    }

    const orderId = crypto.randomUUID();
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 8);

    // Build payload according to Cregis API documentation
    const payload: Record<string, string | number> = {
      pid: Number(PAYMENT_CONFIG.PROJECT_ID),
      nonce,
      timestamp,
      order_id: orderId,
      order_amount: orderAmount.trim(),
      order_currency: orderCurrency.trim(),
      callback_url: callbackUrl.trim(),
      success_url: successUrl.trim(),
      cancel_url: cancelUrl.trim(),
      valid_time: validTime,
      ...(payerId && payerId.trim() !== '' && { payer_id: payerId.trim() }),
    };

    // Generate signature
    const sign = generateSignature(payload, PAYMENT_CONFIG.API_KEY);
    const requestData = { ...payload, sign };

    // Make request to Cregis API
    const response = await fetch(`${PAYMENT_CONFIG.GATEWAY_URL}/api/v2/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Cregis API HTTP error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Cregis API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.code !== "00000") {
      const errorMessage = data.msg || "Unknown error";
      console.error("❌ Cregis API error details:", {
        code: data.code,
        msg: errorMessage,
        data: data.data,
        fullResponse: data
      });

      console.error("💡 Troubleshooting hints:");
      if (errorMessage.includes('checkout counter')) {
        console.error("   → This usually means currency format is incorrect or currency not enabled for Payment Engine");
        console.error("   → Try checking available currencies with /api/cregis/check-currencies");
        console.error("   → Contact Cregis support to enable this currency for Payment Engine API");
      }

      // Provide helpful error messages for common issues
      if (errorMessage.includes('whitelist')) {
        // Extract IP from error message (supports both IPv4 and IPv6)
        const ipMatch = errorMessage.match(/[\da-f.:]+$/i);
        const detectedIp = ipMatch ? ipMatch[0] : 'your server IP';
        throw new Error(`IP whitelist error: Your server IP needs to be added to Cregis whitelist. IP: ${detectedIp}. Please contact Cregis support to add this IP to the whitelist.`);
      }

      throw new Error(`Cregis API error: ${errorMessage}`);
    }

    // Extract payment data from Cregis response
    const paymentData = {
      cregis_id: data.data?.cregis_id,
      checkout_url: data.data?.checkout_url,
      payment_info: data.data?.payment_info,
      expire_time: data.data?.expire_time,
      orderId,
    };

    // Verify payment_info is present
    if (!paymentData.payment_info || paymentData.payment_info.length === 0) {
      console.error("❌ Missing payment_info in Cregis response!");
      console.error("📋 Full data.data object:", JSON.stringify(data.data, null, 2));
      throw new Error(`Cregis API did not return payment information. Check console logs.`);
    }

    return {
      success: true,
      data: paymentData,
    };
  } catch (error: unknown) {
    console.error("❌ Error creating payment order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Query payment order status
 * @param cregisId - Cregis payment ID
 */
export async function queryPaymentOrder(cregisId: string) {
  try {
    const timestamp = Date.now();
    const nonce = Math.random().toString(36).substring(2, 8);

    const payload: Record<string, string | number> = {
      pid: Number(PAYMENT_CONFIG.PROJECT_ID),
      nonce,
      timestamp,
      cregis_id: cregisId,
    };

    const sign = generateSignature(payload, PAYMENT_CONFIG.API_KEY);
    const requestData = { ...payload, sign };

    const response = await fetch(`${PAYMENT_CONFIG.GATEWAY_URL}/api/v2/checkout/info`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`Cregis API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== "00000") {
      throw new Error(`Cregis API error: ${data.msg}`);
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error: unknown) {
    console.error("❌ Error querying payment order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get order currency list (available payment methods)
 */
export async function getOrderCurrencyList() {
  try {
    const pid = Number(PAYMENT_CONFIG.PROJECT_ID);
    const nonce = Math.random().toString(36).substring(2, 8);
    const timestamp = Date.now();

    const payload: Record<string, string | number> = {
      pid,
      nonce,
      timestamp,
    };

    const sign = generateSignature(payload, PAYMENT_CONFIG.API_KEY);
    const requestData = { ...payload, sign };

    const response = await fetch(`${PAYMENT_CONFIG.GATEWAY_URL}/api/v2/checkout/order_currency/list`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`Cregis API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== "00000") {
      throw new Error(`Cregis API error: ${data.msg}`);
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error: unknown) {
    console.error("❌ Error fetching order currency list:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * WaaS - Create withdrawal order
 * @param currency - Currency identifier (e.g., "195@TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t")
 * @param address - Destination address
 * @param amount - Withdrawal amount
 * @param thirdPartyId - Unique third-party order ID
 * @param remark - Optional remark
 */
export async function createWithdrawalOrder({
  currency,
  address,
  amount,
  thirdPartyId,
  remark,
  callbackUrl,
}: {
  currency: string;
  address: string;
  amount: string;
  thirdPartyId: string;
  remark?: string;
  callbackUrl?: string;
}) {
  try {
    const pid = Number(WAAS_CONFIG.PROJECT_ID);
    const nonce = Math.random().toString(36).substring(2, 8);
    const timestamp = Date.now();

    const payload: Record<string, string | number> = {
      pid,
      nonce,
      timestamp,
      currency,
      address,
      amount,
      third_party_id: thirdPartyId,
      ...(remark && { remark }),
      ...(callbackUrl && { callback_url: callbackUrl }),
    };

    const sign = generateSignature(payload, WAAS_CONFIG.API_KEY);
    const requestData = { ...payload, sign };

    const response = await fetch(`${WAAS_CONFIG.GATEWAY_URL}/api/v1/payout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`Cregis API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== "00000") {
      throw new Error(`Cregis API error: ${data.msg}`);
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error: unknown) {
    console.error("❌ Error creating withdrawal order:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Verify Cregis callback signature
 * @param params - Callback parameters
 * @param secretKey - API key
 * @param receivedSign - Signature received from Cregis
 * @returns true if signature is valid
 */
export function verifyCallbackSignature(
  params: Record<string, unknown>,
  secretKey: string,
  receivedSign: string
): boolean {
  const generatedSign = generateSignature(params, secretKey);
  return generatedSign.toLowerCase() === receivedSign.toLowerCase();
}
