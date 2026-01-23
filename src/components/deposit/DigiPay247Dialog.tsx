"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader, VisuallyHidden } from "@/components/ui/dialog";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import { fetchUserAccountsFromDb } from "../../store/slices/mt5AccountSlice";
import { createPayment } from "@/lib/digipay247.service";
import { USDTManualStep1Form } from "./USDTManualStep1Form";

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
  const [amount, setAmount] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
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

  // Fetch payment method limits when dialog opens
  useEffect(() => {
    const fetchPaymentMethodLimits = async () => {
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
            console.log('📊 Payment method limits fetched for DigiPay247:', {
              methodKey: 'digipay247_upi',
              limits: {
                minLimit: method.min_limit,
                maxLimit: method.max_limit,
              }
            });
          }
        }
      } catch (error) {
        console.error('❌ Error fetching payment method limits:', error);
      }
    };
    
    fetchPaymentMethodLimits();
  }, [open]);

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

        console.log('📊 Deposit limits resolved:', {
          groupMinLimit,
          groupMaxLimit,
          paymentMethodMinLimit: paymentMethodLimits?.minLimit,
          paymentMethodMaxLimit: paymentMethodLimits?.maxLimit,
          finalMinLimit,
          finalMaxLimit,
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
      setSelectedAccount("");
      setError(null);
      setPaymentUrl(null);
      setIsProcessing(false);
    }
  }, [open]);

  const handleContinue = async () => {
    if (!amount) {
      setError("Please enter an amount");
      return;
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    // Validate against limits
    if (depositLimits) {
      if (depositLimits.minLimit !== null && amountValue < depositLimits.minLimit) {
        setError(`Minimum deposit amount is $${depositLimits.minLimit.toLocaleString()}`);
        return;
      }
      if (depositLimits.maxLimit !== null && amountValue > depositLimits.maxLimit) {
        setError(`Maximum deposit amount is $${depositLimits.maxLimit.toLocaleString()}`);
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
      const [accountNumber, accountType] = selectedAccount.split("|");

      const result = await createPayment({
        amount,
        currency: 'USD',
        mt5AccountId: accountNumber,
        accountType,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create payment request");
      }

      if (!result.data.paymentUrl) {
        throw new Error("Payment URL not received from DigiPay247");
      }

      console.log('✅ [DigiPay247] Payment request created:', {
        depositId: result.data.depositId,
        transactionId: result.data.transactionId,
        paymentUrl: result.data.paymentUrl,
      });

      setPaymentUrl(result.data.paymentUrl);
      setStep(2);

      // Redirect to payment URL
      window.location.href = result.data.paymentUrl;
    } catch (err) {
      console.error('❌ [DigiPay247] Error creating payment:', err);
      setError(err instanceof Error ? err.message : "Failed to create payment request");
    } finally {
      setIsProcessing(false);
    }
  };

  // Debug: Log when dialog open state changes
  useEffect(() => {
    console.log('[DigiPay247Dialog] Dialog open state:', open);
    if (open) {
      console.log('[DigiPay247Dialog] Dialog is OPEN - should be visible');
    } else {
      console.log('[DigiPay247Dialog] Dialog is CLOSED');
    }
  }, [open]);

  console.log('[DigiPay247Dialog] Rendering with open=', open, 'displayName=', displayName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <VisuallyHidden>
          <DialogTitle>{displayName || 'DigiPay247 UPI Deposit'}</DialogTitle>
        </VisuallyHidden>
        
        {/* Header with spacing */}
        <DialogHeader className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            {displayName || 'DigiPay247 UPI Deposit'}
          </h2>
        </DialogHeader>

        {/* Content area with proper spacing */}
        {step === 1 && (
          <div className="px-6 sm:px-8 pb-6 sm:pb-8">
            <div className="space-y-6">
              <USDTManualStep1Form
                amount={amount}
                setAmount={setAmount}
                selectedAccount={selectedAccount}
                setSelectedAccount={setSelectedAccount}
                accounts={filteredAccounts}
                lifetimeDeposit={lifetimeDeposit}
                paymentMethodLimits={paymentMethodLimits}
                nextStep={handleContinue}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="px-6 sm:px-8 pb-6 sm:pb-8">
            <div className="space-y-6 text-center py-6">
              <p className="text-lg mb-6 text-gray-900 dark:text-white">
                Redirecting to DigiPay247 payment page...
              </p>
              {paymentUrl && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    If you are not redirected automatically, click the button below:
                  </p>
                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg font-medium"
                  >
                    Open Payment Page
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

