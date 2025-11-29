"use client";

import React, { useState } from "react";
import { toast } from "sonner";
import StepProgress from "./_components/StepProgress";
import PersonalInfoStep from "./_components/PersonalInfoStep";
import DocumentVerificationStep from "./_components/DocumentVerificationStep";
import VerificationInProgressStep from "./_components/VerificationInProgressStep";

import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { documentVerification } from "@/services/documentVerification";
import { AMLResponse, DocumentKYCResponse } from "@/types/kyc";
import { amlVerification } from "@/services/amlVerification";
import { useAppDispatch } from "@/store/hooks";
import { setDocumentVerified } from "@/store/slices/kycSlice";
import { createKycRecord, updateDocumentStatus, checkShuftiStatus, clearKycCache } from "@/services/kycService";
import { useEffect } from "react";

/* interface VerificationResult {
  kycSuccess: boolean;
  amlSuccess: boolean;
  kycReference: string;
  amlReference: string;
  extractedData?: {
    dob?: string;
    documentNumber?: string;
    fullName?: string;
  };
} */

export default function VerifyPage() {
  const [step, setStep] = useState(1);
  const user = useSelector((state: RootState) => state.user.data)
  const country = user?.account_bill_ads_general?.bill_country;
  const [documentType, setDocumentType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Make fields editable by using state
  const [firstName, setFirstName] = useState(user?.accountname?.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user?.accountname?.split(" ")[1] || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone || "");
  const [selectedCountry, setSelectedCountry] = useState(country || "");
  const [isLoading, setIsLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState("");
  const [declinedReason, setDeclinedReason] = useState<string | null>(null);
  const [pendingReference, setPendingReference] = useState<string>("");
  const dispatch = useAppDispatch();

  // Create KYC record on component mount
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
    };
    initKyc();
  }, []);

  const nextStep = () => {
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  // Poll Shufti status when AML is pending, to auto-update UI without reload
  useEffect(() => {
    if (step === 3 && verificationStatus === "pending" && pendingReference) {
      let pollCount = 0;
      const maxPolls = 30; // ~5 minutes at 10s interval
      let invalidRefCount = 0;

      const interval = setInterval(async () => {
        pollCount++;
        try {
          const resp = await checkShuftiStatus(pendingReference);
          const event = resp?.data?.event;

          if (event === "verification.accepted") {
            // AML accepted -> mark document verified and stop polling
            dispatch(setDocumentVerified(true));
            setVerificationStatus("verified");

            // Clear cache immediately when status changes
            clearKycCache();

            // Best-effort to persist status (webhook should also do this)
            try {
              await updateDocumentStatus({
                documentReference: resp?.data?.isDocument ? pendingReference : "",
                isDocumentVerified: true,
                amlReference: pendingReference,
              });
            } catch (_) {
              // ignore, webhook likely handled it
            }

            clearInterval(interval);
          } else if (event === "verification.declined") {
            setVerificationStatus("declined");
            setDeclinedReason(resp?.data?.declined_reason || "Verification was declined");
            // Clear cache when status changes
            clearKycCache();
            clearInterval(interval);
          } else if (event === "request.invalid") {
            invalidRefCount++;
            if (invalidRefCount >= 3) {
              clearInterval(interval);
            }
          }

          if (pollCount >= maxPolls) {
            clearInterval(interval);
          }
        } catch (e) {
          // Swallow transient errors and continue polling
        }
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [step, verificationStatus, pendingReference, dispatch]);

const handleSubmit = async () => {
    if (!file || !documentType) {
      toast.error("Please upload a document and select document type");
      return;
    }

    setIsLoading(true);
    toast("Document submitted successfully! Your verification is now in progress.");
    nextStep();

    try {
      const documentVerificationResult: DocumentKYCResponse = await documentVerification({
        file,
        firstName,
        lastName,
        documentType,
      });

      // dispatch(setDocumentReference(documentVerificationResult.reference || ""));

      if (documentVerificationResult.event !== "verification.accepted") {
        setVerificationStatus("declined");
        setDeclinedReason(documentVerificationResult?.declined_reason || null);
        // to do: send kyc rejected email
        return;
      }

      // Extract data from KYC response for AML screening
      const extractedDob = documentVerificationResult?.additional_data?.document?.proof?.dob;
      const extractedFullName = documentVerificationResult?.additional_data?.document?.proof?.full_name;
      console.log("Dob and name", extractedDob, extractedFullName);

      // Step 2: AML Screening
      toast("Performing background screening...", { duration: 400 });
      const amlVerificationResult: AMLResponse = await amlVerification({
        full_name: extractedFullName,
        filters: ["sanction", "pep", "pep-class-1"],
        country,
        dob: extractedDob,
      });

      // dispatch(setAMLReference(amlVerificationResult.reference || ""));

      // Step 3: Handle AML + Update Database
      console.log(`📊 AML Event Received: ${amlVerificationResult.event}`);
      
      if (amlVerificationResult.event === "verification.accepted") {
        // ✅ AML screening passed
        dispatch(setDocumentVerified(true));
        setVerificationStatus("verified");
        // Clear cache immediately when status changes
        clearKycCache();
        toast.success("Background screening completed successfully!");
        
        // Update KYC status in new backend
        try {
          await updateDocumentStatus({
            documentReference: documentVerificationResult.reference || "",
            isDocumentVerified: true,
            amlReference: amlVerificationResult.reference || "",
          });
          console.log("✅ KYC document status updated in database");
        } catch (error) {
          console.error("Failed to update KYC status in database:", error);
          toast.error("Failed to save verification status");
          throw error; // Re-throw to be caught by outer catch
        }
      } else if (amlVerificationResult.event === "verification.declined") {
        // ❌ AML screening explicitly declined
        setVerificationStatus("declined");
        // Clear cache when status changes
        clearKycCache();
        toast.error("Background screening was declined");
        
        // Update declined status in database
        try {
          await updateDocumentStatus({
            documentReference: documentVerificationResult.reference || "",
            isDocumentVerified: false,
            amlReference: amlVerificationResult.reference || "",
          });
        } catch (error) {
          console.error("Failed to update declined KYC status:", error);
          // Don't throw here - we still want to show the declined message
        }
        
        setDeclinedReason(amlVerificationResult?.declined_reason?.split(".")[0] || null);
      } else if (amlVerificationResult.event === "request.pending" || amlVerificationResult.event === "request.received") {
        // ⏳ AML screening still in progress - keep as pending
        setVerificationStatus("pending");
        setPendingReference(amlVerificationResult.reference || "");
        toast.info("Background screening is in progress. This may take a few moments.");
        console.log("⏳ AML Status: PENDING - Will be updated via webhook");
      } else {
        // 🤷 Unknown event or timeout - default to pending
        setVerificationStatus("pending");
        setPendingReference(amlVerificationResult.reference || "");
        toast.warning("Background screening status is being verified. Please check back shortly.");
        console.log(`⚠️ AML Unknown event: ${amlVerificationResult.event} - Defaulting to pending`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit document. Please try again.");
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
            country={selectedCountry}
            setFirstName={setFirstName}
            setLastName={setLastName}
            setPhoneNumber={setPhoneNumber}
            setCountry={setSelectedCountry}
            onNext={nextStep}
          />
        );
      case 2:
        return (
          <DocumentVerificationStep
            documentType={documentType}
            country={country}
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
            KYC Verification
          </h1>
          <StepProgress currentStep={step} />
        </div>

        {renderStepContent()}
      </div>
    </div>
  );
}
