"use client";

import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface TwoFactorVerificationProps {
  email: string;
  otpKey: string;
  onVerify: (otp: string) => Promise<void>;
  onResend?: () => Promise<void>;
  onCancel?: () => void;
}

export function TwoFactorVerification({
  email,
  otpKey,
  onVerify,
  onResend,
  onCancel,
}: TwoFactorVerificationProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
    
    // Start timer
    setTimer(60);
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleOtpChange = (value: string, idx: number) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[idx] = value;
    setOtp(newOtp);
    if (value && idx < otp.length - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsVerifying(true);
    try {
      await onVerify(otpString);
    } catch (error: any) {
      // Error is handled by parent
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) {
      toast.error(`Please wait ${timer} seconds before requesting a new code`);
      return;
    }

    setIsResending(true);
    try {
      if (onResend) {
        await onResend();
        setTimer(60);
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          <Mail className="w-4 h-4 text-[#6242a5]" />
          <span className="text-black dark:text-white/75">
            Verification code sent to
          </span>
        </div>
        <p className="text-sm font-semibold text-[#6242a5] dark:text-[#9f8bcf]">
          {email}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Enter the 6-digit code to complete your login
        </p>
      </div>

      <div className="flex gap-2 justify-center">
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
            className="w-12 h-12 text-center text-lg font-semibold tracking-widest border-2 rounded-md focus:border-[#6242a5] dark:bg-[#1a1a1a] dark:text-white"
            disabled={isVerifying}
          />
        ))}
      </div>

      <div className="space-y-3">
        <Button
          className="w-full bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white hover:bg-[#9d6ad9]"
          disabled={isVerifying || otp.join("").length !== 6}
          onClick={handleVerify}
        >
          {isVerifying ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify & Login"
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">
            Didn't receive the code?
          </span>
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || timer > 0}
            className="text-[#6242a5] dark:text-[#9f8bcf] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? (
              "Sending..."
            ) : timer > 0 ? (
              `Resend in ${timer}s`
            ) : (
              "Resend code"
            )}
          </button>
        </div>

        {onCancel && (
          <Button
            variant="outline"
            className="w-full bg-transparent text-black dark:text-white/75 border-gray-300 dark:border-gray-700"
            onClick={onCancel}
            disabled={isVerifying}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

