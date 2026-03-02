// client/src/components/deposit/USDTManualStep2Instructions.tsx

"use client";

import React from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface USDTManualStep2InstructionsProps {
  amount: string;
  selectedAccount: string;
  nextStep: () => void;
}

export function USDTManualStep2Instructions({
  amount,
  selectedAccount,
  nextStep,
}: USDTManualStep2InstructionsProps) {
  const [paymentAddress, setPaymentAddress] = React.useState<string>("");
  const [paymentUrl, setPaymentUrl] = React.useState<string>("");
  const [qrCode, setQrCode] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const fetchPaymentAddress = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/cregis/create-deposit-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mt5AccountId: selectedAccount,
            amount,
            currency: "USD",
          }),
        });

        const result = await response.json();

        if (result.success && result.data) {
          const paymentInfo = result.data.paymentInfo;

          // Find USDT-TRC20 payment address
          const trc20Payment = paymentInfo?.find((p: any) => p.token_name === "USDT-TRC20");

          if (trc20Payment?.payment_address) {
            setPaymentAddress(trc20Payment.payment_address);
            setPaymentUrl(result.data.checkoutUrl || result.data.checkout_url || "");
            setQrCode(result.data.qrCode || "");
          } else {
            console.error("❌ No TRC20 payment address found in:", paymentInfo);
            toast.error("USDT-TRC20 payment address not available");
          }
        } else {
          console.error("❌ API Error:", result.error);
          toast.error(result.error || "Failed to generate payment address");
        }
      } catch (error) {
        console.error("Error fetching payment address:", error);
        toast.error("Failed to generate payment address");
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentAddress();
  }, [amount, selectedAccount]);

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(paymentAddress);
      setCopied(true);
      toast.success("Address copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy address");
    }
  };

  if (loading) {
    return (
      <div className="w-full px-6 py-4 flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
        <p className="text-gray-600 dark:text-white/60">Generating payment address...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-4">
      <h2 className="text-2xl text-center font-bold dark:text-white/75 text-black mb-6">
        Pay with USDT TRC20 QR
      </h2>

      <div className="rounded-lg p-6 mb-6 bg-white dark:bg-[#0B0710] border border-gray-200 dark:border-white/10 shadow-sm">
        <div className="flex items-start gap-4">
          {/* USDT Logo and TRON Logo */}
          <div className="relative">
            <div className="w-20 h-20 bg-[#26A17B] rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">₮</span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#EF0027] rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">◈</span>
            </div>
          </div>

          {/* Payment Details */}
          <div className="flex-1">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">USDT TRC20 QR Network</h3>
              <h4 className="text-md font-medium text-gray-700 dark:text-white/80 mb-2">Payment Address</h4>
              <p className="text-sm font-mono text-gray-600 dark:text-white/60 mb-3 break-all">
                {paymentAddress || "Generating..."}
              </p>
              <Button
                onClick={handleCopyAddress}
                variant="outline"
                size="sm"
                className="dark:text-white text-gray-900 border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Address
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Scan to send USDT</h4>

          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg p-4 mb-4">
            <p className="text-red-600 dark:text-red-400 text-sm">
              Please make sure to send exactly {amount} USDT to the address above
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-semibold text-gray-900 dark:text-white">Instructions</h5>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700 dark:text-white/80">
              <li>Send exactly {amount} USDT to the address above</li>
              <li>Use TRC20 network for USDT transfers</li>
              <li>Your deposit will be processed within 24 hours</li>
              <li>Keep your transaction hash for reference</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Payment Buttons */}
      <div className="mt-6 space-y-3">
        {paymentUrl && (
          <Button
            className="w-full cursor-pointer bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white hover:bg-[#9d6ad9]"
            onClick={() => window.open(paymentUrl, "_blank")}
          >
            Open Payment Page
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full cursor-pointer dark:text-white text-gray-900 border-gray-300 dark:border-white/20"
          onClick={nextStep}
        >
          I've Completed Payment
        </Button>
      </div>
    </div>
  );
}
