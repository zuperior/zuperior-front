"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import StepProgress from "./_components/StepProgress";
import PersonalInfoStep from "./_components/PersonalInfoStep";
import AddressVerificationStep from "./_components/AddressVerificationStep";
import VerificationInProgressStep from "./_components/VerificationInProgressStep";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { addressVerification } from "@/services/addressVerification";
import { AddressKYCResponse } from "@/types/kyc";
import { setAddressVerified } from "@/store/slices/kycSlice";
import { useAppDispatch } from "@/store/hooks";
import { createKycRecord, updateAddressStatus, checkShuftiStatus, clearKycCache, getKycStatus } from "@/services/kycService";
import { useEffect } from "react";

export default function AddressVerificationPage() {
  const [step, setStep] = useState(1);
  const user = useSelector((state: RootState) => state.user.data);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Make fields editable by using state (safe parse of accountname)
  const fullName = (user?.accountname ?? '').trim();
  const nameParts = fullName ? fullName.split(/\s+/).filter(Boolean) : [];
  const initialFirst = nameParts[0] || '';
  const initialLast = nameParts.slice(1).join(' ') || '';
  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [documentType, setDocumentType] = useState("");
  const [verificationStatus, setVerificationStatus] = useState("");
  const [declinedReason, setDeclinedReason] = useState("");
  const [verificationReference, setVerificationReference] = useState("");
  const dispatch = useAppDispatch();

  // Create KYC record and check actual status on component mount
  useEffect(() => {
    const initKyc = async () => {
      try {
        const result = await createKycRecord();
        if (result.success) {
          console.log("✅ KYC record ready:", result.message);
        }
      } catch (error) {
        console.log("⚠️ KYC initialization issue:", error);
        // Don't show error to user - this is not critical
      }

      // Check actual KYC status from database
      try {
        const kycStatus = await getKycStatus(true); // Force refresh
        if (kycStatus.success && kycStatus.data) {
          const data = kycStatus.data;
          
          // Update verification status based on actual database state
          // For address proof: if address is verified, show success
          if (data.isAddressVerified) {
            setVerificationStatus("verified");
            dispatch(setAddressVerified(true));
            console.log("✅ Address is verified - showing success");
          } else if (data.verificationStatus === 'Declined') {
            setVerificationStatus("declined");
            if (data.rejectionReason) {
              setDeclinedReason(data.rejectionReason);
            }
          } else if (data.addressSubmittedAt && !data.isAddressVerified) {
            // Address is submitted but not yet verified - set to pending
            setVerificationStatus("pending");
            if (data.addressReference) {
              setVerificationReference(data.addressReference);
            }
          } else if (!data.addressSubmittedAt && !data.isAddressVerified) {
            // No address submitted yet - clear status
            setVerificationStatus("");
          }
          
          console.log("📊 Loaded KYC status from database:", {
            isAddressVerified: data.isAddressVerified,
            verificationStatus: data.verificationStatus,
            addressSubmittedAt: data.addressSubmittedAt
          });
        }
      } catch (error) {
        console.error("⚠️ Failed to load KYC status:", error);
      }
    };
    initKyc();
  }, [dispatch]);

  // Check actual KYC status when on step 3, regardless of local state
  useEffect(() => {
    if (step === 3) {
      const checkStatus = async () => {
        try {
          const kycStatus = await getKycStatus(true); // Force refresh
          if (kycStatus.success && kycStatus.data) {
            const data = kycStatus.data;
            
            // Update verification status based on actual database state
            // For address proof: if address is verified, show success
            if (data.isAddressVerified) {
              setVerificationStatus("verified");
              dispatch(setAddressVerified(true));
              console.log("✅ Address is verified - showing success");
              return; // Stop checking if already verified
            } else if (data.verificationStatus === 'Declined') {
              setVerificationStatus("declined");
              if (data.rejectionReason) {
                setDeclinedReason(data.rejectionReason);
              }
              return; // Stop checking if declined
            } else if (data.addressSubmittedAt && !data.isAddressVerified) {
              // Address is submitted but not yet verified - set to pending
              setVerificationStatus("pending");
              if (data.addressReference) {
                setVerificationReference(data.addressReference);
              }
            } else if (!data.addressSubmittedAt && !data.isAddressVerified) {
              // No address submitted yet - clear status
              setVerificationStatus("");
            }
          }
        } catch (error) {
          console.error("⚠️ Failed to check KYC status:", error);
        }
      };
      
      // Check immediately
      checkStatus();
      
      // Then check every 10 seconds while on step 3
      // The checkStatus function will stop updating if already verified/declined
      const interval = setInterval(() => {
        checkStatus();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [step, dispatch]);

  // Poll for verification status when in pending state - Call Shufti API directly
  useEffect(() => {
    if (step === 3 && verificationStatus === "pending" && verificationReference) {
      console.log("📊 Starting Shufti Pro status polling for address verification...");
      console.log("🔗 Reference:", verificationReference);
      
      // Poll every 10 seconds until accepted or declined
      let pollCount = 0;
      const maxPolls = 30; // 30 polls * 10 seconds = 5 minutes
      let invalidReferenceCount = 0;
      
      const pollInterval = setInterval(async () => {
        pollCount++;
        
        try {
          // Call Shufti Pro API directly to get real-time status
          console.log(`🔍 Poll ${pollCount}/${maxPolls} - Checking Shufti Pro API...`);
          const shuftiResponse = await checkShuftiStatus(verificationReference);
          
          if (shuftiResponse.success && shuftiResponse.data) {
            const event = shuftiResponse.data.event;
            const isAddress = shuftiResponse.data.isAddress;
            
            console.log(`📊 Poll ${pollCount}/${maxPolls} - Shufti Event: ${event}, IsAddress: ${isAddress}`);
            
            // Check if verification is complete
            if (event === "verification.accepted") {
              // ✅ Shufti accepted - show verified
              setVerificationStatus("verified");
              dispatch(setAddressVerified(true));
              // Clear cache immediately when status changes
              clearKycCache();
              toast.success("Address verification completed successfully!");
              clearInterval(pollInterval);
              console.log("✅ Verification accepted! Stopped polling.");
              
            } else if (event === "verification.declined") {
              // ❌ Shufti declined - show declined
              setVerificationStatus("declined");
              const reason = shuftiResponse.data.declined_reason || "Verification was declined";
              setDeclinedReason(reason);
              // Clear cache when status changes
              clearKycCache();
              toast.error("Address verification was declined. Please try again.");
              clearInterval(pollInterval);
              console.log("❌ Verification declined! Stopped polling.");
              
            } else if (event === "request.pending" || event === "request.received") {
              // ⏳ Still pending - continue polling
              console.log("⏳ Still pending, will check again in 10 seconds...");
              // Reset invalid reference counter on successful pending response
              invalidReferenceCount = 0;
              
            } else {
              // 🤷 Unknown event - continue polling but log it
              console.log(`🤷 Unknown event: ${event} - Continuing to poll...`);
            }
          }
        } catch (error: any) {
          console.error("⚠️ Error polling Shufti status:", error);
          
          // Check if error is "invalid reference"
          const errorData = error?.response?.data;
          const isInvalidReference = 
            errorData?.error?.key === 'reference' ||
            errorData?.error?.message?.includes('invalid') ||
            errorData?.event === 'request.invalid';
          
          if (isInvalidReference) {
            invalidReferenceCount++;
            console.warn(`⚠️ Invalid reference detected (${invalidReferenceCount}/3)`);
            
            // If we get invalid reference 3 times in a row, the submission failed
            if (invalidReferenceCount >= 3) {
              console.error("❌ Reference is invalid. The initial submission likely failed.");
              
              // Show error and allow user to retry
              setDeclinedReason("Verification submission failed. Please try again.");
              toast.error("Verification submission failed. Please resubmit your documents.");
              setStep(1); // Go back to start
              clearInterval(pollInterval);
              return;
            }
          }
          // Don't stop polling on other errors - Shufti might be temporarily unavailable
        }
        
        // Stop polling after max attempts
        if (pollCount >= maxPolls) {
          console.log("⏱️ Status polling timeout - verification still pending after 5 minutes");
          toast.info("Verification is taking longer than expected. You'll receive an email when it's complete.");
          clearInterval(pollInterval);
        }
      }, 10000); // Poll every 10 seconds
      
      // Cleanup interval on unmount or when status changes
      return () => {
        console.log("🛑 Stopping Shufti Pro status polling");
        clearInterval(pollInterval);
      };
    }
  }, [step, verificationStatus, verificationReference, dispatch]);

  const nextStep = () => {
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (!file || !documentType) {
      toast.error("Please upload a document and select document type");
      return;
    }

    setIsLoading(true);
    toast("Submitting your address for verification...");
    nextStep();

    try {
      const addressVerificationResult: AddressKYCResponse =
        await addressVerification({
          file,
          first_name: firstName,
          last_name: lastName,
          full_address: address,
          selected_document_type: documentType,
        });

      // Backend already stores the addressReference during submission via submitAddress
      // Status updates will come via webhook from Shufti
      // Only update UI status based on Shufti response event
      
      const reference = addressVerificationResult.reference;
      
      if (!reference) {
        console.error("❌ No reference returned from address verification");
        setVerificationStatus("pending"); // Changed from "declined" to "pending"
        toast.warning("Verification submitted but reference was not received. Please check your KYC status later.");
        return;
      }

      // Store reference for polling
      setVerificationReference(reference);
      console.log("🔗 Stored verification reference:", reference);

      // Handle different Shufti verification events
      // Reference: https://docs.shuftipro.com/on-premise/api/status-codes
      console.log(`📊 Shufti Event Received: ${addressVerificationResult.event}`);
      
      if (addressVerificationResult.event === "verification.accepted") {
        // ✅ Shufti accepted - verification successful
        setVerificationStatus("verified");
        dispatch(setAddressVerified(true));
        // Clear cache immediately when status changes
        clearKycCache();
        toast.success("Address verification completed successfully!");
      } else if (addressVerificationResult.event === "verification.declined") {
        // ❌ Shufti explicitly declined - show as declined
        setVerificationStatus("declined");
        const reason = addressVerificationResult?.declined_reason || "Please check your document and try again.";
        setDeclinedReason(reason);
        // Clear cache when status changes
        clearKycCache();
        toast.error(`Address verification was declined: ${reason}`);
      } else if (addressVerificationResult.event === "request.pending" || addressVerificationResult.event === "request.received") {
        // ⏳ Verification in progress - keep polling, DO NOT show as declined!
        setVerificationStatus("pending");
        toast.success("Address submitted for verification. We're checking status every 10 seconds. This typically takes 30-60 seconds.");
        console.log("⏳ Status: PENDING - Will continue polling every 10 seconds");
      } else if (addressVerificationResult.event === "request.timeout") {
        // ⏱️ Request timed out - but verification might still be processing
        setVerificationStatus("pending");
        toast.warning("Verification request is taking longer than usual. We'll keep checking for updates.");
        console.log("⏱️ Status: TIMEOUT - Continuing to poll for updates");
      } else if (addressVerificationResult.event === "request.invalid") {
        // ⚠️ Request invalid - might be a configuration issue
        setVerificationStatus("pending");
        toast.warning("Verification request encountered an issue. We'll keep checking for updates.");
        console.log("⚠️ Status: INVALID - Continuing to poll for updates");
      } else {
        // 🤷 Unknown event - default to pending (safe approach)
        setVerificationStatus("pending");
        toast.info("Verification submitted. We'll notify you when it's complete.");
        console.log(`🤷 Unknown event: ${addressVerificationResult.event} - Defaulting to pending`);
      }

      // Set declined reason if available (but don't change status if not explicitly declined)
      if (addressVerificationResult?.declined_reason && addressVerificationResult.event === "verification.declined") {
        setDeclinedReason(addressVerificationResult.declined_reason);
      }
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to submit address. Please try again.",
        { id: "address-submission" }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <PersonalInfoStep
            firstName={firstName}
            lastName={lastName}
            phoneNumber={phoneNumber}
            userCountry={user?.account_bill_ads_general?.bill_country || user?.country || ""}
            setFirstName={setFirstName}
            setLastName={setLastName}
            setPhoneNumber={setPhoneNumber}
            setAddress={setAddress}
            onNext={nextStep}
            address={address}
          />
        );
      case 2:
        return (
          <AddressVerificationStep
            documentType={documentType}
            file={file}
            isDragging={isDragging}
            isLoading={isLoading}
            setDocumentType={setDocumentType}
            setFile={setFile}
            setIsDragging={setIsDragging}
            onSubmit={handleSubmit}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <VerificationInProgressStep
            onNext={nextStep}
            onBack={prevStep}
            isLoading={isLoading}
            verificationStatus={verificationStatus}
            declinedReason={declinedReason}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="dark:bg-[#01040D] bg-[#FFFFFF] h-full">
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl text-center font-bold dark:text-[#FFFFFF] text-[#000000]">
            Address Verification
          </h1>
          <StepProgress currentStep={step} />
        </div>

        {renderStepContent()}
      </div>
    </div>
  );
}
