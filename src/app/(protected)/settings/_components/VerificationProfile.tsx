"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  ChevronRight,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAppSelector } from "@/store/hooks";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface VerificationProfileProps {
  fullName?: string | null;
  verificationStatus: "unverified" | "partial" | "verified";
}

export default function VerificationProfile({
  fullName,
  verificationStatus,
}: VerificationProfileProps) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const kycStatus = useAppSelector((state) => state.kyc.verificationStatus);
  const resolvedStatus = verificationStatus || kycStatus;

  const toggleStep = (stepNumber: number) => {
    setExpandedStep((prev) => (prev === stepNumber ? null : stepNumber));
  };

  // Update expanded step based on verification status
  useEffect(() => {
    if (resolvedStatus === "verified") setExpandedStep(0);
    else if (resolvedStatus === "partial") setExpandedStep(2);
    else setExpandedStep(1);
  }, [resolvedStatus]);

  // Determine deposit limit based on verification status
  const getDepositLimit = () => {
    if (resolvedStatus === "verified") return "Unlimited";
    if (resolvedStatus === "partial") return "10,000 USD";
    return "5,000 USD"; // unverified
  };

  // Determine status text
  const getStatusText = () => {
    if (resolvedStatus === "verified") return "Verified";
    if (resolvedStatus === "partial") return "Verified (Partially)";
    return "Not Verified";
  };

  // Determine completed steps
  const getCompletedSteps = () => {
    if (resolvedStatus === "verified") return "";
    if (resolvedStatus === "partial")
      return "1 step left to become a fully verified user";
    return "0/2 steps complete";
  };

  return (
    <>
      {/* Account Section */}
      <div className="mb-6">
        <h2 className="text-xl mt-4 font-semibold dark:text-white/75 mb-6">
          Account
        </h2>

        <div className="grid grid-cols-2 gap-6">
          {/* Status Card */}
          <div className="bg-white dark:bg-gradient-to-r from-[#FFFFFF] dark:from-[#110F17] to-[#f4e7f6] dark:to-[#1E1429] border-2 dark:border-[#1D1825] border-gray-300 rounded-lg p-6">
            <div className="flex items-center mb-2">
              <CheckCircle
                className={`w-5 h-5 ${
                  verificationStatus === "verified"
                    ? "text-green-500"
                    : "text-gray-400"
                } mr-2`}
              />
              <span className="text-sm dark:text-white/75">Status</span>
            </div>
            <div className="text-lg font-semibold dark:text-white/75 mb-1">
              {getStatusText()}
            </div>
            <div className="text-sm dark:text-white/75">
              {getCompletedSteps()}
            </div>
          </div>

          {/* Deposit Limit Card */}
          <div className="bg-white dark:bg-gradient-to-r from-[#FFFFFF] dark:from-[#110F17] to-[#f4e7f6] dark:to-[#1E1429] border-2 dark:border-[#1D1825] border-gray-300 rounded-lg p-6">
            <div className="flex items-center mb-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                <span className="text-white text-xs">$</span>
              </div>
              <span className="text-sm dark:text-white/75">Deposit limit</span>
            </div>
            <div className="text-lg font-semibold dark:text-white/75 mb-1">
              {getDepositLimit()}
            </div>
            {/* Removed remaining limit text per request */}
          </div>
        </div>
      </div>

      {/* Verification Steps */}
      <div>
        <h3 className="text-lg font-semibold dark:text-white/75 mb-6">
          Verification steps
        </h3>

        <div className="space-y-4">
          {/* Identity Verification - Step 1 */}
          <div className="bg-white dark:bg-gradient-to-r from-[#FFFFFF] dark:from-[#110F17] to-[#f4e7f6] dark:to-[#1E1429] border-2 dark:border-[#1D1825] border-gray-300 rounded-lg">
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => toggleStep(1)}>
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 ${resolvedStatus === "partial" ||
                    resolvedStatus === "verified"
                    ? "bg-green-500"
                    : "bg-gray-400"
                    } rounded-full flex items-center justify-center mr-4`}>
                  <span className="text-white font-semibold text-sm">1</span>
                </div>
                <div>
                  <div className="font-medium dark:text-white/75">
                    Identity verification
                  </div>
                  <div className="text-sm dark:text-white/75">
                    {fullName}
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                {resolvedStatus === "partial" ||
                  resolvedStatus === "verified" ? (
                  <>
                    <span className="dark:text-white/75 text-sm font-medium mr-2">
                      Confirmed
                    </span>
                    {expandedStep === 1 ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </>
                ) : (
                  <span className="dark:text-white/75 text-sm font-medium mr-2">
                    Pending
                  </span>
                )}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {expandedStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="overflow-hidden">
                  <div className="px-4 pb-4 ml-12 border-t border-gray-100 pt-4">
                    <div className="text-sm dark:text-white/75 mb-2">
                      Identity document verification
                    </div>
                    <div className="text-sm dark:text-white/75 mb-4">
                      Upload government-issued ID to unlock higher deposit
                      limits ($10,000)
                    </div>
                    {resolvedStatus === "unverified" && (
                      <div className="text-sm text-yellow-500">
                        Complete your identity verification now
                      </div>
                    )}
                    {resolvedStatus === "unverified" && (
                      <Link href="/kyc" passHref>
                        <Button className="ml-auto bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white hover:opacity-90 font-semibold px-6 py-2 rounded-[8px] shadow-md transition-all duration-200 ease-in-out mt-2 flex items-center gap-2">
                          Go to KYC
                          <ArrowRight size={16} className="text-white" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Verify Residential Address - Step 2 */}
          <div className="bg-white dark:bg-gradient-to-r from-[#FFFFFF] dark:from-[#110F17] to-[#f4e7f6] dark:to-[#1E1429] border-2 dark:border-[#1D1825] border-gray-300 rounded-lg">
            <div
              className="flex items-center justify-between p-4 cursor-pointer"
              onClick={() => toggleStep(2)}>
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 ${resolvedStatus === "verified"
                    ? "bg-green-500"
                    : "bg-gray-400"
                    } rounded-full flex items-center justify-center mr-4`}>
                  <span className="dark:text-white/75 font-semibold text-sm">
                    2
                  </span>
                </div>
                <div className="font-medium dark:text-white/75">
                  Verify residential address
                </div>
              </div>
              <div className="flex items-center">
                {resolvedStatus === "verified" ? (
                  <>
                    <span className="dark:text-white/75 text-sm font-medium mr-2">
                      Confirmed
                    </span>
                    {expandedStep === 2 ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </>
                ) : (
                  <span className="dark:text-white/75 text-sm font-medium mr-2">
                    Pending
                  </span>
                )}
              </div>
            </div>

            <AnimatePresence initial={false}>
              {expandedStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="overflow-hidden">
                  <div className="px-4 pb-4 ml-12 border-t border-gray-100 pt-4">
                    <div className="text-sm dark:text-white/75 mb-2">
                      Provide proof of your place of residence
                    </div>
                    <div className="text-sm dark:text-white/75 mb-4"></div>

                    <div className="text-sm dark:text-white/75 mb-4">
                      Complete this step to unlock unlimited deposit limits
                    </div>

                    {(resolvedStatus === "partial" ||
                      resolvedStatus === "unverified") && (
                        <div className="text-sm text-yellow-500">
                          Complete your address verification now
                        </div>
                      )}
                    {resolvedStatus !== "verified" && (
                      <Link href="/kyc" passHref>
                        <Button className="ml-auto bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white hover:opacity-90 font-semibold px-6 py-2 rounded-[8px] shadow-md transition-all duration-200 ease-in-out mt-2 flex items-center gap-2">
                          Go to KYC
                          <ArrowRight size={16} className="text-white" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
