/**
 * Cregis WaaS (Wallet as a Service) Integration
 * Used for deposit address generation and crypto transactions
 * Documentation: https://developer.cregis.com/api-reference/request-apis/waas
 */

import crypto from "crypto";

// Cregis WaaS Configuration
const WAAS_CONFIG = {
  PROJECT_ID: process.env.CREGIS_WAAS_PROJECT_ID || "1435226266132480",
  API_KEY: process.env.CREGIS_WAAS_API_KEY || "f2ce7723128e4fdb88daf9461fce9562",
  GATEWAY_URL: process.env.CREGIS_GATEWAY_URL || "https://t-rwwagnvw.cregis.io",
};

// Log configuration on first load (in development)
if (process.env.NODE_ENV === 'development') {
  // console.log('🔧 [Cregis WaaS] Config:', {
  //   hasEnvProjectId: !!process.env.CREGIS_WAAS_PROJECT_ID,
  //   hasEnvApiKey: !!process.env.CREGIS_WAAS_API_KEY,
  //   hasEnvGateway: !!process.env.CREGIS_GATEWAY_URL,
  //   gatewayUrl: WAAS_CONFIG.GATEWAY_URL
  // });
}

/**
 * Generate MD5 signature for Cregis API requests
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

  // console.log("🔐 [WaaS] Generating signature:", {
  //   paramsCount: filtered.length,
  //   sortedKeys: sorted.map(([k]) => k),
  // });

  // Generate MD5 hash in lowercase
  const signature = crypto
    .createHash("md5")
    .update(stringToSign)
    .digest("hex")
    .toLowerCase();

  return signature;
}

/**
 * Generate deposit address for receiving cryptocurrency
 * @param currency - Currency identifier (e.g., "195@TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t" for USDT-TRC20)
 * @param thirdPartyId - Unique identifier for this deposit
 * @param callbackUrl - Webhook URL for deposit notifications
 */
export async function generateDepositAddress({
  currency,
  thirdPartyId,
  callbackUrl,
}: {
  currency: string;
  thirdPartyId: string;
  callbackUrl: string;
}) {
  try {
    const pid = Number(WAAS_CONFIG.PROJECT_ID);
    const nonce = Math.random().toString(36).substring(2, 8);
    const timestamp = Date.now();

    const payload: Record<string, string | number> = {
      pid,
      currency,
      third_party_id: thirdPartyId,
      callback_url: callbackUrl,
      nonce,
      timestamp,
    };

    const sign = generateSignature(payload, WAAS_CONFIG.API_KEY);
    const requestData = { ...payload, sign };

    // console.log("📤 [WaaS] Generating deposit address:", {
    //   currency,
    //   thirdPartyId,
    //   gatewayUrl: WAAS_CONFIG.GATEWAY_URL,
    //   projectId: WAAS_CONFIG.PROJECT_ID,
    // });
    // console.log("📋 [WaaS] Full request payload:", JSON.stringify(requestData, null, 2));
    // console.log("📋 [WaaS] Request URL:", `${WAAS_CONFIG.GATEWAY_URL}/api/v1/address`);

    const response = await fetch(`${WAAS_CONFIG.GATEWAY_URL}/api/v1/address`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    // console.log("📥 [WaaS] Response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [WaaS] HTTP error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: `${WAAS_CONFIG.GATEWAY_URL}/api/v1/address`,
      });

      // Specific handling for 403
      if (response.status === 403) {
        console.error("💡 [WaaS] 403 Forbidden - Possible causes:");
        console.error("   1. IP not whitelisted (IP: check server IP)");
        console.error("   2. Invalid credentials (check PROJECT_ID and API_KEY)");
        console.error("   3. WaaS address generation not enabled for this project");
        console.error("   4. Endpoint requires different permissions");
        console.error("📝 [WaaS] Credentials being used:");
        console.error("   - PROJECT_ID:", WAAS_CONFIG.PROJECT_ID);
        console.error("   - API_KEY:", WAAS_CONFIG.API_KEY.substring(0, 8) + "...");
        console.error("   - GATEWAY_URL:", WAAS_CONFIG.GATEWAY_URL);
      }

      throw new Error(`Cregis WaaS API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    // console.log("📥 [WaaS] API response:", JSON.stringify(data, null, 2));

    if (data.code !== "00000") {
      const errorMessage = data.msg || "Unknown error";
      console.error("❌ [WaaS] API error:", {
        code: data.code,
        msg: errorMessage,
        data: data.data
      });
      throw new Error(`Cregis WaaS API error: ${errorMessage}`);
    }

    // console.log("✅ [WaaS] Deposit address generated successfully");

    return {
      success: true,
      data: {
        address: data.data?.address,
        memo: data.data?.memo,
        qrCode: data.data?.qr_code,
        thirdPartyId,
      },
    };
  } catch (error: unknown) {
    console.error("❌ [WaaS] Error generating deposit address:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Query transaction status
 * @param thirdPartyId - The third party ID used when generating address
 */
export async function queryTransaction(thirdPartyId: string) {
  try {
    const pid = Number(WAAS_CONFIG.PROJECT_ID);
    const nonce = Math.random().toString(36).substring(2, 8);
    const timestamp = Date.now();

    const payload: Record<string, string | number> = {
      pid,
      third_party_id: thirdPartyId,
      nonce,
      timestamp,
    };

    const sign = generateSignature(payload, WAAS_CONFIG.API_KEY);
    const requestData = { ...payload, sign };

    // console.log("📥 [WaaS] Querying transaction:", thirdPartyId);

    const response = await fetch(`${WAAS_CONFIG.GATEWAY_URL}/api/v1/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });

    if (!response.ok) {
      throw new Error(`Cregis WaaS API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== "00000") {
      throw new Error(`Cregis WaaS API error: ${data.msg}`);
    }

    return {
      success: true,
      data: data.data,
    };
  } catch (error: unknown) {
    console.error("❌ [WaaS] Error querying transaction:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Verify webhook callback signature
 * @param params - Callback parameters from Cregis
 * @param receivedSign - Signature received from Cregis
 */
export function verifyCallbackSignature(
  params: Record<string, unknown>,
  receivedSign: string
): boolean {
  const generatedSign = generateSignature(params, WAAS_CONFIG.API_KEY);
  return generatedSign.toLowerCase() === receivedSign.toLowerCase();
}

/**
 * Currency identifiers for WaaS
 */
export const WAAS_CURRENCIES = {
  USDT_TRC20: "195@TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t",
  TRX: "195@195",
  // Add more as needed
} as const;

