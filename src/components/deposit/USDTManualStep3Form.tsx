"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Copy } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface USDTManualStep3FormProps {
  amount: string;
  selectedAccount: string;
  depositRequestId: string;
  onClose: () => void;
}

export function USDTManualStep3Form({
  amount,
  selectedAccount,
  depositRequestId,
  onClose,
}: USDTManualStep3FormProps) {
  const hasShownInitialToast = useRef(false);
  const depositAddress = "Twinxa7902309skjhfsdlhflksjdhlkLL";
  const [copied, setCopied] = useState(false);

  const accountDetails = selectedAccount
    ? {
        accountNumber: selectedAccount.split("|")[0],
        accountType: selectedAccount.split("|")[1],
      }
    : null;

  // Show initial payment instruction toast
  useEffect(() => {
    if (!hasShownInitialToast.current) {
      const timer = setTimeout(() => {
        toast.success("Payment Instructions", {
          description: "Please send the exact amount to the provided address.",
          duration: 5001,
        });
        hasShownInitialToast.current = true;
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Copied", {
          description: `${label} copied to clipboard.`,
        });
      })
      .catch(() =>
        toast.error("Copy Failed", { description: `Could not copy ${label}.` })
      );
  };

  return (
    <div className="w-full overflow-y-auto max-h-[75vh] no-scrollbar">
      <h2 className="text-2xl text-center font-bold dark:text-white/75 text-black -pt-6">
        Pay {amount} USDT TRC20 QR
      </h2>

      <div className="mt-1 space-y-4">
        <div className="rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="dark:text-white/75 text-black">Amount to Send:</span>
            <span className="dark:text-white/75 text-black">
              {amount} USDT
            </span>
          </div>

          {accountDetails && (
            <>
              <div className="flex justify-between items-center mt-2 mb-2">
                <span className="dark:text-white/75 text-black">Account Number:</span>
                <div className="flex items-center gap-2">
                  <span className="dark:text-white/75 text-black">
                    {accountDetails.accountNumber}
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(accountDetails.accountNumber, "Account number")
                    }
                    className="dark:text-white/75 text-black hover:text-white text-xs"
                    title="Copy account number"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="dark:text-white/75 text-black">Account Type:</span>
                <span className="dark:text-white/75 text-black">
                  {accountDetails.accountType
                    ? accountDetails.accountType.charAt(0).toUpperCase() +
                      accountDetails.accountType.slice(1)
                    : ""}
                </span>
              </div>
            </>
          )}

          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 mt-4">
            <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-2">
              ✅ Deposit Request Created Successfully!
            </h3>
            <p className="text-sm text-green-600 dark:text-green-400">
              Request ID: <span className="font-mono">{depositRequestId}</span>
            </p>
          </div>
        </div>

        <div className="rounded-lg p-4">
          <h3 className="text-lg font-semibold dark:text-white/75 text-black mb-3">
            Pay with USDT TRC20 QR
          </h3>
          <div className="mb-2 rounded-lg p-1">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center">
                <div className="bg-white p-2 rounded-md">
                  <Image
                    src="/qr.png"
                    alt="QR Code for USDT Deposit"
                    width={200}
                    height={200}
                    className="border border-[#362e36] rounded-lg"
                  />
                </div>
                <p className="text-xs dark:text-white/75 text-black mt-2 text-center">
                  Scan to send USDT
                </p>
              </div>
              <div className="flex-1">
                <div className="flex items-center mb-3">
                  <span className="font-semibold">
                    USDT TRC20 QR Network
                  </span>
                </div>
                <div className="mb-3">
                  <p className="dark:text-white/75 text-black mb-1">Payment Address</p>
                  <p className="dark:text-white/75 text-black font-mono break-all p-2 rounded">
                    {depositAddress}
                  </p>
                  <Button
                    variant="outline"
                    className="mt-2 text-xs dark:text-white/75 text-black"
                    onClick={() =>
                      handleCopy(
                        depositAddress,
                        "Manual address"
                      )
                    }
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Address
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-xs text-red-500 mt-1 p-2">
              Please make sure to send exactly {amount} USDT to the address above
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg p-4 -mt-10">
        <h3 className="text-lg font-semibold dark:text-white/75 text-black mb-2">Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm dark:text-white/75 text-black">
          <li>
            Send exactly {amount} USDT to the address above
          </li>
          <li>Use TRC20 network for USDT transfers</li>
          <li>Your deposit will be processed within 24 hours</li>
          <li>Keep your transaction hash for reference</li>
        </ol>
      </div>

      <div className="mt-6 flex space-x-3">
        <Button
          onClick={onClose}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
        >
          Close
        </Button>
        <Button
          onClick={() => window.location.reload()}
          className="flex-1 cursor-pointer bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white hover:bg-[#9d6ad9]"
        >
          Check Status
        </Button>
      </div>
    </div>
  );
}
