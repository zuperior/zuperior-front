"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Step1Form } from "@/components/deposit/Step1Form";
import { Step2Confirmation } from "@/components/deposit/Step2Confirmation";
import { Step3Payment } from "@/components/deposit/Step3Payment";
import { Step4Status } from "@/components/deposit/Step4Status";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import { fetchUserAccountsFromDb, fetchMt5Groups } from "../../store/slices/mt5AccountSlice";
import {
  CheckoutData,
  NewAccountDialogProps,
  PaymentImages,
  PaymentStatusData,
} from "./types";
import { DialogDescription } from "@radix-ui/react-dialog";
import { Button } from "../ui/button";
import { TpAccountSnapshot } from "@/types/user-details";
import { MT5Account } from "@/store/slices/mt5AccountSlice";

// Helper function to map MT5Account to TpAccountSnapshot for deposit dialog
const mapMT5AccountToTpAccount = (mt5Account: MT5Account): TpAccountSnapshot => {
  return {
    tradingplatformaccountsid: parseInt(mt5Account.accountId),
    account_name: parseInt(mt5Account.accountId),
    platformname: "MT5",
    acc: parseInt(mt5Account.accountId),
    account_type: mt5Account.accountType || "Live",
    leverage: mt5Account.leverage || 100,
    balance: (mt5Account.balance || 0).toString(),
    credit: (mt5Account.credit || 0).toString(),
    equity: (mt5Account.equity || 0).toString(),
    margin: (mt5Account.margin || 0).toString(),
    margin_free: (mt5Account.marginFree || 0).toString(),
    margin_level: (mt5Account.marginLevel || 0).toString(),
    closed_pnl: (mt5Account.profit || 0).toString(),
    open_pnl: "0",
    account_type_requested: ((): string => {
      const raw = mt5Account.package || 'Startup';
      return /^standard$/i.test(raw) ? 'Startup' : raw;
    })(),
    provides_balance_history: true,
    tp_account_scf: {
      tradingplatformaccountsid: parseInt(mt5Account.accountId),
      cf_1479: mt5Account.nameOnAccount || ""
    }
  };
};

export function DepositDialog({
  open,
  onOpenChange,
  selectedCrypto,
  lifetimeDeposit,
}: NewAccountDialogProps & { lifetimeDeposit: number }) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const selectedNetwork = selectedCrypto?.networks[0]?.blockchain ?? "";
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(10);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatusData | null>(
    null
  );
  const [cregisId, setCregisId] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false); // Add confirmation state
  const [paymentMethodLimits, setPaymentMethodLimits] = useState<{
    minLimit: number | null;
    maxLimit: number | null;
  } | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const mt5Accounts = useSelector((state: RootState) => state.mt5.accounts);
  // Use all accounts from database - no need to filter by isEnabled anymore
  const filteredAccounts = mt5Accounts.filter(
    (acc) => {
      // Filter valid account IDs only
      const id = String(acc.accountId || '').trim();
      return id && id !== '0' && /^\d+$/.test(id);
    }
  );

  // Dynamic payment images based on selected crypto
  const getPaymentImages = (): PaymentImages => {
    const images: PaymentImages = {};

    if (selectedCrypto) {
      // Use the icon from the selected crypto
      images[selectedCrypto.symbol] = selectedCrypto.icon;
    }

    return images;
  };

  const paymentImages = getPaymentImages();

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch payment method limits when dialog opens
  useEffect(() => {
    const fetchPaymentMethodLimits = async () => {
      if (!open || !selectedCrypto) return;
      
      try {
        // Determine payment method key based on selected crypto
        let methodKey: string | null = null;
        if (selectedCrypto.id === 'USDT-TRC20') {
          methodKey = 'cregis_usdt_trc20';
        } else if (selectedCrypto.id === 'USDT-BEP20') {
          methodKey = 'cregis_usdt_bep20';
        }
        
        if (!methodKey) return;
        
        const response = await fetch('/api/deposit-payment-methods', { cache: 'no-store' });
        const data = await response.json();
        
        if (data.ok && Array.isArray(data.methods)) {
          const method = data.methods.find((m: any) => m.method_key === methodKey);
          if (method) {
            setPaymentMethodLimits({
              minLimit: method.min_limit !== undefined && method.min_limit !== null ? Number(method.min_limit) : null,
              maxLimit: method.max_limit !== undefined && method.max_limit !== null ? Number(method.max_limit) : null,
            });
            console.log('📊 Payment method limits fetched for DepositDialog:', {
              methodKey,
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
  }, [open, selectedCrypto]);

  // Fetch MT5 accounts from DB when dialog opens
  useEffect(() => {
    if (open) {
      if (mt5Accounts.length === 0) {
        console.log('🔄 DepositDialog: Fetching MT5 accounts from DB...');
        dispatch(fetchUserAccountsFromDb() as any);
      }

      // Always ensure we have groups fetched for limits
      console.log('🔄 DepositDialog: Fetching MT5 groups...');
      dispatch(fetchMt5Groups() as any);
    }
  }, [open, dispatch, mt5Accounts.length]);

  const checkPaymentStatus = useCallback(
    async (cregisId: string) => {
      try {
        const response = await fetch("/api/checkout-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cregis_id: cregisId }),
        });

        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const paymentData = await response.json();

        // Handle both old and new data structures
        const receiveAmount =
          paymentData.data?.payment_info?.[0]?.receive_amount ||
          paymentData.data?.payment_info?.[0]?.amount ||
          amount; // Fallback to original amount

        if (countdown <= 0 && paymentData.data?.status === "pending") {
          return {
            event_name: paymentData.data.event_name || "",
            event_type: "expired",
            order_amount: receiveAmount,
            paid_amount: paymentData.data.paid_amount || receiveAmount,
            order_currency: paymentData.data.order_currency,
            cregis_id: paymentData.data.cregis_id,
            timestamp: Math.floor(Date.now() / 1000),
          };
        }

        if (paymentData.data?.status && !["pending", "new"].includes(paymentData.data.status)) {
          return {
            event_name: paymentData.data.event_name || "",
            event_type: paymentData.data.status,
            order_amount: receiveAmount,
            paid_amount: paymentData.data.paid_amount || receiveAmount,
            order_currency: paymentData.data.order_currency,
            cregis_id: paymentData.data.cregis_id,
            timestamp: paymentData.data.created_time
              ? Math.floor(paymentData.data.created_time / 1000)
              : Math.floor(Date.now() / 1000),
          };
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
      return null;
    },
    [countdown, amount]
  );

  useEffect(() => {
    if (step === 3 && checkoutData?.cregis_id && !paymentStatus) {
      setCregisId(checkoutData.cregis_id);
      setIsCheckingStatus(true);

      const checkStatus = async () => {
        const status = await checkPaymentStatus(checkoutData.cregis_id);
        if (status) {
          setPaymentStatus(status);
          setIsCheckingStatus(false);
          setStep(4);
          if (pollingIntervalRef.current)
            clearInterval(pollingIntervalRef.current);
        }
      };

      checkStatus();
      pollingIntervalRef.current = setInterval(checkStatus, 3000);

      return () => {
        if (pollingIntervalRef.current)
          clearInterval(pollingIntervalRef.current);
      };
    }
  }, [step, checkoutData, paymentStatus, checkPaymentStatus]);

  useEffect(() => {
    if (step === 3 && checkoutData) {
      const expireAt = new Date(checkoutData.expire_time).getTime();
      const now = Date.now();
      const initialCountdown = Math.max(0, Math.floor((expireAt - now) / 1000));
      setCountdown(initialCountdown);

      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [step, checkoutData]);

  const nextStep = () => {
    if (
      step === 1 &&
      (!selectedAccount || (selectedCrypto && !selectedNetwork))
    ) {
      return;
    }
    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleContinueToPayment = async () => {
    if (!amount) {
      setError("Please enter an amount");
      return;
    }

    if (!selectedAccount) {
      setError("Please select an account");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const [accountNumber, accountType] = selectedAccount.split("|");

      const requestPayload = {
        order_amount: amount,
        order_currency: selectedCrypto?.symbol || "USDT",
        account_number: accountNumber,
        account_type: accountType,
        network: selectedNetwork,
        crypto_symbol: selectedCrypto?.symbol,
      };

      console.log('💎 [DEPOSIT] Sending checkout request:', requestPayload);
      console.log('💎 [DEPOSIT] Selected crypto:', selectedCrypto);
      console.log('💎 [DEPOSIT] Selected network:', selectedNetwork);

      const token = localStorage.getItem('userToken');

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(requestPayload),
      });

      const data = await response.json();

      console.log('💎 [DEPOSIT] Checkout response:', data);

      if (data.code !== "00000") {
        console.error('❌ [DEPOSIT] Checkout failed:', data);
        throw new Error(data.error || data.msg || "Payment initiation failed");
      }

      setCheckoutData(data.data);

      // Handle payment_info array if it exists
      const cryptoInfo = data.data.payment_info?.find(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) => item.token_symbol === selectedCrypto?.symbol
      );
      if (cryptoInfo && cryptoInfo.exchange_rate) {
        setExchangeRate(Number(cryptoInfo.exchange_rate) || 1);
      } else {
        setExchangeRate(1);
      }

      setCregisId(data.data.cregis_id);

      setStep(3);
    } catch (err) {
      console.error('❌ [DEPOSIT] Payment initiation error:', err);
      const errorMessage = err instanceof Error ? err.message : "Payment initiation failed";
      console.error('❌ [DEPOSIT] Error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setStep(1);
    setPaymentStatus(null);
    setCheckoutData(null);
    setCregisId(null);
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
  };

  // Handle close confirmation for Step 3
  const handleClosePayment = () => {
    setConfirmCloseOpen(true);
  };

  // Handle confirmed close from Step 3
  const handleConfirmClose = () => {
    setConfirmCloseOpen(false);
    resetAllStates();
    onOpenChange(false);
  };

  const resetAllStates = useCallback(() => {
    setStep(1);
    setAmount("");
    setCheckoutData(null);
    setIsProcessing(false);
    setError(null);
    setCountdown(10);
    setPaymentStatus(null);
    setCregisId(null);
    setIsCheckingStatus(false);
    setSelectedAccount("");
    setExchangeRate(1);
    setConfirmCloseOpen(false); // Reset confirmation state
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) resetAllStates();
  }, [open, resetAllStates]);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            // If closing and on step 3, ask for confirmation
            if (step === 3 && checkoutData && !paymentStatus) {
              handleClosePayment();
            } else {
              resetAllStates();
              onOpenChange(isOpen);
            }
          } else {
            onOpenChange(isOpen);
          }
        }}
      >
        <DialogContent
          className="border-2 border-transparent p-6 text-white rounded-[18px] flex flex-col items-center w-full
            [background:linear-gradient(#fff,#fff)_padding-box,conic-gradient(from_var(--border-angle),#ddd,#f6e6fc,theme(colors.purple.400/48%))_border-box] dark:[background:linear-gradient(#070206,#030103)_padding-box,conic-gradient(from_var(--border-angle),#030103,#030103,theme(colors.purple.400/48%))_border-box] animate-border"
          disableOutsideClick={step === 3} // Prevent outside clicks only during payment step
        >
          <DialogTitle className="sr-only">Deposit Funds</DialogTitle>

          <DialogHeader className="w-full ">
            <div className="flex items-center justify-between w-full">
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

          {step === 1 && (
            <Step1Form
              amount={amount}
              setAmount={setAmount}
              selectedNetwork={selectedNetwork}
              selectedCrypto={selectedCrypto}
              nextStep={nextStep}
              accounts={filteredAccounts.map(mapMT5AccountToTpAccount)}
              selectedAccount={selectedAccount}
              setSelectedAccount={setSelectedAccount}
              lifetimeDeposit={lifetimeDeposit}
              paymentMethodLimits={paymentMethodLimits}
            />
          )}

          {step === 2 && (
            <Step2Confirmation
              amount={amount}
              selectedNetwork={selectedNetwork}
              selectedCrypto={selectedCrypto}
              paymentMethod={selectedCrypto?.symbol || ""}
              paymentImages={paymentImages}
              error={error}
              isProcessing={isProcessing}
              selectedAccount={selectedAccount}
              prevStep={prevStep}
              handleContinueToPayment={handleContinueToPayment}
              exchangeRate={exchangeRate}
            />
          )}

          {step === 3 && checkoutData && (
            <Step3Payment
              amount={amount}
              countdown={countdown}
              selectedCrypto={selectedCrypto}
              selectedNetwork={selectedNetwork}
              checkoutData={checkoutData}
              cregisId={cregisId || ""}
              isLoading={isCheckingStatus}
              selectedAccount={selectedAccount}
              onClose={handleClosePayment} // Pass the close handler
            />
          )}

          {step === 4 && paymentStatus && (
            <Step4Status
              statusData={paymentStatus}
              onRetry={handleRetry}
              onClose={() => onOpenChange(false)}
              accountNumber={selectedAccount.split("|")[0]}
              amount={amount}
            />
          )}

          {/* Confirmation Dialog for closing during Step 3 */}
        </DialogContent>
      </Dialog>

      <Dialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <DialogContent className="sm:max-w-[425px] border-[#27272a] bg-[#09090b] text-white z-[9999] gap-4 shadow-2xl p-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-semibold text-white tracking-tight">Stop Deposit?</DialogTitle>
            <DialogDescription className="text-base text-zinc-400 leading-relaxed">
              Are you sure you want to cancel? Your current payment session will be terminated and cannot be resumed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-3 pt-4 sm:justify-end w-full">
            <Button
              variant="outline"
              onClick={() => setConfirmCloseOpen(false)}
              className="flex-1 sm:flex-none border-[#27272a] bg-[#18181b] text-white hover:bg-[#27272a] hover:text-white transition-colors"
            >
              Continue Deposit
            </Button>
            <Button
              variant="destructive"
              className="flex-1 sm:flex-none bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
              onClick={async () => {
                try {
                  // Call cancel API if we have a cregisId
                  if (cregisId) {
                    await fetch("/api/cregis/cancel-payment", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ cregisId }),
                    });
                  }
                } catch (err) {
                  console.error("Error cancelling payment:", err);
                }
                setConfirmCloseOpen(false);
                resetAllStates();
                onOpenChange(false);
              }}
            >
              Cancel Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
