import { useEffect, useState } from 'react';
import { getKycStatus, getLocalKycStatus } from '@/services/kycService';

interface KYCData {
  isDocumentVerified: boolean;
  isAddressVerified: boolean;
  verificationStatus: string;
  documentSubmittedAt: string | null;
  addressSubmittedAt: string | null;
}

interface KYCPermissions {
  canUploadDocument: boolean;
  canUploadAddress: boolean;
  documentStatus: 'not-submitted' | 'pending' | 'verified' | 'declined';
  addressStatus: 'not-submitted' | 'pending' | 'verified' | 'declined' | 'locked';
  isFullyVerified: boolean;
  loading: boolean;
}

/**
 * Hook to check KYC upload permissions
 * 
 * Rules:
 * - Can upload document: When not verified and not pending
 * - Can upload address: When document is pending OR verified (but address not verified)
 */
export function useKYCPermissions(): KYCPermissions {
  // Initialize with cached data if available
  const [kycData, setKycData] = useState<KYCData | null>(() => {
    const cached = getLocalKycStatus();
    return cached?.data || null;
  });
  const [loading, setLoading] = useState(!kycData);

  useEffect(() => {
    const fetchKYCStatus = async () => {
      try {
        const response = await getKycStatus();

        if (response.success && response.data) {
          setKycData(response.data);
        }
      } catch (error) {
        console.error('Error fetching KYC status:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKYCStatus();

    // Poll every 30 seconds
    const interval = setInterval(fetchKYCStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  // Determine document status
  const getDocumentStatus = (): KYCPermissions['documentStatus'] => {
    if (!kycData) return 'not-submitted';

    if (kycData.isDocumentVerified) return 'verified';
    if (kycData.verificationStatus === 'Declined') return 'declined';
    if (kycData.documentSubmittedAt) return 'pending';
    return 'not-submitted';
  };

  // Determine address status
  const getAddressStatus = (): KYCPermissions['addressStatus'] => {
    if (!kycData) return 'not-submitted';

    if (kycData.isAddressVerified) return 'verified';
    if (kycData.verificationStatus === 'Declined') return 'declined';
    if (kycData.addressSubmittedAt) return 'pending';

    // Check if locked (document not submitted or not pending/verified)
    if (!kycData.isDocumentVerified && !kycData.documentSubmittedAt) {
      return 'locked';
    }

    return 'not-submitted';
  };

  // Check if user can upload document
  const canUploadDocument = (): boolean => {
    if (!kycData) return true; // Allow upload if no data yet

    // Can upload if:
    // 1. Not verified yet
    // 2. Not currently pending
    // 3. Not declined (allow reupload if declined)
    return !kycData.isDocumentVerified &&
      kycData.verificationStatus !== 'Pending' &&
      !kycData.documentSubmittedAt;
  };

  // Check if user can upload address
  const canUploadAddress = (): boolean => {
    if (!kycData) return false;

    // Can upload address if:
    // 1. Document is verified OR document is pending (submitted)
    // 2. Address is not verified yet
    // 3. Address is not currently pending
    const documentOk = kycData.isDocumentVerified || kycData.documentSubmittedAt !== null;
    const addressNotDone = !kycData.isAddressVerified && !kycData.addressSubmittedAt;

    return documentOk && addressNotDone;
  };

  // Check if fully verified
  const isFullyVerified = (): boolean => {
    if (!kycData) return false;

    return kycData.verificationStatus === 'Verified' &&
      kycData.isDocumentVerified &&
      kycData.isAddressVerified;
  };

  return {
    canUploadDocument: canUploadDocument(),
    canUploadAddress: canUploadAddress(),
    documentStatus: getDocumentStatus(),
    addressStatus: getAddressStatus(),
    isFullyVerified: isFullyVerified(),
    loading
  };
}

