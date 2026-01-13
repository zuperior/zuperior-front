"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface Props {
  bank: {
    bankName?: string | null;
    accountName?: string | null;
    accountNumber?: string | null;
    ifscCode?: string | null;
    swiftCode?: string | null;
    accountType?: string | null;
    countryCode?: string | null;
    fixedRate?: number;
  };
  amount: string;
  nextStep: () => void;
  fixedRate?: number;
}

export function WireStep2Instructions({ bank, amount, nextStep, fixedRate }: Props) {
  const [copied, setCopied] = React.useState<string>('');

  const copy = async (label: string, value?: string | null) => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(label);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(''), 1500);
  };

  // Calculate INR equivalent
  const rate = fixedRate || bank.fixedRate || 92.00;
  const amountNum = parseFloat(amount) || 0;
  const inrAmount = amountNum > 0 ? (amountNum * rate).toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0';

  return (
    <div className="w-full px-6 py-4">
      <h2 className="text-2xl text-center font-bold dark:text-white/75 text-black mb-6">Bank Transfer Details</h2>

      <div className="rounded-lg p-6 mb-6 bg-white dark:bg-[#221D22] border border-gray-200 dark:border-[#362e36] shadow-sm">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Bank Name" value={bank.bankName} onCopy={() => copy('Bank Name', bank.bankName)} copied={copied === 'Bank Name'} />
          <Field label="Account Name" value={bank.accountName} onCopy={() => copy('Account Name', bank.accountName)} copied={copied === 'Account Name'} />
          <Field label="Account Number" value={bank.accountNumber} onCopy={() => copy('Account Number', bank.accountNumber)} copied={copied === 'Account Number'} />
          <Field label="IFSC / SWIFT" value={bank.ifscCode || bank.swiftCode} onCopy={() => copy('IFSC / SWIFT', bank.ifscCode || bank.swiftCode || '')} copied={copied === 'IFSC / SWIFT'} />
          <Field label="Account Type" value={bank.accountType} onCopy={() => copy('Account Type', bank.accountType)} copied={copied === 'Account Type'} />
          <Field label="Country" value={bank.countryCode} onCopy={() => copy('Country', bank.countryCode)} copied={copied === 'Country'} />
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-lg p-4 mt-6">
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            Send exactly <strong>{amount || 'your'}</strong> USD 
            {amountNum > 0 && (
              <> (<strong>₹{inrAmount}</strong> INR)</>
            )}
            {' '}equivalent to this bank account. Then upload your payment proof and enter the transaction/reference ID in the next step.
            {amountNum > 0 && (
              <span className="block mt-2 text-xs opacity-90">
                Exchange Rate: 1 USD = {rate} INR
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <Button
          variant="outline"
          className="w-full cursor-pointer dark:text-white text-gray-900 border-gray-300 dark:border-white/20"
          onClick={nextStep}
        >
          I've Completed Bank Transfer
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value, onCopy, copied }: { label: string; value?: string | null; onCopy: () => void; copied: boolean }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500 dark:text-white/50">{label}</div>
          <div className="text-sm font-medium text-gray-900 dark:text-white break-all">{value || '-'}</div>
        </div>
        <Button
          onClick={onCopy}
          variant="outline"
          size="icon"
          className="dark:text-white text-gray-900 border-gray-300 dark:border-white/20 size-8"
          aria-label="Copy"
          title={copied ? 'Copied' : 'Copy'}
        >
          {copied ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
