// KYC Service - Handles KYC verification operations
import axios from "axios";

// Create axios instance for KYC operations
const kycApi = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Add token interceptor
kycApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface UpdateKycResponse {
  status: string;
  status_code: string;
}

interface KycStatusResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    isDocumentVerified: boolean;
    isAddressVerified: boolean;
    verificationStatus: string;
    documentReference?: string;
    addressReference?: string;
    amlReference?: string;
    documentSubmittedAt?: string;
    addressSubmittedAt?: string;
    rejectionReason?: string;
  };
}

// Create KYC record
export async function createKycRecord() {
  try {
    console.log('📝 Creating KYC record...');
    const response = await kycApi.post('/api/kyc/create-record');
    console.log('✅ KYC record created:', response.data);
    return response.data;
  } catch (error: any) {
    // If KYC record already exists, that's fine - return success
    if (error.response?.status === 200 && error.response?.data?.success) {
      console.log('✅ KYC record already exists');
      return error.response.data;
    }
    console.error("❌ Error creating KYC record:", error?.response?.data || error.message);
    throw error;
  }
}

// Update document verification status
export async function updateDocumentStatus(data: {
  documentReference: string;
  isDocumentVerified: boolean;
  amlReference?: string;
}) {
  try {
    console.log('📝 Updating document status:', data);
    const response = await kycApi.put('/api/kyc/update-document', data);
    console.log('✅ Document status updated:', response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Error updating document status:", error?.response?.data || error.message);
    throw error;
  }
}

// Update address verification status
export async function updateAddressStatus(data: {
  addressReference: string;
  isAddressVerified: boolean;
}) {
  try {
    console.log('📝 Updating address status:', data);
    const response = await kycApi.put('/api/kyc/update-address', data);
    console.log('✅ Address status updated:', response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Error updating address status:", error?.response?.data || error.message);
    throw error;
  }
}

// Get KYC status
export async function getKycStatus(): Promise<KycStatusResponse> {
  try {
    console.log('🔍 Fetching KYC status...');
    const response = await kycApi.get<KycStatusResponse>(`/api/kyc/status?t=${Date.now()}`);
    console.log('✅ KYC status fetched:', {
      isDocumentVerified: response.data.data?.isDocumentVerified,
      isAddressVerified: response.data.data?.isAddressVerified,
      verificationStatus: response.data.data?.verificationStatus
    });
    return response.data;
  } catch (error: any) {
    // If no KYC record exists (404) or any other error, return default KYC state
    console.log("ℹ️ No KYC record found or error fetching KYC status, returning defaults");

    // Return a valid response structure with default values
    return {
      success: true,
      message: 'No KYC record found',
      data: {
        id: '',
        isDocumentVerified: false,
        isAddressVerified: false,
        verificationStatus: 'unverified'
      }
    };
  }
}

// Refresh KYC status and return updated data
export async function refreshKycStatus(): Promise<KycStatusResponse> {
  console.log('🔄 Refreshing KYC status...');
  return getKycStatus();
}

// Check verification status directly from Shufti Pro API
export async function checkShuftiStatus(reference: string) {
  try {
    console.log('🔍 Checking Shufti Pro status for reference:', reference);
    const response = await kycApi.post('/api/kyc/check-status', { reference });
    console.log('✅ Shufti Pro status response:', {
      reference,
      event: response.data.data?.event
    });
    return response.data;
  } catch (error: any) {
    const errorData = error?.response?.data;

    // Check if it's an invalid reference error
    const isInvalidReference =
      errorData?.error?.key === 'reference' ||
      errorData?.error?.message?.includes('invalid') ||
      errorData?.event === 'request.invalid';

    if (isInvalidReference) {
      console.error("❌ Invalid Shufti reference:", {
        reference,
        error: errorData?.error?.message || 'Reference not found in Shufti Pro',
        hint: 'The verification request may not have reached Shufti Pro. User may need to resubmit.'
      });
    } else {
      console.error("❌ Error checking Shufti status:", errorData || error.message);
    }

    throw error;
  }
}

// Legacy function - kept for backward compatibility
export async function updateKycStatus(
  email: string,
  accessToken: string,
  verificationStatus: "Partially Verified" | "Verified"
): Promise<UpdateKycResponse | null> {
  try {
    const response = await axios.post<UpdateKycResponse>("/api/kyc", {
      email,
      accessToken,
      verificationStatus,
    });

    return response.data;
  } catch (error: any) {
    console.error("Error updating KYC status:", error?.response?.data || error.message);
    return null;
  }
}
