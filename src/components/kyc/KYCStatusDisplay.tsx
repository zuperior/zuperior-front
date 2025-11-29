"use client";

import { useEffect, useState } from "react";
import { getKycStatus, getLocalKycStatus } from "@/services/kycService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, XCircle, AlertCircle, FileText, Home } from "lucide-react";

interface KYCData {
  id: string;
  userId: string;
  isDocumentVerified: boolean;
  isAddressVerified: boolean;
  verificationStatus: string;
  documentReference: string | null;
  addressReference: string | null;
  documentSubmittedAt: string | null;
  addressSubmittedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

interface KYCStatusResponse {
  success: boolean;
  message: string;
  data: KYCData;
}

export function KYCStatusDisplay() {
  // Initialize with cached data if available
  const [kycData, setKycData] = useState<KYCData | null>(() => {
    const cached = getLocalKycStatus();
    return cached?.data || null;
  });
  const [loading, setLoading] = useState(!kycData);
  const [error, setError] = useState<string | null>(null);

  const fetchKYCStatus = async () => {
    try {
      const response = await getKycStatus();

      if (response.success && response.data) {
        setKycData(response.data);
        setError(null);
      } else {
        setError(response.message || 'Failed to fetch KYC status');
      }
    } catch (err) {
      console.error('Error fetching KYC status:', err);
      setError('Failed to load KYC status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch immediately
    fetchKYCStatus();

    // Poll every 30 seconds for updates
    const interval = setInterval(fetchKYCStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getOverallStatus = () => {
    if (!kycData) return { color: 'gray', icon: AlertCircle, text: 'Unknown', bgColor: 'bg-gray-100', textColor: 'text-gray-700' };

    // ONLY show green when BOTH document and address are verified
    if (
      kycData.verificationStatus === 'Verified' &&
      kycData.isDocumentVerified === true &&
      kycData.isAddressVerified === true
    ) {
      return {
        color: 'green',
        icon: CheckCircle2,
        text: 'Fully Verified',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700'
      };
    }

    // Show yellow for pending (not failed)
    if (
      kycData.verificationStatus === 'Pending' ||
      kycData.verificationStatus === 'Partially Verified'
    ) {
      return {
        color: 'yellow',
        icon: Clock,
        text: 'Pending Verification',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700'
      };
    }

    // Show red for declined (NOT for pending)
    if (kycData.verificationStatus === 'Declined') {
      return {
        color: 'red',
        icon: XCircle,
        text: 'Verification Declined',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700'
      };
    }

    // Default - not verified yet
    return {
      color: 'gray',
      icon: AlertCircle,
      text: 'Not Verified',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700'
    };
  };

  // Check if user can upload document
  const canUploadDocument = () => {
    return !kycData?.isDocumentVerified && kycData?.verificationStatus !== 'Pending';
  };

  // Check if user can upload address (document must be pending or verified)
  const canUploadAddress = () => {
    if (!kycData) return false;

    // Can upload address if:
    // 1. Document is verified, OR
    // 2. Document verification is pending (submitted)
    return (kycData.isDocumentVerified || kycData.documentSubmittedAt !== null) &&
      !kycData.isAddressVerified;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KYC Verification Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3">Loading...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !kycData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KYC Verification Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 p-4 bg-red-50 rounded-md">
            {error || 'No KYC data available'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const overallStatus = getOverallStatus();
  const StatusIcon = overallStatus.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle>KYC Verification Status</CardTitle>
        <CardDescription>Your identity verification progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Status Badge */}
        <div className={`p-4 rounded-lg ${overallStatus.bgColor} flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <StatusIcon className={`h-6 w-6 ${overallStatus.textColor}`} />
            <div>
              <div className={`font-semibold ${overallStatus.textColor}`}>
                {overallStatus.text}
              </div>
              <div className="text-sm text-gray-600">
                {kycData.verificationStatus}
              </div>
            </div>
          </div>
        </div>

        {/* Document Verification Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-gray-600" />
            <div>
              <div className="font-medium">Identity Document</div>
              <div className="text-sm text-gray-500">
                {kycData.isDocumentVerified
                  ? 'Verified'
                  : kycData.documentSubmittedAt
                    ? 'Pending verification'
                    : 'Not submitted'}
              </div>
            </div>
          </div>
          <Badge variant={kycData.isDocumentVerified ? "default" : kycData.documentSubmittedAt ? "secondary" : "outline"}>
            {kycData.isDocumentVerified ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            ) : kycData.documentSubmittedAt ? (
              <span className="flex items-center gap-1 text-yellow-600">
                <Clock className="h-3 w-3" />
                Pending
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Required
              </span>
            )}
          </Badge>
        </div>

        {/* Address Verification Status */}
        <div className={`flex items-center justify-between p-3 rounded-lg ${canUploadAddress() ? 'bg-gray-50' : 'bg-gray-100 opacity-60'
          }`}>
          <div className="flex items-center gap-3">
            <Home className="h-5 w-5 text-gray-600" />
            <div>
              <div className="font-medium">Address Proof</div>
              <div className="text-sm text-gray-500">
                {kycData.isAddressVerified
                  ? 'Verified'
                  : kycData.addressSubmittedAt
                    ? 'Pending verification'
                    : !canUploadAddress()
                      ? 'Complete document verification first'
                      : 'Not submitted'}
              </div>
            </div>
          </div>
          <Badge variant={kycData.isAddressVerified ? "default" : kycData.addressSubmittedAt ? "secondary" : "outline"}>
            {kycData.isAddressVerified ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Verified
              </span>
            ) : kycData.addressSubmittedAt ? (
              <span className="flex items-center gap-1 text-yellow-600">
                <Clock className="h-3 w-3" />
                Pending
              </span>
            ) : canUploadAddress() ? (
              <span className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Required
              </span>
            ) : (
              <span className="flex items-center gap-1 text-gray-500">
                <AlertCircle className="h-3 w-3" />
                Locked
              </span>
            )}
          </Badge>
        </div>

        {/* Rejection Reason (if any) */}
        {kycData.rejectionReason && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <div className="font-semibold text-red-700">Verification Declined</div>
                <div className="text-sm text-red-600 mt-1">
                  {kycData.rejectionReason}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Message (only when fully verified) */}
        {kycData.verificationStatus === 'Verified' &&
          kycData.isDocumentVerified &&
          kycData.isAddressVerified && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-green-700">Verification Complete!</div>
                  <div className="text-sm text-green-600 mt-1">
                    Your account is fully verified and ready to use all features.
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Upload Instructions */}
        {!kycData.isDocumentVerified || !kycData.isAddressVerified ? (
          <div className="text-sm text-gray-600 border-t pt-4 mt-4">
            <div className="font-medium mb-2">Next Steps:</div>
            <ul className="list-disc list-inside space-y-1">
              {canUploadDocument() && (
                <li className="text-blue-600 font-medium">
                  You can now upload your identity document (ID, passport, or driver's license)
                </li>
              )}
              {kycData.documentSubmittedAt && !kycData.isDocumentVerified && (
                <li className="text-yellow-600">
                  Your identity document is being verified (1-5 minutes)
                </li>
              )}
              {canUploadAddress() && (
                <li className="text-blue-600 font-medium">
                  You can now upload your address proof (utility bill, bank statement, or rent agreement)
                </li>
              )}
              {kycData.addressSubmittedAt && !kycData.isAddressVerified && (
                <li className="text-yellow-600">
                  Your address proof is being verified (1-5 minutes)
                </li>
              )}
              {!canUploadAddress() && !kycData.isDocumentVerified && !kycData.documentSubmittedAt && (
                <li>Upload your identity document first before submitting address proof</li>
              )}
              <li>This page updates automatically every 30 seconds</li>
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

