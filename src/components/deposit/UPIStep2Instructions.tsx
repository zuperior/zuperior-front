"use client";

import React, { useState } from "react";
import { Copy, CheckCircle } from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";
import Image from "next/image";

interface Props {
  upi: {
    vpaAddress?: string | null;
    qrCode?: string | null;
    fixedRate?: number | null;
  };
  amount: string;
  nextStep: () => void;
  fixedRate?: number;
}

export function UPIStep2Instructions({ upi, amount, nextStep, fixedRate }: Props) {
  const [copied, setCopied] = useState<string | null>(null);
  const amountNum = parseFloat(amount) || 0;
  const rate = fixedRate || upi.fixedRate || 92.00;
  const inrAmount = (amountNum * rate).toFixed(2);

  const copy = (label: string, value: string) => {
    navigator.clipboard.writeText(value).then(
      () => {
        setCopied(label);
        toast.success("Copied!", { description: `${label} copied to clipboard` });
        setTimeout(() => setCopied(null), 2000);
      },
      () => toast.error("Copy Failed", { description: `Could not copy ${label}.` })
    );
  };

  return (
    <div className="w-full space-y-6">
      <h2 className="text-2xl text-center font-bold dark:text-white/75 text-black">
        UPI Payment Details
      </h2>

      <div className="rounded-lg p-6 mb-6 bg-white dark:bg-[#221D22] border border-gray-200 dark:border-[#362e36] shadow-sm">
        {/* QR Code Section */}
        {upi.qrCode && (
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Scan QR code to pay via UPI
            </p>
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-white rounded-lg border-2 border-gray-200 dark:border-gray-700">
                <Image
                  src={upi.qrCode}
                  alt="UPI QR Code"
                  width={250}
                  height={250}
                  className="rounded"
                />
              </div>
            </div>
          </div>
        )}

        {/* UPI VPA Address */}
        {upi.vpaAddress && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                  UPI ID (VPA)
                </label>
                <p className="text-lg font-mono text-gray-900 dark:text-white break-all">
                  {upi.vpaAddress}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copy('UPI ID', upi.vpaAddress!)}
                className="ml-4"
              >
                {copied === 'UPI ID' ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Amount Information */}
        <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg p-4 mt-6">
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            Send exactly <strong>{amount || 'your'}</strong> USD 
            {amountNum > 0 && (
              <> (<strong>₹{inrAmount}</strong> INR)</>
            )}
            {' '}via UPI to the above UPI ID. Then upload your payment proof and enter the transaction/reference ID in the next step.
            {amountNum > 0 && (
              <span className="block mt-2 text-xs opacity-90">
                Exchange Rate: 1 USD = {rate} INR
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Button onClick={nextStep} className="w-full">
          Continue to Next Step
        </Button>
      </div>
    </div>
  );
}
