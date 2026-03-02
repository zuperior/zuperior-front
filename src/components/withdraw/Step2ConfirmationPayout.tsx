"use client";
import { Button } from "../ui/button";
import Image from "next/image";
import { Step2ConfirmationProps, WithdrawDest } from "./types";
import fallbackImg from "@/assets/binance.png";
import { useCallback, useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { TpAccountSnapshot } from "@/types/user-details";
import { Input } from "../ui/input";
import { Mail } from "lucide-react";
import { useAppSelector } from "@/store/hooks";

export function Step2ConfirmationPayout({
  amount,
  selectedNetwork,
  selectedCrypto,
  paymentMethod,
  paymentImages,
  isProcessing,
  toWallet,
  prevStep,
  handleContinueToPayment,
  selectedAccount,
  setPayoutId,
  selectedDest,
}: Step2ConfirmationProps & {
  selectedAccount: TpAccountSnapshot | null;
  toWallet: string;
  setToWallet: (address: string) => void;
  setPayoutId: (id: string) => void;
}) {
  const [isApiProcessing, setIsApiProcessing] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpKey, setOtpKey] = useState<string | null>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Get user email from Redux store
  const userData = useAppSelector((state) => state.user.data);
  const userEmail = userData?.email1 || userData?.email || 'your email';

  // Function to check payout status
  const checkPayoutStatus = useCallback(
    async (cid: string) => {
      try {
        const response = await fetch("/api/payout-query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cid: cid }),
        });

        const statusData = await response.json();
        return statusData;
      } catch (error) {
        console.error("Error checking payout status:", error);
        throw error;
      }
    },
    []
  );

  // Removed Supabase storage: we save directly in backend DB

  // Function to request withdrawal OTP
  const handleRequestWithdrawal = async () => {
    const isBank = selectedDest?.type === 'bank';
    if (!amount || (!isBank && !selectedCrypto)) {
      toast.error("Missing required information");
      return;
    }

    setIsApiProcessing(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;

      // Request withdrawal (sends OTP)
      const resp = await fetch('/api/withdraw/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          amount: Number(amount),
          walletAddress: isBank ? (selectedDest?.bank?.accountNumber || toWallet) : toWallet,
          method: isBank ? 'bank' : 'crypto',
          bankDetails: isBank ? selectedDest?.bank : undefined,
        }),
      });

      const json = await resp.json();
      if (!resp.ok || !json?.success) throw new Error(json?.message || 'Failed to request withdrawal');

      setOtpKey(json.data?.otpKey);
      setShowOtpInput(true);
      toast.success('OTP sent to your email. Please verify to complete withdrawal.');

    } catch (err: unknown) {
      toast.error((err as Error).message || 'An error occurred while requesting withdrawal');
    } finally {
      setIsApiProcessing(false);
    }
  };

  // Function to verify OTP and create withdrawal
  const handleVerifyOtpAndCreate = async () => {
    if (!otpKey || otp.join('').length !== 6) {
      toast.error("Please enter the 6-digit OTP code");
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;

      // Create withdrawal with OTP verification
      const resp = await fetch('/api/withdraw/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          otpKey,
          otp: otp.join(''),
        }),
      });

      const json = await resp.json();
      if (!resp.ok || !json?.success) throw new Error(json?.message || 'Failed to create withdrawal');

      const cid = json.data?.id || '';
      setPayoutId(cid);
      setShowOtpInput(false);
      setOtp(["", "", "", "", "", ""]);
      handleContinueToPayment();

    } catch (err: unknown) {
      toast.error((err as Error).message || 'An error occurred while processing the payout');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handle OTP input change
  const handleOtpChange = (value: string, idx: number) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);
    if (value && idx < otp.length - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  // Handle backspace in OTP input
  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  useEffect(() => {
  }, [selectedNetwork]);

  return (
    <div className="mx-auto w-[400px] max-h-full overflow-y-auto">
      <h2 className="text-2xl text-center font-bold text-black dark:text-white/75 mb-1">
        Pay {amount} {selectedCrypto?.name || "USD"}
      </h2>

      {selectedCrypto && selectedAccount && (
        <div className="mt-3 rounded-lg ">
          {/* Account Information */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-black dark:text-white/75">Account Number:</span>
            <span className="text-black dark:text-white/75">{selectedAccount?.acc}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-black dark:text-white/75">Account Type:</span>
            <span className="text-black dark:text-white/75">{selectedAccount?.account_type}</span>
          </div>
        </div>
      )}

      {/* OTP Input Section */}
      {showOtpInput && (
        <div className="mt-4 p-4 rounded-lg border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20">
          <div className="flex items-center gap-2 text-sm font-medium mb-3">
            <Mail className="w-4 h-4 text-[#6242a5]" />
            <span className="text-black dark:text-white/75">
              Enter the code sent to: <span className="font-semibold">{userEmail}</span>
            </span>
          </div>
          <div className="flex gap-2 justify-center mb-4">
            {otp.map((digit, idx) => (
              <Input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(e.target.value, idx)}
                onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                className="w-12 h-12 text-center text-lg font-semibold tracking-widest border-2 rounded-md focus:border-[#6242a5]"
              />
            ))}
          </div>
          <Button
            className="w-full bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white hover:bg-[#9d6ad9]"
            disabled={isVerifyingOtp || otp.join('').length !== 6}
            onClick={handleVerifyOtpAndCreate}
          >
            {isVerifyingOtp ? "Verifying..." : "Verify OTP & Complete Withdrawal"}
          </Button>
          <Button
            variant="outline"
            className="w-full mt-2 bg-transparent text-black dark:text-white/75 border-gray-300 dark:border-gray-700"
            onClick={() => {
              setShowOtpInput(false);
              setOtp(["", "", "", "", "", ""]);
              setOtpKey(null);
            }}
            disabled={isVerifyingOtp}
          >
            Cancel
          </Button>
        </div>
      )}

      <div className="space-y-4 mt-3">
        <div className="space-y-2 flex justify-between items-center text-sm">
          <p className="text-black dark:text-white/75">Payment Method</p>
          <div className="flex items-center">
            {selectedDest?.type === 'bank' ? (
              <p className="text-black dark:text-white/75">Bank Transfer</p>
            ) : (
              (() => {
                const methodName = (selectedCrypto?.name || paymentMethod || 'USDT-TRC20');
                const iconSrc = methodName.toUpperCase().includes('TRC20')
                  ? '/trc20.png'
                  : (selectedCrypto?.icon || (paymentMethod ? paymentImages[paymentMethod] : undefined) || fallbackImg);
                return (
                  <>
                    <Image
                      src={iconSrc}
                      alt={methodName}
                      className="h-6 w-6 mr-2"
                      width={24}
                      height={24}
                    />
                    <p className="text-black dark:text-white/75">{methodName}</p>
                  </>
                );
              })()
            )}
          </div>
        </div>

        <hr className="border-t border-[#31263a]" />

        <div className="space-y-2 flex justify-between items-center text-sm">
          <p className="text-black dark:text-white/75">Amount</p>
          <p className="text-black dark:text-white/75">
            {amount} {selectedCrypto?.name || "USD"}
          </p>
        </div>

        <hr className="border-t border-[#31263a]" />

        {selectedDest?.type === 'bank' ? (
          <div className="space-y-2 text-sm">
            <Field label="Bank Name" value={selectedDest?.bank?.bankName} />
            <Field label="Account Name" value={selectedDest?.bank?.accountName} />
            <Field label="Account Number" value={selectedDest?.bank?.accountNumber} />
            <Field label="IFSC / SWIFT" value={selectedDest?.bank?.ifscSwiftCode} />
            <Field label="Account Type" value={selectedDest?.bank?.accountType} />
          </div>
        ) : (
          <div className="space-y-2 flex justify-between items-center text-sm">
            <p className="text-black dark:text-white/75">Wallet Address</p>
            <p className="text-black dark:text-white/75 break-all text-xs">{toWallet}</p>
          </div>
        )}

        <hr className="border-t border-[#31263a]" />

        <div className="p-3 pt-4 flex justify-between rounded-lg items-center text-sm dark:bg-[#221D22]">
          <p className="text-black dark:text-white/75 text-xs font-semibold">
            To be Withdraw
          </p>
          <p className="text-[#945393] text-lg font-bold">
            {amount} {selectedCrypto?.name || "USD"}
          </p>
        </div>

        <div className="flex flex-col">
          <Button
            className="flex-1 cursor-pointer bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white hover:bg-[#9d6ad9]"
            disabled={isProcessing || isApiProcessing || showOtpInput}
            onClick={handleRequestWithdrawal}
          >
            {isProcessing || isApiProcessing ? (
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 
                        5.291A7.962 7.962 0 014 12H0c0 
                        3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </div>
            ) : (
              "Confirm Withdraw"
            )}
          </Button>

          <Button
            variant="outline"
            className="flex-1 bg-transparent cursor-pointer text-black dark:text-white/75 border-none text-xs mt-1 dark:hover:bg-[#090209] dark:hover:text-white"
            onClick={prevStep}
            disabled={isApiProcessing}
          >
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between w-full py-0.5">
      <span className="text-black dark:text-white/70 text-xs">{label}</span>
      <span className="text-black dark:text-white/85 text-sm font-medium break-all text-right">{value || '-'}</span>
    </div>
  );
}
