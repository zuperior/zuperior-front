"use client";

import React from "react";
//import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
//import { MoveLeft } from "lucide-react";
import Link from "next/link";

interface VerificationInProgressStepProps {
  onNext?: () => void;
  onBack: () => void;
  isLoading: boolean;
  verificationStatus?: string;
  declinedReason?: string | null;
}

export default function VerificationInProgressStep({
  //onNext,
  onBack,
  isLoading,
  verificationStatus,
  declinedReason
}: VerificationInProgressStepProps) {
  /* const handleNext = () => {
    toast.success("Identity verification completed! 🎉");
    onNext();
  }; */


  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-[60vh] px-4">
        <Card className="border-0 bg-white dark:bg-[#01040D] p-10 dark:text-white text-black max-w-md w-full shadow-lg rounded-lg">
          <div className="flex flex-col items-center space-y-8 text-center">
            <video
              autoPlay
              loop
              muted
              playsInline
              controls={false}
              className="rounded-md object-contain z-[9999] relative h-24 w-24"
              preload="auto"
            >
              <source src="/logo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div>
              <h2 className="text-2xl font-extrabold leading-tight">
                Verifying your Identity...
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-300 font-medium italic">
                We are verifying your identity—this will only take 30 to 60 secs. 
                Please wait while we process your information. Almost there! ⏳
              </p>
            </div>
            <div className="w-full space-y-4">
              {/* <Button
                className="w-full py-5 bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] dark:text-white text-black font-semibold shadow-lg hover:brightness-110 transition"
                onClick={handleNext}
                disabled={isLoading}
              >
                Go to Review
              </Button> */}
              {/* <Button
                variant="ghost"
                className="w-full underline text-gray-700 dark:text-gray-300 hover:text-[#9f8bcf] dark:hover:text-[#b893e8]"
                onClick={onBack}
                disabled={isLoading}
              >
                <MoveLeft className="h-5 w-5 mr-2 inline-block" />
                Go to Dashboard
              </Button> */}
            </div>
          </div>
        </Card>
      </div>
    );

  if (verificationStatus === "verified")
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center space-y-6">
        <div className="w-16 h-16 flex items-center justify-center rounded-full  bg-linear-to-tr  to-[#6242A5] from-[#9F8BCF] cursor-pointer border border-[#6242A5] ">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-white"
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
        </div>

        <h2 className="text-2xl font-bold text-[#6242A5]">
          Verification Successful!
        </h2>

        <p className="text-gray-400 max-w-md">
          Your identity has been successfully verified. You can now proceed to the next step.
        </p>

        <Link
          className="px-6 py-2 font-medium rounded-lg text-[#FFFFFF] bg-linear-to-tr to-[#9F8BCF] from-[#6242A5] cursor-pointer transition"
          href={'/'}
        >
          Go to Dashboard
        </Link>
      </div>

    );

  // Show pending state - checking status
  if (verificationStatus === "pending")
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center space-y-6">
        <video
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          className="rounded-md object-contain z-[9999] relative h-24 w-24"
          preload="auto"
        >
          <source src="/logo.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        <h2 className="text-2xl font-bold ">
          Verification In Progress...
        </h2>

        <p className="text-gray-400 max-w-md">
          We're verifying your identity and performing background checks. 
          This typically takes 30-60 seconds. Please wait... ⏳
        </p>

        <div className="text-sm text-gray-500">
          Status will update automatically when complete.
        </div>

        <Button
          variant="default"
          className="mt-4 text-[#FFFFFF] bg-linear-to-tr to-[#9F8BCF] from-[#6242A5] cursor-pointer"
          onClick={onBack}
        >
          Back to Dashboard
        </Button>
      </div>
    );

  // Only show declined if explicitly declined
  if (verificationStatus === "declined")
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-6 max-w-lg mx-auto">
      <div className="w-16 h-16 flex items-center justify-center rounded-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-red-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold">
        Verification Declined
      </h2>

      <p className="text-gray-400 max-w-md">
        We couldnt verify your identity at this time. This usually happens due to
        missing or unclear documents.
      </p>

      {declinedReason && (
        <div className=" bg-linear-to-tr to-[#9F8BCF] from-[#6242A5] border border-purple-700/40 rounded-lg p-4 w-full text-left">
          <p className="text-sm text-white font-medium">
            <span className="font-semibold">Reason:</span> {declinedReason}
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 w-full justify-center mt-4">
        <Button
          variant="default"
          className="px-6 py-2 font-medium rounded-lg  text-[#FFFFFF] bg-linear-to-tr to-[#9F8BCF] from-[#6242A5] cursor-pointer"
          onClick={onBack}
        >
          Try Again
        </Button>
        <Link href="/support">
        <Button
          variant="default"
          className="px-6 py-2 font-medium rounded-lg dark:text-[#FFFFFF] text-[#FFFFFF] bg-linear-to-tr to-[#9F8BCF] from-[#6242A5] cursor-pointer"
        >
          Contact Support
        </Button>
        </Link>
      </div>

      {/* Help Link */}
      <p className="text-xs text-gray-500 mt-4">
        Need help? Check our{" "}
        <a
          href="/support"
          className="underline text-[#6242A5] transition"
        >
          KYC guidelines
        </a>{" "}
        before retrying.
      </p>
    </div>
  );

  // Fallback - if status is unknown, default to pending (safe approach)
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center space-y-6">
      <video
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        className="rounded-md object-contain z-[9999] relative h-24 w-24"
        preload="auto"
      >
        <source src="/logo.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <h2 className="text-2xl font-bold text-gray-400">
        Checking Status...
      </h2>

      <p className="text-gray-400 max-w-md">
        Please wait while we check your verification status...
      </p>

      <Button
        variant="outline"
        className="mt-4"
        onClick={onBack}
      >
        Back to Dashboard
      </Button>
    </div>
  );
}
