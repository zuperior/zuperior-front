// client/src/components/deposit/USDTManualStep4Confirmation.tsx

"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface BankDetails {
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  swiftCode?: string | null;
  accountType?: string | null;
  countryCode?: string | null;
}

interface USDTManualStep4ConfirmationProps {
  amount: string;
  selectedAccount: string;
  transactionId: string;
  depositRequestId: string;
  onClose: () => void;
  bank?: BankDetails; // Admin bank details
  gatewayType?: string; // 'upi' or 'bank_transfer' to conditionally show fields
}

export function USDTManualStep4Confirmation({
  amount,
  selectedAccount,
  transactionId,
  depositRequestId,
  onClose,
  bank = {},
  gatewayType = 'bank_transfer',
}: USDTManualStep4ConfirmationProps) {
  // Step 4 no copy UI needed per request
  const router = useRouter();
  
  // Determine if this is a UPI payment
  const isUpi = gatewayType === 'upi';
  
  // Check if bank details are actually available (not just empty object)
  const hasBankDetails = bank && (
    bank.bankName || 
    bank.accountName || 
    bank.accountNumber || 
    bank.ifscCode || 
    bank.swiftCode || 
    bank.accountType || 
    bank.countryCode
  );

  return (
    <div className="w-full px-6 py-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold dark:text-white/75 text-black mb-2">
           Payment Request Created! 
        </h2>
        <p className="text-gray-600 dark:text-white/60">
          Your manual deposit request has been submitted successfully
        </p>
      </div>

      {/* Summary (amount + bank name) - only show bank if it's not UPI and has bank details */}
      <div className="rounded-lg p-6 mb-6 bg-white dark:bg-[#221D22] border border-gray-200 dark:border-[#362e36] shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Deposit Summary</h3>
        <div className={`grid gap-3 ${!isUpi && hasBankDetails ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
          <div>
            <div className="text-xs text-gray-500 dark:text-white/50">Amount Submitted</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white break-all">{amount ? `${amount} USD` : '-'}</div>
          </div>
          {!isUpi && hasBankDetails && (
            <div>
              <div className="text-xs text-gray-500 dark:text-white/50">Bank</div>
              <div className="text-sm font-medium text-gray-900 dark:text-white break-all">{bank?.bankName || '-'}</div>
            </div>
          )}
        </div>
      </div>

      {/* Bank details for the account deposited into - only show for bank_transfer, not UPI */}
      {!isUpi && hasBankDetails && (
        <div className="rounded-lg p-6 mb-6 bg-white dark:bg-[#221D22] border border-gray-200 dark:border-[#362e36] shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bank Account Details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <ReadOnlyField label="Bank Name" value={bank?.bankName} />
            <ReadOnlyField label="Account Name" value={bank?.accountName} />
            <ReadOnlyField label="Account Number" value={bank?.accountNumber} />
            <ReadOnlyField label="IFSC / SWIFT" value={bank?.swiftCode || bank?.ifscCode} />
            <ReadOnlyField label="Account Type" value={bank?.accountType} />
            <ReadOnlyField label="Country" value={bank?.countryCode} />
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4 mb-6">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">🎯 What's Next?</h4>
        <ul className="text-sm text-gray-700 dark:text-white/80 space-y-1">
          <li>✅ Your payment request is being processed</li>
          <li>🔄 Admin will review and approve your deposit</li>
          <li>💰 Funds will be credited to your MT5 account</li>
          <li>📱 You'll receive a notification once completed</li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          className="w-full cursor-pointer bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white hover:bg-[#9d6ad9]"
          onClick={() => {
            toast.success("Payment request submitted successfully!");
            onClose();
            router.push("/transactions");
          }}
        >
          Done
        </Button>
      </div>
    </div>
  );
}

// small read-only field used above
function ReadOnlyField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-xs text-gray-500 dark:text-white/50">{label}</div>
      <div className="text-sm font-medium text-gray-900 dark:text-white break-all">{value || '-'}</div>
    </div>
  );
}
