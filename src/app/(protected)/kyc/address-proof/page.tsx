"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { createKycRecord, updateAddressStatus, checkShuftiStatus, clearKycCache, getKycStatus, refreshKycStatus } from "@/services/kycService";

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
  // Ref to track if we're in a final state (verified/declined) - prevents status from reverting
  const isFinalStateRef = useRef(false);

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
          // IMPORTANT: Once verified or declined, never change it back
          if (data.isAddressVerified) {
            // Only set to verified if not already in a final state
            if (!isFinalStateRef.current) {
              setVerificationStatus("verified");
              isFinalStateRef.current = true; // Mark as final state
              dispatch(setAddressVerified(true));
              console.log("✅ Address is verified - showing success");
            }
          } else if (data.verificationStatus === 'Declined') {
            // Only set to declined if not already in final state
            if (!isFinalStateRef.current) {
              setVerificationStatus("declined");
              isFinalStateRef.current = true; // Mark as final state
              if (data.rejectionReason) {
                setDeclinedReason(data.rejectionReason);
              }
            }
          } else if (data.addressSubmittedAt && !data.isAddressVerified && !isFinalStateRef.current) {
            // Address is submitted but not yet verified - set to pending
            // ONLY if not already in a final state
            setVerificationStatus("pending");
            if (data.addressReference) {
              setVerificationReference(data.addressReference);
            }
          } else if (!data.addressSubmittedAt && !data.isAddressVerified && !isFinalStateRef.current) {
            // No address submitted yet - clear status
            // ONLY if not already in a final state
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

  // Check actual KYC status when on step 3, but only if not already in final state
  useEffect(() => {
    if (step === 3 && !isFinalStateRef.current) {
      const checkStatus = async () => {
        // Stop if we reached final state
        if (isFinalStateRef.current) {
          return;
        }

        try {
          const kycStatus = await getKycStatus(true); // Force refresh
          if (kycStatus.success && kycStatus.data) {
            const data = kycStatus.data;

            // NEVER override verified or declined status - these are final states
            if (isFinalStateRef.current) {
              return;
            }

            // Update verification status based on actual database state
            // For address proof: if address is verified, show success
            if (data.isAddressVerified) {
              if (!isFinalStateRef.current) {
                setVerificationStatus("verified");
                isFinalStateRef.current = true; // Mark as final state
                dispatch(setAddressVerified(true));
                clearKycCache();
                console.log("✅ Address is verified - showing success");
              }
              return; // Stop checking if already verified
            } else if (data.verificationStatus === 'Declined' || data.verificationStatus === 'Cancelled') {
              if (!isFinalStateRef.current) {
                setVerificationStatus("declined");
                isFinalStateRef.current = true; // Mark as final state
                if (data.rejectionReason) {
                  setDeclinedReason(data.rejectionReason);
                }
                clearKycCache();
              }
              return; // Stop checking if declined
            } else if (data.addressSubmittedAt && !data.isAddressVerified) {
              // Address is submitted but not yet verified - set to pending
              // Only update if not already in a final state
              if (!isFinalStateRef.current) {
                setVerificationStatus("pending");
                if (data.addressReference) {
                  setVerificationReference(data.addressReference);
                }
              }
            } else if (!data.addressSubmittedAt && !data.isAddressVerified) {
              // No address submitted yet - clear status only if not in final state
              if (!isFinalStateRef.current) {
                setVerificationStatus("");
              }
            }
          }
        } catch (error) {
          console.error("⚠️ Failed to check KYC status:", error);
        }
      };

      // Check immediately
      checkStatus();

      // Then check every 10 seconds while on step 3, but stop if we reach final state
      const interval = setInterval(() => {
        // Stop polling if we're in a final state
        if (isFinalStateRef.current) {
          clearInterval(interval);
          return;
        }
        checkStatus();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [step, dispatch]);

  // Poll for verification status when in pending state - Call Shufti API directly
  useEffect(() => {
    // Only poll if we're on step 3, status is pending, have a reference, and NOT already in final state
    if (step === 3 && verificationStatus === "pending" && verificationReference && !isFinalStateRef.current) {
      console.log("📊 Starting Shufti Pro status polling for address verification...");
      console.log("🔗 Reference:", verificationReference);

      // Poll every 10 seconds until accepted or declined
      let pollCount = 0;
      const maxPolls = 30; // 30 polls * 10 seconds = 5 minutes
      let invalidReferenceCount = 0;

      const pollInterval = setInterval(async () => {
        // Double-check we're still in pending state before polling
        // If status changed to verified/declined, stop immediately
        if (isFinalStateRef.current) {
          console.log("🛑 Status changed to final state, stopping polling");
          clearInterval(pollInterval);
          return;
        }

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
              // ✅ Shufti accepted - show verified (ONLY if not already in final state)
              if (!isFinalStateRef.current) {
                // Stop polling immediately
                clearInterval(pollInterval);
                isFinalStateRef.current = true; // Mark as final state

                // Update database first
                try {
                  console.log("💾 Saving verification status to database...");
                  await updateAddressStatus({
                    addressReference: verificationReference,
                    isAddressVerified: true
                  });
                  console.log("✅ Status saved to database");
                } catch (error) {
                  console.error("⚠️ Failed to save status to database:", error);
                  // Continue anyway - webhook might update it
                }

                // Update UI state
                setVerificationStatus("verified");
                dispatch(setAddressVerified(true));

                // Clear cache and refresh status from database
                clearKycCache();
                try {
                  const refreshedStatus = await refreshKycStatus();
                  if (refreshedStatus.success && refreshedStatus.data) {
                    console.log("✅ UI refreshed with database status:", refreshedStatus.data);
                  }
                } catch (error) {
                  console.error("⚠️ Failed to refresh status:", error);
                }

                toast.success("Address verification completed successfully!");
                console.log("✅ Verification accepted! Stopped polling and saved to database.");
              }

            } else if (event === "verification.declined") {
              // ❌ Shufti declined - show declined (ONLY if not already verified)
              if (!isFinalStateRef.current) {
                // Stop polling immediately
                clearInterval(pollInterval);
                isFinalStateRef.current = true; // Mark as final state

                const reason = shuftiResponse.data.declined_reason || "Verification was declined";

                // Update database first
                try {
                  console.log("💾 Saving declined status to database...");
                  await updateAddressStatus({
                    addressReference: verificationReference,
                    isAddressVerified: false
                  });
                  console.log("✅ Declined status saved to database");
                } catch (error) {
                  console.error("⚠️ Failed to save declined status to database:", error);
                  // Continue anyway - webhook might update it
                }

                // Update UI state
                setVerificationStatus("declined");
                setDeclinedReason(reason);

                // Clear cache and refresh status from database
                clearKycCache();
                try {
                  const refreshedStatus = await refreshKycStatus();
                  if (refreshedStatus.success && refreshedStatus.data) {
                    console.log("✅ UI refreshed with database status:", refreshedStatus.data);
                    // Update declined reason from database if available
                    if (refreshedStatus.data.rejectionReason) {
                      setDeclinedReason(refreshedStatus.data.rejectionReason);
                    }
                  }
                } catch (error) {
                  console.error("⚠️ Failed to refresh status:", error);
                }

                toast.error("Address verification was declined. Please try again.");
                console.log("❌ Verification declined! Stopped polling and saved to database.");
              }

            } else if (event === "request.pending" || event === "request.received") {
              // ⏳ Still pending - continue polling (only if still in pending state)
              if (!isFinalStateRef.current) {
                console.log("⏳ Still pending, will check again in 10 seconds...");
                // Reset invalid reference counter on successful pending response
                invalidReferenceCount = 0;
              } else {
                // Status changed, stop polling
                clearInterval(pollInterval);
              }
            } else if (event === "request.invalid" || event === "request.timeout" || event === "request.unauthorized" || event === "request.expired") {
              // ❌ Terminal error event - stop polling and allow retry
              if (!isFinalStateRef.current) {
                clearInterval(pollInterval);
                isFinalStateRef.current = true;

                const errorMsg = event === "request.invalid" ? "Invalid verification request. Please check your document and try again." :
                  event === "request.timeout" ? "Verification request timed out. Please try again." :
                    "Verification request failed. Please try again.";

                setVerificationStatus("declined");
                setDeclinedReason(errorMsg);
                toast.error(errorMsg);
                console.log(`❌ Terminal Shufti event: ${event}. Stopped polling.`);
              }
            } else {
              // 🤷 Unknown event - continue polling but log it (only if still pending)
              if (!isFinalStateRef.current) {
                console.log(`🤷 Unknown event: ${event} - Continuing to poll...`);
              } else {
                clearInterval(pollInterval);
              }
            }
          }
        } catch (error: any) {
          console.error("⚠️ Error polling Shufti status:", error);

          // Stop polling if we're no longer in pending state
          if (isFinalStateRef.current) {
            clearInterval(pollInterval);
            return;
          }

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

              // Show error and allow user to retry (only if not already verified)
              if (!isFinalStateRef.current) {
                setDeclinedReason("Verification submission failed. Please try again.");
                toast.error("Verification submission failed. Please resubmit your documents.");
                setStep(1); // Go back to start
              }
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
        isFinalStateRef.current = true; // Mark as final state

        // Update database first
        try {
          console.log("💾 Saving verification status to database...");
          await updateAddressStatus({
            addressReference: reference,
            isAddressVerified: true
          });
          console.log("✅ Status saved to database");
        } catch (error) {
          console.error("⚠️ Failed to save status to database:", error);
          // Continue anyway - webhook might update it
        }

        // Update UI state
        setVerificationStatus("verified");
        dispatch(setAddressVerified(true));

        // Clear cache and refresh status from database
        clearKycCache();
        try {
          const refreshedStatus = await refreshKycStatus();
          if (refreshedStatus.success && refreshedStatus.data) {
            console.log("✅ UI refreshed with database status:", refreshedStatus.data);
          }
        } catch (error) {
          console.error("⚠️ Failed to refresh status:", error);
        }

        toast.success("Address verification completed successfully!");
      } else if (addressVerificationResult.event === "verification.declined") {
        // ❌ Shufti explicitly declined - show as declined
        isFinalStateRef.current = true; // Mark as final state
        const reason = addressVerificationResult?.declined_reason || "Please check your document and try again.";

        // Update database first
        try {
          console.log("💾 Saving declined status to database...");
          await updateAddressStatus({
            addressReference: reference,
            isAddressVerified: false
          });
          console.log("✅ Declined status saved to database");
        } catch (error) {
          console.error("⚠️ Failed to save declined status to database:", error);
          // Continue anyway - webhook might update it
        }

        // Update UI state
        setVerificationStatus("declined");
        setDeclinedReason(reason);

        // Clear cache and refresh status from database
        clearKycCache();
        try {
          const refreshedStatus = await refreshKycStatus();
          if (refreshedStatus.success && refreshedStatus.data) {
            console.log("✅ UI refreshed with database status:", refreshedStatus.data);
            // Update declined reason from database if available
            if (refreshedStatus.data.rejectionReason) {
              setDeclinedReason(refreshedStatus.data.rejectionReason);
            }
          }
        } catch (error) {
          console.error("⚠️ Failed to refresh status:", error);
        }

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
