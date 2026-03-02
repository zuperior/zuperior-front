"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader, VisuallyHidden } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import { fetchUserAccountsFromDb } from "../../store/slices/mt5AccountSlice";
import { createPayment } from "@/lib/digipay247.service";
import { MT5Account } from "@/store/slices/mt5AccountSlice";
import { Upload, FileText, ExternalLink, Loader2 } from "lucide-react";
import TradingLoader from "@/components/transactions/TradingLoader";

interface NewAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DigiPay247Dialog({
  open,
  onOpenChange,
  lifetimeDeposit,
  displayName,
}: NewAccountDialogProps & {
  lifetimeDeposit: number;
  displayName?: string;
}) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState(""); // USD amount (for API)
  const [inrAmount, setInrAmount] = useState(""); // INR amount (user input)
  const [usdAmountFromInr, setUsdAmountFromInr] = useState(""); // Converted USD from INR
  const [fixedRate, setFixedRate] = useState<number>(92.00); // Default 1 USD = 92 INR
  const [selectedAccount, setSelectedAccount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [depositId, setDepositId] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [utrTransactionId, setUtrTransactionId] = useState(""); // UTR/Transaction ID from user
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [depositLimits, setDepositLimits] = useState<{
    minLimit: number | null;
    maxLimit: number | null;
    source: 'group' | 'payment_method';
  } | null>(null);
  const [loadingLimits, setLoadingLimits] = useState(false);
  const [paymentMethodLimits, setPaymentMethodLimits] = useState<{
    minLimit: number | null;
    maxLimit: number | null;
  } | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const mt5Accounts = useSelector((state: RootState) => state.mt5.accounts);
  const filteredAccounts = mt5Accounts.filter(acc => String(acc.accountId || '').trim() && String(acc.accountId).trim() !== '0');

  // Fetch payment method limits and fixed rate when dialog opens
  useEffect(() => {
    const fetchPaymentMethodData = async () => {
      if (!open) return;

      try {
        const response = await fetch('/api/deposit-payment-methods', { cache: 'no-store' });
        const data = await response.json();

        if (data.ok && Array.isArray(data.methods)) {
          const method = data.methods.find((m: any) => m.method_key === 'digipay247_upi');
          if (method) {
            setPaymentMethodLimits({
              minLimit: method.min_limit !== undefined && method.min_limit !== null ? Number(method.min_limit) : null,
              maxLimit: method.max_limit !== undefined && method.max_limit !== null ? Number(method.max_limit) : null,
            });

            // Set fixed rate from payment method (default to 92.00)
            if (method.fixed_rate !== null && method.fixed_rate !== undefined) {
              setFixedRate(Number(method.fixed_rate));
            }
          }
        }
      } catch (error) {
        console.error('❌ Error fetching payment method data:', error);
      }
    };

    fetchPaymentMethodData();
  }, [open]);

  // Convert INR to USD for UPI payments
  useEffect(() => {
    if (inrAmount) {
      const inrValue = parseFloat(inrAmount);
      if (!isNaN(inrValue) && inrValue > 0) {
        const usdValue = inrValue / fixedRate;
        setUsdAmountFromInr(usdValue.toFixed(2));
        setAmount(usdValue.toFixed(2)); // Set USD amount for processing
      } else {
        setUsdAmountFromInr("");
        setAmount("");
      }
    } else {
      setUsdAmountFromInr("");
      setAmount("");
    }
  }, [inrAmount, fixedRate]);


  // Initialize deposit limits with payment method limits when dialog opens
  useEffect(() => {
    if (!selectedAccount && paymentMethodLimits) {
      setDepositLimits({
        minLimit: paymentMethodLimits.minLimit,
        maxLimit: paymentMethodLimits.maxLimit,
        source: 'payment_method',
      });
    } else if (!selectedAccount) {
      setDepositLimits(null);
    }
  }, [selectedAccount, paymentMethodLimits]);

  // Fetch deposit limits when account is selected
  useEffect(() => {
    const fetchDepositLimits = async () => {
      if (!selectedAccount) {
        setDepositLimits(paymentMethodLimits ? {
          minLimit: paymentMethodLimits.minLimit,
          maxLimit: paymentMethodLimits.maxLimit,
          source: 'payment_method',
        } : null);
        return;
      }

      const [accountNumber] = selectedAccount.split("|");
      if (!accountNumber) {
        setDepositLimits(null);
        return;
      }

      setLoadingLimits(true);
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
        const response = await fetch(`/api/mt5/deposit-limits/${accountNumber}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const data = await response.json();

        // Merge group limits with payment method limits
        const groupMinLimit = data.minLimit !== undefined && data.minLimit !== null ? Number(data.minLimit) : null;
        const groupMaxLimit = data.maxLimit !== undefined && data.maxLimit !== null ? Number(data.maxLimit) : null;

        // Final limits: group takes precedence, fallback to payment method
        const finalMinLimit = groupMinLimit !== null ? groupMinLimit : (paymentMethodLimits?.minLimit ?? null);
        const finalMaxLimit = groupMaxLimit !== null ? groupMaxLimit : (paymentMethodLimits?.maxLimit ?? null);

        setDepositLimits({
          minLimit: finalMinLimit,
          maxLimit: finalMaxLimit,
          source: groupMinLimit !== null || groupMaxLimit !== null ? 'group' : 'payment_method',
        });
      } catch (error) {
        console.error('❌ Error fetching deposit limits:', error);
        // Fallback to payment method limits
        setDepositLimits(paymentMethodLimits ? {
          minLimit: paymentMethodLimits.minLimit,
          maxLimit: paymentMethodLimits.maxLimit,
          source: 'payment_method',
        } : null);
      } finally {
        setLoadingLimits(false);
      }
    };

    fetchDepositLimits();
  }, [selectedAccount, paymentMethodLimits]);

  useEffect(() => {
    if (open && mt5Accounts.length === 0) {
      dispatch(fetchUserAccountsFromDb() as any);
    }
  }, [open, dispatch, mt5Accounts.length]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setAmount("");
      setInrAmount("");
      setUsdAmountFromInr("");
      setSelectedAccount("");
      setError(null);
      setPaymentUrl(null);
      setDepositId(null);
      setTransactionId(null);
      setUtrTransactionId("");
      setProofFile(null);
      setIsProcessing(false);
      setIsCheckingStatus(false);
      setPaymentStatus(null);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }
  }, [open]);

  // Check payment status from API
  const checkPaymentStatus = useCallback(async () => {
    if (!depositId) return null;

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
      if (!token) return null;

      const response = await fetch(`/api/digipay247/status/${depositId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) return null;

      const data = await response.json();
      if (data.success && data.data) {
        return data.data;
      }
    } catch (error) {
      console.error('❌ [DigiPay247] Error checking status:', error);
    }
    return null;
  }, [depositId]);

  // Start status polling
  const startStatusPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    const pollStatus = async () => {
      const status = await checkPaymentStatus();
      if (status) {
        const digipay247Status = status.digipay247Deposit?.status || status.deposit?.status;

        // If status is completed or failed, stop polling
        if (digipay247Status === 'completed' || digipay247Status === 'failed' ||
          status.deposit?.status === 'completed' || status.deposit?.status === 'rejected') {
          setPaymentStatus(status);
          setIsCheckingStatus(false);
          setStep(4);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      }
    };

    // Check immediately
    pollStatus();

    // Then poll every 3 seconds
    pollingIntervalRef.current = setInterval(pollStatus, 3000);
  }, [checkPaymentStatus]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Handle proof submission
  const handleSubmitProof = async () => {
    if (!utrTransactionId.trim()) {
      setError("Please enter UTR/Transaction ID");
      return;
    }

    if (!depositId) {
      setError("Deposit ID not found");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
      if (!token) {
        throw new Error("Authentication required");
      }

      const formData = new FormData();
      formData.append('depositId', depositId);
      formData.append('utrTransactionId', utrTransactionId);
      if (proofFile) {
        formData.append('proofFile', proofFile);
      }

      const response = await fetch('/api/digipay247/submit-proof', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit proof');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit proof');
      }

      setStep(3);
      setIsCheckingStatus(true);

      // Start polling for status
      startStatusPolling();
    } catch (err) {
      console.error('❌ [DigiPay247] Error submitting proof:', err);
      setError(err instanceof Error ? err.message : "Failed to submit proof");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = async () => {
    if (!amount && !inrAmount) {
      setError("Please enter an amount in USD or INR");
      return;
    }

    // Use USD amount if available, otherwise convert from INR
    let amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      const inrValue = parseFloat(inrAmount);
      if (isNaN(inrValue) || inrValue <= 0) {
        setError("Please enter a valid amount");
        return;
      }
      amountValue = inrValue / fixedRate;
    }

    // Validate against limits (limits are in USD)
    if (depositLimits) {
      if (depositLimits.minLimit !== null && amountValue < depositLimits.minLimit) {
        const minInr = depositLimits.minLimit * fixedRate;
        setError(`Minimum deposit amount is ₹${minInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })} INR ($${depositLimits.minLimit} USD)`);
        return;
      }
      if (depositLimits.maxLimit !== null && amountValue > depositLimits.maxLimit) {
        const maxInr = depositLimits.maxLimit * fixedRate;
        setError(`Maximum deposit amount is ₹${maxInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })} INR ($${depositLimits.maxLimit} USD)`);
        return;
      }
    }

    if (!selectedAccount) {
      setError("Please select an account");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Ensure amount is set (convert from INR if needed)
      let finalAmount = amount;
      if (!finalAmount || parseFloat(finalAmount) <= 0) {
        const inrValue = parseFloat(inrAmount);
        if (!isNaN(inrValue) && inrValue > 0) {
          finalAmount = (inrValue / fixedRate).toFixed(2);
          setAmount(finalAmount); // Update state for consistency
        } else {
          throw new Error("Please enter a valid amount");
        }
      }

      const [accountNumber, accountType] = selectedAccount.split("|");

      const result = await createPayment({
        amount: finalAmount,
        currency: 'USD',
        mt5AccountId: accountNumber,
        accountType,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create payment request");
      }

      if (!result.data.paymentUrl) {
        throw new Error("Payment URL not received from SecurePayee");
      }

      setPaymentUrl(result.data.paymentUrl);
      setDepositId(result.data.depositId);
      setTransactionId(result.data.transactionId);
      setStep(2);

      // Redirect to payment URL
      window.open(result.data.paymentUrl, '_blank');
    } catch (err) {
      console.error('❌ [DigiPay247] Error creating payment:', err);
      setError(err instanceof Error ? err.message : "Failed to create payment request");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[95%] lg:max-w-2xl gap-4 bg-background shadow-lg border-2 border-transparent p-6 text-white rounded-[18px] flex flex-col items-center w-full max-h-[90vh] overflow-y-auto [background:linear-gradient(#fff,#fff)_padding-box,conic-gradient(from_var(--border-angle),#ddd,#f6e6fc,theme(colors.purple.400/48%))_border-box] dark:[background:linear-gradient(#070206,#030103)_padding-box,conic-gradient(from_var(--border-angle),#030103,#030103,color-mix(in_oklab,oklch(71.4%_0.203_305.504)_48%,transparent))_border-box] animate-border">
        <VisuallyHidden>
          <DialogTitle>{displayName || 'SecurePayee UPI Deposit'}</DialogTitle>
        </VisuallyHidden>

        {/* Progress Indicator */}
        <DialogHeader className="w-full py-3">
          <div className="flex items-center justify-between w-full pt-2">
            <div className="flex items-center space-x-2 w-full mx-10">
              {[1, 2, 3, 4].map((num) => (
                <React.Fragment key={num}>
                  <div
                    className={`flex h-8 w-8 px-4 mx-0 items-center justify-center rounded-full ${step >= num ? "bg-[#9F8BCF]" : "bg-[#594B7A]"
                      }`}
                  >
                    <span className="text-sm font-medium">{num}</span>
                  </div>
                  {num !== 4 && (
                    <div
                      className={`h-[4px] w-full mx-0 ${step > num ? "bg-[#6B5993]" : "bg-[#392F4F]"
                        }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </DialogHeader>

        {/* Payment Method Label */}
        <div className="pt-2 pb-4">
          <h2 className="text-2xl text-center font-bold dark:text-white/75 text-black">
            {displayName || 'UPI'}
          </h2>
        </div>

        {/* Content area with proper spacing */}
        {step === 1 && (
          <div className="w-full">
            <div className="space-y-6">
              <DigiPay247Step1Form
                amount={amount}
                setAmount={setAmount}
                inrAmount={inrAmount}
                setInrAmount={setInrAmount}
                usdAmountFromInr={usdAmountFromInr}
                selectedAccount={selectedAccount}
                setSelectedAccount={setSelectedAccount}
                accounts={filteredAccounts}
                depositLimits={depositLimits}
                fixedRate={fixedRate}
                nextStep={handleContinue}
                error={error}
                isProcessing={isProcessing}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full">
            <div className="space-y-6">
              <div className="text-center py-4">
                <p className="text-lg mb-4 text-gray-900 dark:text-white">
                  SecurePayee payment page opened in new tab
                </p>
                {paymentUrl && (
                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Payment Page
                  </a>
                )}
              </div>

              <div className="w-full px-4">
                <p className="text-sm text-center text-gray-500 mb-6">
                  After completing the payment on the SecurePayee page, click the button below to verify your transaction.
                </p>

                <Button
                  onClick={() => {
                    setStep(3);
                    setIsCheckingStatus(true);
                    startStatusPolling();
                  }}
                  disabled={isProcessing}
                  className="w-full bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white hover:bg-[#9d6ad9] h-12 text-lg font-medium"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "I have transferred"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="w-full">
            <div className="space-y-6 text-center py-8">
              <TradingLoader />
              <p className="text-lg text-gray-900 dark:text-white">
                Checking payment status...
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Please wait while we verify your payment
              </p>
            </div>
          </div>
        )}

        {step === 4 && paymentStatus && (
          <div className="w-full">
            <div className="space-y-6 text-center py-8">
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${paymentStatus.digipay247Deposit?.status === 'completed' || paymentStatus.deposit?.status === 'completed' || paymentStatus.status === 'completed'
                ? 'bg-green-100 dark:bg-green-900'
                : 'bg-red-100 dark:bg-red-900'
                }`}>
                {(paymentStatus.digipay247Deposit?.status === 'completed' || paymentStatus.deposit?.status === 'completed' || paymentStatus.status === 'completed') ? (
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {paymentStatus.digipay247Deposit?.status === 'completed' || paymentStatus.deposit?.status === 'completed' || paymentStatus.status === 'completed'
                  ? 'Payment Completed'
                  : 'Payment Failed'}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {paymentStatus.digipay247Deposit?.status === 'completed' || paymentStatus.deposit?.status === 'completed' || paymentStatus.status === 'completed'
                  ? 'Your deposit has been processed successfully'
                  : 'Your payment could not be processed'}
              </p>
              <Button
                onClick={() => onOpenChange(false)}
                className="w-full bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white hover:bg-[#9d6ad9]"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// DigiPay247 Step 1 Form Component (UPI with USD and INR inputs)
function DigiPay247Step1Form({
  amount,
  setAmount,
  inrAmount,
  setInrAmount,
  usdAmountFromInr,
  selectedAccount,
  setSelectedAccount,
  accounts,
  depositLimits,
  fixedRate,
  nextStep,
  error,
  isProcessing,
}: {
  amount: string;
  setAmount: (value: string) => void;
  inrAmount: string;
  setInrAmount: (value: string) => void;
  usdAmountFromInr: string;
  selectedAccount: string;
  setSelectedAccount: (account: string) => void;
  accounts: MT5Account[];
  depositLimits: {
    minLimit: number | null;
    maxLimit: number | null;
    source: 'group' | 'payment_method';
  } | null;
  fixedRate: number;
  nextStep: () => void;
  error: string | null;
  isProcessing: boolean;
}) {
  const getAccountPackage = (account: MT5Account): string => {
    const raw = account.package || 'Standard';
    return /^(standard)$/i.test(raw) ? 'Startup' : raw;
  };

  const selectedAccountObj = accounts.find(
    (account) => account.accountId === selectedAccount
  );

  const getLimitMessage = () => {
    if (!depositLimits) {
      return { min: 'N/A', max: 'N/A', message: 'Limits not configured' };
    }

    const minLimit = depositLimits.minLimit;
    const maxLimit = depositLimits.maxLimit;

    if (minLimit === null && maxLimit === null) {
      return { min: 'N/A', max: 'N/A', message: 'Limits not configured in admin panel' };
    }

    // Convert USD limits to INR
    const minInr = minLimit !== null && minLimit !== undefined ? minLimit * fixedRate : null;
    const maxInr = maxLimit !== null && maxLimit !== undefined ? maxLimit * fixedRate : null;

    return {
      min: minInr !== null ? `₹${minInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : 'Not set',
      max: maxInr !== null ? `₹${maxInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : 'Not set',
      clickAmount: maxInr !== null ? maxInr.toString() : '0'
    };
  };

  const handleUsdAmountChange = (value: string) => {
    // Allow decimals for USD - allow free typing without conversion
    if (!/^\d*\.?\d*$/.test(value)) return;
    setAmount(value);
    toast.dismiss();

    // Clear INR if USD is empty or just a dot
    if (value === "" || value === ".") {
      setInrAmount("");
    }
  };

  const handleUsdBlur = () => {
    // When USD field loses focus, format it properly
    const usdNum = parseFloat(amount);
    if (!isNaN(usdNum) && usdNum > 0) {
      setAmount(usdNum.toFixed(2));
      const inrValue = Math.round(usdNum * fixedRate);
      setInrAmount(inrValue.toString());

      // Validate against limits
      if (depositLimits) {
        const minLimit = depositLimits.minLimit;
        const maxLimit = depositLimits.maxLimit;

        if (minLimit !== null && minLimit !== undefined && usdNum < minLimit) {
          const minInr = minLimit * fixedRate;
          toast.error(`Minimum deposit for this account is ₹${minInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })} INR ($${minLimit} USD)`);
        } else if (maxLimit !== null && maxLimit !== undefined && usdNum > maxLimit) {
          const maxInr = maxLimit * fixedRate;
          toast.error(`Maximum deposit for this account is ₹${maxInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })} INR ($${maxLimit} USD)`);
        }
      }
    }
  };

  const handleInrAmountChange = (value: string) => {
    // For INR, only allow integers (no decimals) - allow free typing without conversion
    if (!/^\d*$/.test(value)) return;
    setInrAmount(value);
    toast.dismiss();

    // Clear USD if INR is empty
    if (value === "") {
      setAmount("");
    }
  };

  const handleInrBlur = () => {
    // When INR field loses focus, format USD properly
    const inrNum = parseFloat(inrAmount);
    if (!isNaN(inrNum) && inrNum > 0) {
      const usdValue = inrNum / fixedRate;
      setAmount(usdValue.toFixed(2));

      // Validate against limits
      if (depositLimits) {
        const usdValueNum = parseFloat(usdValue.toFixed(2));
        const minLimit = depositLimits.minLimit;
        const maxLimit = depositLimits.maxLimit;

        if (minLimit !== null && minLimit !== undefined && usdValueNum < minLimit) {
          const minInr = minLimit * fixedRate;
          toast.error(`Minimum deposit for this account is ₹${minInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })} INR ($${minLimit} USD)`);
        } else if (maxLimit !== null && maxLimit !== undefined && usdValueNum > maxLimit) {
          const maxInr = maxLimit * fixedRate;
          toast.error(`Maximum deposit for this account is ₹${maxInr.toLocaleString('en-IN', { maximumFractionDigits: 0 })} INR ($${maxLimit} USD)`);
        }
      }
    }
  };

  const limits = getLimitMessage();

  return (
    <div className="w-full">
      {/* Account Selection */}
      <div className="mb-6">
        <Label className="text-sm dark:text-white/75 text-black mb-3 block">Account</Label>
        <Select
          onValueChange={setSelectedAccount}
          value={selectedAccount}
          disabled={accounts.length === 0}
        >
          <SelectTrigger className="border-[#362e36] p-5 flex items-center w-full dark:text-white/75 text-black dark:bg-transparent bg-white focus:ring-[#8046c9]">
            <SelectValue placeholder="Select Account">
              {selectedAccountObj ? (
                <span className="flex items-center">
                  <span className="bg-[#9F8ACF]/30 px-2 py-[2px] rounded-[5px] font-semibold text-black dark:text-white/75 tracking-tighter text-[10px]">
                    MT5
                  </span>
                  <span className="ml-2 dark:text-white/75 text-black">
                    {selectedAccountObj.accountId} ({getAccountPackage(selectedAccountObj)})
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ${parseFloat((selectedAccountObj.balance || 0).toString()).toFixed(2)}
                  </span>
                </span>
              ) : (
                "Select Account"
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="border-[#1e171e] dark:bg-[#060207]">
            {accounts
              .filter((account) => {
                const accountType = account.accountType || 'Live';
                return accountType === 'Live';
              })
              .map((account, index) => (
                <SelectItem
                  key={`${account.accountId}-${index}`}
                  value={account.accountId}
                >
                  <span className="bg-[#9F8ACF]/30 px-2 py-[2px] rounded-[5px] font-semibold text-black dark:text-white/75 tracking-tighter text-[10px]">
                    MT5
                  </span>
                  <span>
                    {account.accountId} ({getAccountPackage(account)})
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ${parseFloat((account.balance || 0).toString()).toFixed(2)}
                  </span>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
      </div>

      {/* Amount Field - USD and INR Inputs */}
      <div className="mb-6">
        <Label className="text-sm dark:text-white/75 text-black mb-3 block">Amount</Label>
        <div className="space-y-3">
          {/* USD Input */}
          <div className="relative w-full">
            <Input
              value={amount}
              onChange={(e) => handleUsdAmountChange(e.target.value)}
              onBlur={handleUsdBlur}
              placeholder="Enter amount in USD"
              className="dark:text-white/75 text-black pr-12 border-[#362e36] p-5 focus-visible:ring-blue-600 w-full"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/75 text-black text-sm font-medium">
              USD
            </span>
          </div>

          {/* INR Input */}
          <div className="relative w-full">
            <Input
              value={inrAmount}
              onChange={(e) => handleInrAmountChange(e.target.value)}
              onBlur={handleInrBlur}
              placeholder="Enter amount in INR"
              className="dark:text-white/75 text-black pr-12 border-[#362e36] p-5 focus-visible:ring-blue-600 w-full"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/75 text-black text-sm font-medium">
              INR
            </span>
          </div>

          {/* Exchange Rate Info */}
          {amount && parseFloat(amount) > 0 && (
            <p className="text-xs mt-1 text-gray-400 flex items-center gap-2">
              <span>Exchange Rate:</span>
              <span className="font-medium">1 USD = {fixedRate.toFixed(2)} INR</span>
            </p>
          )}
        </div>

        {/* Deposit Limits */}
        {limits.message !== 'Limits not configured' && (
          <p className="text-xs mt-2 text-[#945393] font-medium">
            Deposit limit: {depositLimits?.minLimit !== null && depositLimits?.minLimit !== undefined
              ? `$${depositLimits.minLimit.toFixed(2)}`
              : 'Not set'} - {depositLimits?.maxLimit !== null && depositLimits?.maxLimit !== undefined
                ? `$${depositLimits.maxLimit.toFixed(2)}`
                : 'Not set'} ({limits.min} - {limits.max} INR)
          </p>
        )}

        {/* Error Message */}
        {error && (
          <p className="text-xs mt-2 text-red-500">{error}</p>
        )}
      </div>

      {/* Continue Button */}
      <Button
        className="w-full cursor-pointer bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white hover:bg-[#9d6ad9]"
        onClick={nextStep}
        disabled={accounts.length === 0 || !selectedAccount || (!amount && !inrAmount) || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          'Continue'
        )}
      </Button>
    </div>
  );
}


// DigiPay247 Step 2 Proof Form Component
function DigiPay247Step2ProofForm({
  utrTransactionId,
  setUtrTransactionId,
  proofFile,
  setProofFile,
  onSubmit,
  isProcessing,
  error,
}: {
  utrTransactionId: string;
  setUtrTransactionId: (id: string) => void;
  proofFile: File | null;
  setProofFile: (file: File | null) => void;
  onSubmit: () => void;
  isProcessing: boolean;
  error: string | null;
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type (images and PDFs)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Invalid file type", {
          description: "Please upload only images (JPEG, PNG) or PDF files"
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File too large", {
          description: "File size must be less than 5MB"
        });
        return;
      }

      setProofFile(file);
      toast.success("File uploaded successfully");
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setProofFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info("File removed");
  };

  return (
    <div className="w-full">
      <h3 className="text-xl font-bold text-center mb-6 text-gray-900 dark:text-white">
        Enter Payment Details
      </h3>

      {/* UTR/Transaction ID Field */}
      <div className="mb-6">
        <Label className="text-sm dark:text-white/75 text-black mb-1">
          UTR / Transaction ID *
        </Label>
        <Input
          placeholder="Enter UTR or Transaction ID"
          value={utrTransactionId}
          onChange={(e) => setUtrTransactionId(e.target.value)}
          className="dark:text-white/75 text-black border-[#362e36] p-5 focus-visible:ring-blue-600 w-full"
        />
        <p className="text-xs text-gray-500 mt-1">
          Enter the UTR number or transaction ID from your payment
        </p>
      </div>

      {/* Payment Proof Upload */}
      <div className="mb-6">
        <Label className="text-sm dark:text-white/75 text-black mb-1">
          Payment Screenshot (Optional)
        </Label>
        <div className="space-y-3">
          {!proofFile ? (
            <div
              className="border-2 border-dashed border-[#362e36] dark:border-[#362e36] rounded-lg p-6 text-center cursor-pointer hover:border-[#8046c9] transition-colors"
              onClick={handleFileUpload}
            >
              <Upload className="mx-auto h-8 w-8 text-[#945393] mb-2" />
              <p className="text-sm dark:text-white/75 text-black">
                Click to upload payment screenshot
              </p>
              <p className="text-xs text-[#945393] mt-1">
                Images (JPEG, PNG) or PDF files up to 5MB
              </p>
            </div>
          ) : (
            <div className="border border-[#362e36] dark:border-[#362e36] rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-[#8046c9]" />
                <div>
                  <p className="text-sm font-medium dark:text-white/75 text-black">{proofFile.name}</p>
                  <p className="text-xs text-[#945393]">
                    {(proofFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={removeFile}
                className="text-red-600 hover:text-red-700 border-red-300"
              >
                Remove
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-xs mb-4 text-red-500">{error}</p>
      )}

      {/* Submit Button */}
      <Button
        className="w-full cursor-pointer bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white hover:bg-[#9d6ad9]"
        onClick={onSubmit}
        disabled={isProcessing || !utrTransactionId.trim()}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          'Submit Payment Proof'
        )}
      </Button>
    </div>
  );
}
