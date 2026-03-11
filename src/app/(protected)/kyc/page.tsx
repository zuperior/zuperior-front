"use client";
import { TextAnimate } from "@/components/ui/text-animate";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { fetchKycStatus } from "@/store/slices/kycSlice";
import { Lock } from "lucide-react";
import Link from "next/link";
import React, { memo, useMemo, useEffect, useRef, useState } from "react";

const CheckIcon = memo(() => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-8 w-8 text-green-400"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
));
CheckIcon.displayName = "CheckIcon";

const Page = () => {
  const dispatch = useAppDispatch();
  const [showInstructionsDialog, setShowInstructionsDialog] = useState(false);
  const hasShownInstructions = useRef(false);

  // Use selector to subscribe to KYC state changes
  const addressVerified = useAppSelector((state) => state.kyc.isAddressVerified);
  const identityVerified = useAppSelector((state) => state.kyc.isDocumentVerified);
  const verificationStatus = useAppSelector((state) => state.kyc.verificationStatus);
  const isFullyVerified =
    verificationStatus === "verified" || (addressVerified && identityVerified);

  // Refresh KYC status when page loads and periodically
  useEffect(() => {
    console.log('🔄 Refreshing KYC status on page load...');
    dispatch(fetchKycStatus(false)).catch((error) => {
      console.error("Failed to refresh KYC status:", error);
    });

    // Auto-refresh every 60 seconds if verification is pending
    const refreshInterval = setInterval(() => {
      // Only auto-refresh if not fully verified
      if (verificationStatus !== "verified") {
        console.log('🔄 Auto-refreshing KYC status...');
        dispatch(fetchKycStatus(false)).catch((error) => {
          console.error("Failed to refresh KYC status:", error);
        });
      }
    }, 60000); // Refresh every 60 seconds

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval);
  }, [dispatch, verificationStatus]);

  console.log("📊 Current KYC Status:", {
    addressVerified,
    identityVerified,
    verificationStatus
  });

  useEffect(() => {
    if (isFullyVerified) {
      setShowInstructionsDialog(false);
      return;
    }

    // Show the instructions once when this page is opened for non-verified users.
    if (!hasShownInstructions.current) {
      setShowInstructionsDialog(true);
      hasShownInstructions.current = true;
    }
  }, [isFullyVerified]);

  const cardMaskStyle = useMemo<React.CSSProperties>(
    () => ({
      WebkitMaskImage:
        "linear-gradient(212deg, rgb(49,27,71) 0%, rgb(20,17,24) 100%)",
      maskImage:
        "linear-gradient(100deg, rgba(0,0,0,0.1) 10%, rgba(0,0,0,0.4) 100%)",
      borderRadius: "15px",
      opacity: 0.25,
      position: "absolute",
      inset: 0,
      zIndex: 0,
      pointerEvents: "none",
    }),
    []
  );
  return (
    <>
      <Dialog open={showInstructionsDialog} onOpenChange={setShowInstructionsDialog}>
        <DialogContent className="md:max-w-2xl max-w-[95%] rounded-[18px] border border-black/20 bg-white md:p-6 p-4 dark:border-white/20 dark:bg-[#070206] dark:text-white/80 [background:linear-gradient(#fff,#fff)_padding-box,conic-gradient(from_var(--border-angle),#ddd,#f6e6fc,theme(colors.purple.400/48%))_border-box] dark:[background:linear-gradient(#070206,#030103)_padding-box,conic-gradient(from_var(--border-angle),#030103,#030103,theme(colors.purple.400/48%))_border-box] animate-border" disableOutsideClick={true}>
          <DialogHeader>
            <DialogTitle className="md:text-xl text-lg font-semibold text-black dark:text-white/80 text-left md:pr-0 pr-4">
              Before You Upload Your KYC Document
            </DialogTitle>
            <DialogDescription asChild>
              <div className="mt-2 space-y-3 md:text-sm text-base md:leading-6 leading-5 text-black/80 dark:text-white/75 text-left">
                <p>Please make sure of the following before uploading your document:</p>
                <ul className="list-disc space-y-2 pl-5">
                  <li>
                    Your full name and address must be clearly visible on the same
                    document.
                  </li>
                  <li>
                    If your document has details on separate pages (for example,
                    Passport), please combine the first page and the address page into
                    a single PDF file and upload it.
                  </li>
                  <li>
                    The address mentioned in your form must exactly match the address
                    shown on your document.
                  </li>
                  <li>Upload a clear, high-quality image.</li>
                  <li>Ensure all four corners of the document are visible.</li>
                  <li>Avoid any flash, glare, blur, or cut edges.</li>
                </ul>
                <p>
                  Following these steps carefully will help avoid rejection and speed
                  up your verification process.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={() => setShowInstructionsDialog(false)}
            >
              I Understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col items-center md:justify-center px-4">
        <div className="max-w-3xl w-full h-auto text-center">
        <TextAnimate
          as={"h1"}
          className="lg:text-[34px] md:text-3xl text-2xl font-bold dark:text-white/75 text-black/75"
        >
          KYC Verification
        </TextAnimate>
        <TextAnimate as={"p"} className="text-black/50 dark:text-white/75 md:text-base text-sm lg:mt-2 mt-1">
          Please complete your KYC verification by providing both Address Proof
          and Identity Proof.
        </TextAnimate>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {/* Identity Proof */}
          {identityVerified ? (
            <div className="relative h-auto min-h-46.5 rounded-[15px] bg-white dark:bg-green-400/5 p-6 border border-green-500/40 dark:hover:bg-green-400/10 overflow-hidden transition-transform">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-500/20 border border-green-500/40">
                  <CheckIcon />
                </div>
                <h2 className="text-xl font-semibold text-black dark:text-white">
                  Identity Verified
                </h2>
                <p className="mt-2 text-black/80 dark:text-white/80 text-sm text-center">
                  Your identity verification has been successfully completed.
                  {/*  You can now access all platform features. */}
                </p>
              </div>
            </div>
          ) : (
            <Link
              className="cursor-pointer relative h-auto rounded-[15px] bg-white dark:bg-[#13061d] p-6 border hover:bg-linear-to-r from-white to-[#f4e7f6] dark:from-[#330F33] dark:to-[#1C061C] overflow-hidden transition-transform"
              href="/kyc/identity-proof"
            >
              <div className="flex flex-col items-center gap-4">
                <span className="text-5xl">🪪</span>
                <h2 className="text-xl font-semibold text-black dark:text-white">
                  Identity Proof
                </h2>
                <p className="mt-2 text-black/80 dark:text-white/80 text-sm">
                  Upload your passport, national ID card, or driver&apos;s
                  license.
                </p>
              </div>
            </Link>
          )}

          {/* Address Proof */}
          {addressVerified ? (
            <div className="relative h-auto min-h-46.5  rounded-[15px] bg-white dark:bg-green-400/5 p-6 border border-green-500/40 dark:hover:bg-green-400/10 overflow-hidden transition-transform">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-500/20 border border-green-500/40">
                  <CheckIcon />
                </div>
                <h2 className="text-xl font-semibold text-black dark:text-white">
                  Address Verified
                </h2>
                <p className="mt-2 text-black/80 dark:text-white/80 text-sm text-center">
                  Your Address verification has been successfully completed.
                </p>
              </div>
            </div>
          ) : !identityVerified ? (
            // 🔒 Documents not verified → Locked card
            <div className="relative h-auto min-h-46.5  rounded-[15px] bg-gray-100 dark:bg-[#0d0414] p-6 border border-gray-300 dark:border-[#1D1825] overflow-hidden opacity-60 cursor-not-allowed">
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="flex flex-col items-center text-gray-700 dark:text-gray-300">
                  <Lock className="w-8 h-8 mb-2" />
                  <p className="text-sm">Document Verification Required</p>
                </div>
              </div>
            </div>
          ) : (
            // 📍 Documents verified but address not → Upload card
            <Link
              className="cursor-pointer relative h-auto rounded-[15px] bg-white dark:bg-[#13061d] p-6 border hover:bg-linear-to-r from-white to-[#f4e7f6] dark:from-[#330F33] dark:to-[#1C061C] overflow-hidden transition-transform"
              href="/kyc/address-proof"
            >
              <div style={cardMaskStyle} className="border border-white/50" />
              <div className="flex flex-col items-center gap-4">
                <span className="text-5xl">📍</span>
                <h2 className="text-xl font-semibold text-black dark:text-white">
                  Address Proof
                </h2>
                <p className="mt-2 text-black/80 dark:text-white/80 text-sm">
                  Upload a utility bill, bank statement, or other
                  government-issued proof of address.
                </p>
              </div>
            </Link>
          )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Page;
