"use client";

import { Button } from "../ui/button";
import Image from "next/image";
import fallbackImg from "@/assets/binance.png";
import { Step2ConfirmationProps } from "./types";
import { toast } from "sonner";
import { useEffect, useRef } from "react";
import { CopyIcon } from "lucide-react";

export function Step2Confirmation({
  amount,
  usdAmount,
  selectedNetwork,
  selectedCrypto,
  paymentMethod,
  paymentImages,
  error,
  isProcessing,
  prevStep,
  handleContinueToPayment,
  selectedAccount,
  requiresNetwork = false,
}: Step2ConfirmationProps & { selectedAccount: string; usdAmount?: string }) {
  const hasShownConfirmationToast = useRef(false);

  const [accountNumber, accountType] = selectedAccount.split("|") || ["", ""];

  useEffect(() => {
    if (hasShownConfirmationToast.current) return;
    const timer = setTimeout(() => {
      toast.success("Details Confirmed", {
        description:
          "Please review your transaction details before proceeding.",
        duration: 4000,
      });
      hasShownConfirmationToast.current = true;
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (error) {
      toast.error("Transaction Error", {
        description: error,
        duration: 5000,
      });
    }
  }, [error]);

  const handleBackClick = () => {
    toast.info("Going Back", {
      description: "Returning to previous step to modify details.",
      duration: 2000,
    });
    prevStep();
  };

  const handlePaymentContinue = () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Invalid Amount", {
        description: "Please enter a valid amount to continue.",
      });
      return;
    }
    // Only require network for crypto payments (either requiresNetwork prop or selectedCrypto indicates crypto)
    const isCryptoPayment = requiresNetwork || !!selectedCrypto;
    if (isCryptoPayment && !selectedNetwork) {
      toast.error("Network Required", {
        description: "Please select a network to continue.",
      });
      return;
    }
    if (!selectedAccount) {
      toast.error("Account Required", {
        description: "Please select an account to continue.",
      });
      return;
    }

    if (isProcessing) {
      toast.loading("Processing Transaction", {
        description: "Please wait while we process your payment.",
      });
    } else {
      toast.success("Initiating Payment", {
        description: "Redirecting to payment processing...",
      });
    }

    handleContinueToPayment();
  };

  const handleCopyAccountNumber = () => {
    if (!accountNumber) return;
    navigator.clipboard
      .writeText(accountNumber)
      .then(() => {
        toast.success("Copied to Clipboard", {
          description: "Account number has been copied.",
        });
      })
      .catch(() => {
        toast.error("Copy Failed", {
          description: "Could not copy account number.",
        });
      });
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl text-center font-bold dark:text-white/75 text-black">
        {selectedCrypto && usdAmount 
          ? `Pay ${amount} ${selectedCrypto.symbol}-${selectedNetwork} (${usdAmount} USD)`
          : `Pay ${amount} ${selectedCrypto ? `${selectedCrypto.symbol}-${selectedNetwork}` : "USD"}`}
      </h2>

      {(selectedCrypto || requiresNetwork) && selectedNetwork && (
        <div className="mt-3 rounded-lg ">
          <div className="flex justify-between items-center mb-2">
            <span className="dark:text-white/75 text-black">Network:</span>
            <span className="dark:text-white/75 text-black">{selectedNetwork}</span>
          </div>
          {selectedAccount && (
            <>
              <div className="flex justify-between items-center mb-2">
                <span className="dark:text-white/75 text-black">Account Number:</span>
                <div className="flex items-center gap-2">
                  <span className="dark:text-white/75 text-black ">{accountNumber}</span>
                  <button
                    onClick={handleCopyAccountNumber}
                    className="dark:text-white/75 text-black dark:hover:text-white text-xs"
                    title="Copy account number"
                  >
                    <CopyIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="dark:text-white/75 text-black">Account Type:</span>
                <span className="dark:text-white/75 text-black">
                  {accountType
                    ? accountType.charAt(0).toUpperCase() + accountType.slice(1)
                    : "Not specified"}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      <hr className="border-t border-[#31263a] mt-2" />

      <div className="space-y-4 mt-4">
        <div className="flex justify-between items-center text-sm space-y-2">
          <p className="dark:text-white/75 text-black">Payment Method</p>
          <div className="flex items-center">
            {selectedCrypto ? (
              <>
                <Image
                  src={selectedCrypto.icon}
                  alt={selectedCrypto.name}
                  className="h-6 w-6 mr-2"
                  width={24}
                  height={24}
                />
                <p className="dark:text-white/75 text-black">{paymentMethod || `crypto-${selectedCrypto.symbol.toUpperCase()}${selectedNetwork ? `-${selectedNetwork.toUpperCase()}` : ''}`}</p>
              </>
            ) : (
              <>
                {paymentMethod && (
                  <Image
                    src={paymentImages[paymentMethod] || fallbackImg}
                    alt="Payment Method"
                    className="h-6 w-6 mr-2"
                    width={24}
                    height={24}
                  />
                )}
                <p className="dark:text-white/75 text-black">{paymentMethod}</p>
              </>
            )}
          </div>
        </div>

        <hr className="border-t border-[#31263a]" />

        <div className="flex justify-between items-center text-sm space-y-2">
          <p className="dark:text-white/75 text-black">Amount</p>
          <p className="dark:text-white/75 text-black">
            {amount} {selectedCrypto?.name || "USD"}
          </p>
        </div>

        <hr className="border-t border-[#31263a]" />

        <div className="md:p-3 pt-4 flex justify-between items-center text-sm dark:bg-[#221D22] rounded-lg ">
          <p className="dark:text-white/75 text-black  text-xs font-semibold">To be Deposited</p>
          <p className="text-[#945393] text-lg font-bold">
            {selectedCrypto && usdAmount 
              ? `${amount} ${selectedCrypto.symbol} (${usdAmount} USD)`
              : `${amount} ${selectedCrypto?.name || "USD"}`}
          </p>
        </div>

        {error && (
          <div className="text-red-400 text-sm mb-4 text-center">{error}</div>
        )}

        <div className="flex flex-col">
          <Button
            className="flex-1 bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white hover:bg-[#9d6ad9] cursor-pointer"
            onClick={handlePaymentContinue}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin h-5 w-5 mr-2 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </div>
            ) : (
              "Continue"
            )}
          </Button>
          <Button
            variant="outline"
            className="flex-1 bg-transparent dark:text-white/75 text-black  border-none text-xs mt-1 dark:hover:bg-[#090209]"
            onClick={handleBackClick}
            disabled={isProcessing}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
