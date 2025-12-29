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
import { Step4Status } from "@/components/deposit/Step4Status";
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
import { fetchUserAccountsFromDb, fetchMt5Groups } from "../../store/slices/mt5AccountSlice";
import { NewAccountDialogProps } from "./types";
import { DialogDescription } from "@radix-ui/react-dialog";
import { TpAccountSnapshot } from "@/types/user-details";
import { MT5Account } from "@/store/slices/mt5AccountSlice";
import * as unipaymentService from "@/lib/unipayment.service";
import Image from "next/image";
import QRCode from "react-qr-code";

// Helper function to map MT5Account to TpAccountSnapshot
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

type PaymentMethod = 'crypto' | 'card' | 'binance_pay' | 'google_apple_pay' | 'upi';

interface InvoiceData {
  invoiceId: string;
  invoiceUrl: string;
  status: string;
  paymentMethod: string;
  qrCode?: string;
  cryptoAddress?: string;
  expiresAt?: string;
}

export function UnipaymentDialog({
  open,
  onOpenChange,
  paymentMethod,
  lifetimeDeposit,
}: NewAccountDialogProps & { paymentMethod: PaymentMethod; lifetimeDeposit: number }) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(600); // 10 minutes default
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const mt5Accounts = useSelector((state: RootState) => state.mt5.accounts);
  const filteredAccounts = mt5Accounts.filter(
    (acc) => {
      const id = String(acc.accountId || '').trim();
      return id && id !== '0' && /^\d+$/.test(id);
    }
  );

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch MT5 accounts from DB when dialog opens
  useEffect(() => {
    if (open) {
      if (mt5Accounts.length === 0) {
        console.log('🔄 UnipaymentDialog: Fetching MT5 accounts from DB...');
        dispatch(fetchUserAccountsFromDb() as any);
      }
      dispatch(fetchMt5Groups() as any);
    }
  }, [open, dispatch, mt5Accounts.length]);

  // Check payment status
  const checkPaymentStatus = useCallback(
    async (invoiceId: string) => {
      try {
        const result = await unipaymentService.getInvoiceStatus(invoiceId);

        if (!result.success || !result.data) {
          return null;
        }

        const status = result.data.status;
        if (status === 'paid' || status === 'completed' || status === 'success') {
          return {
            event_type: 'success',
            order_amount: result.data.amount,
            paid_amount: result.data.paidAmount || result.data.amount,
            order_currency: result.data.currency,
            invoice_id: invoiceId,
            timestamp: Math.floor(Date.now() / 1000),
          };
        } else if (status === 'failed' || status === 'cancelled' || status === 'expired') {
          return {
            event_type: status,
            order_amount: result.data.amount,
            paid_amount: result.data.paidAmount || 0,
            order_currency: result.data.currency,
            invoice_id: invoiceId,
            timestamp: Math.floor(Date.now() / 1000),
          };
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
      return null;
    },
    []
  );

  // Poll for payment status
  useEffect(() => {
    if (step === 3 && invoiceData?.invoiceId && !paymentStatus) {
      setIsCheckingStatus(true);

      const checkStatus = async () => {
        const status = await checkPaymentStatus(invoiceData.invoiceId);
        if (status) {
          setPaymentStatus(status);
          setIsCheckingStatus(false);
          setStep(4);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
        }
      };

      checkStatus();
      pollingIntervalRef.current = setInterval(checkStatus, 3000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [step, invoiceData, paymentStatus, checkPaymentStatus]);

  // Countdown timer
  useEffect(() => {
    if (step === 3 && invoiceData?.expiresAt) {
      const expireAt = new Date(invoiceData.expiresAt).getTime();
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
  }, [step, invoiceData]);

  const nextStep = () => {
    if (step === 1 && (!selectedAccount || !amount)) {
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

    // Require network selection for crypto payments
    if (paymentMethod === 'crypto' && !selectedNetwork) {
      setError("Please select a network");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const [accountNumber, accountType] = selectedAccount.split("|");

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
      const successUrl = `${baseUrl}/deposit/success`;
      const cancelUrl = `${baseUrl}/deposit/cancel`;

      const result = await unipaymentService.createInvoice({
        amount,
        currency: 'USD',
        paymentMethod,
        mt5AccountId: accountNumber,
        accountType,
        network: paymentMethod === 'crypto' ? selectedNetwork : undefined,
        successUrl,
        cancelUrl,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create invoice");
      }

      const invoiceData = result.data;

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create invoice");
      }

      setInvoiceData({
        invoiceId: invoiceData.invoiceId,
        invoiceUrl: invoiceData.invoiceUrl,
        status: invoiceData.status,
        paymentMethod: invoiceData.paymentMethod,
        qrCode: invoiceData.qrCode,
        cryptoAddress: invoiceData.cryptoAddress,
        expiresAt: invoiceData.expiresAt,
      });

      // For redirect-based payments (card, binance_pay, google_apple_pay, upi), redirect to Unipayment checkout page
      // Only crypto payments with host_to_host_mode=true show payment details in the dialog
      const redirectBasedMethods = ['card', 'binance_pay', 'google_apple_pay', 'upi'];
      if (redirectBasedMethods.includes(paymentMethod) && invoiceData.invoiceUrl) {
        console.log('🔄 Redirecting to Unipayment checkout:', invoiceData.invoiceUrl);
        // Redirect immediately to Unipayment's hosted checkout page
        window.location.href = invoiceData.invoiceUrl;
        return; // Don't proceed to step 3
      }

      // For crypto payments, show payment details (QR code, address) in the dialog
      if (paymentMethod === 'crypto') {
        setStep(3);
      } else {
        // If we somehow get here without redirecting, show error
        throw new Error('Payment method not properly configured for redirect');
      }
    } catch (err) {
      console.error('❌ Payment initiation error:', err);
      const errorMessage = err instanceof Error ? err.message : "Payment initiation failed";
      setError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setStep(1);
    setPaymentStatus(null);
    setInvoiceData(null);
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
  };

  const resetAllStates = useCallback(() => {
    setStep(1);
    setAmount("");
    setSelectedNetwork("");
    setInvoiceData(null);
    setIsProcessing(false);
    setError(null);
    setCountdown(600);
    setPaymentStatus(null);
    setSelectedAccount("");
    setConfirmCloseOpen(false);
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!open) resetAllStates();
  }, [open, resetAllStates]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPaymentMethodName = () => {
    const names: Record<PaymentMethod, string> = {
      crypto: 'Crypto',
      card: 'Credit/Debit Cards',
      binance_pay: 'Binance Pay',
      google_apple_pay: 'Google/Apple Pay',
      upi: 'UPI',
    };
    return names[paymentMethod] || paymentMethod;
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            if (step === 3 && invoiceData && !paymentStatus) {
              setConfirmCloseOpen(true);
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
          disableOutsideClick={step === 3}
        >
          <DialogTitle className="sr-only">Unipayment Deposit - {getPaymentMethodName()}</DialogTitle>

          <DialogHeader className="w-full">
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
            <UnipaymentStep1Form
              amount={amount}
              setAmount={setAmount}
              selectedNetwork={selectedNetwork}
              setSelectedNetwork={setSelectedNetwork}
              paymentMethod={paymentMethod}
              nextStep={nextStep}
              accounts={filteredAccounts.map(mapMT5AccountToTpAccount)}
              selectedAccount={selectedAccount}
              setSelectedAccount={setSelectedAccount}
              lifetimeDeposit={lifetimeDeposit}
            />
          )}

          {step === 2 && (
            <Step2Confirmation
              amount={amount}
              selectedNetwork={selectedNetwork}
              selectedCrypto={null}
              paymentMethod={getPaymentMethodName()}
              paymentImages={{}}
              error={error}
              isProcessing={isProcessing}
              selectedAccount={selectedAccount}
              prevStep={prevStep}
              handleContinueToPayment={handleContinueToPayment}
              exchangeRate={1}
              requiresNetwork={paymentMethod === 'crypto'}
            />
          )}

          {step === 3 && invoiceData && (
            <div className="w-full space-y-6">
              <h3 className="text-xl font-bold text-center">Complete Payment</h3>
              
              {paymentMethod === 'crypto' && invoiceData.cryptoAddress && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-2">Send {amount} USD worth of crypto to:</p>
                    {invoiceData.qrCode && (
                      <div className="flex justify-center mb-4">
                        <QRCode value={invoiceData.cryptoAddress} size={200} />
                      </div>
                    )}
                    <div className="bg-gray-800 p-4 rounded-lg break-all">
                      <p className="text-sm font-mono">{invoiceData.cryptoAddress}</p>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'upi' && invoiceData.qrCode && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-4">Scan QR code to pay via UPI:</p>
                    <div className="flex justify-center">
                      <QRCode value={invoiceData.qrCode} size={250} />
                    </div>
                  </div>
                </div>
              )}

              {/* This section should rarely be reached for card/APM payments as they redirect immediately */}
              {/* But kept as fallback in case redirect fails */}
              {(paymentMethod === 'card' || paymentMethod === 'binance_pay' || paymentMethod === 'google_apple_pay' || paymentMethod === 'upi') && invoiceData.invoiceUrl && (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-400 mb-4">
                      {paymentMethod === 'upi' 
                        ? 'Scan QR code or click to complete payment via UPI'
                        : 'Click below to complete your payment on Unipayment checkout page'
                      }
                    </p>
                    <Button
                      onClick={() => {
                        window.location.href = invoiceData.invoiceUrl!;
                      }}
                      className="w-full"
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </div>
              )}

              {countdown > 0 && (
                <div className="text-center">
                  <p className="text-sm text-gray-400">Time remaining: {formatTime(countdown)}</p>
                </div>
              )}

              {isCheckingStatus && (
                <div className="text-center">
                  <p className="text-sm text-gray-400">Checking payment status...</p>
                </div>
              )}
            </div>
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
              onClick={() => {
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

// Custom Step1Form for Unipayment with network selection for crypto
function UnipaymentStep1Form({
  amount,
  setAmount,
  selectedNetwork,
  setSelectedNetwork,
  paymentMethod,
  nextStep,
  accounts,
  selectedAccount,
  setSelectedAccount,
  lifetimeDeposit,
}: {
  amount: string;
  setAmount: (value: string) => void;
  selectedNetwork: string;
  setSelectedNetwork: (value: string) => void;
  paymentMethod: PaymentMethod;
  nextStep: () => void;
  accounts: TpAccountSnapshot[];
  selectedAccount: string;
  setSelectedAccount: (account: string) => void;
  lifetimeDeposit: number;
}) {
  const availableNetworks = ['TRC20', 'ERC20', 'BEP20'];

  const handleContinue = () => {
    if (!selectedAccount) {
      toast.error("Account selection required", {
        description: "Please select an account to continue.",
      });
      return;
    }
    if (!amount) {
      toast.error("Amount required", {
        description: "Please enter an amount to continue.",
      });
      return;
    }
    // Require network selection only for crypto payments
    if (paymentMethod === 'crypto' && !selectedNetwork) {
      toast.error("Network selection required", {
        description: "Please select a network to continue.",
      });
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum < 1) {
      toast.error("Please enter a valid amount (minimum $1)");
      return;
    }
    nextStep();
  };

  const [selectedAccountNumber] = selectedAccount.split("|");
  const selectedAccountObj = accounts.find(
    (account) => account.acc.toString() === selectedAccountNumber
  );

  return (
    <div className="w-full px-6">
      <h2 className="text-2xl text-center font-bold dark:text-white/75 text-black">
        Pay {amount || '0'} USD
      </h2>
      <div className="-mt-4 w-full">
        <div className="rounded-lg">
          <div className="mt-4">
            <Label className="text-sm dark:text-white/75 text-black mb-1">Account</Label>
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
                        {selectedAccountObj.acc} (
                        {selectedAccountObj.account_type_requested
                          ? (/^standard$/i.test(selectedAccountObj.account_type_requested)
                            ? 'Startup'
                            : selectedAccountObj.account_type_requested.charAt(0).toUpperCase() + selectedAccountObj.account_type_requested.slice(1))
                          : ''}
                        )
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ${parseFloat(String(selectedAccountObj.balance || 0)).toFixed(2)}
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
                    const accountType = account.account_type || (account as any).accountType || 'Live';
                    return accountType === 'Live';
                  })
                  .filter((account => String(account.acc ?? '').trim() !== '' && String(account.acc) !== '0'))
                  .filter((account) => /^\d+$/.test(String(account.acc)))
                  .reduce((unique: any[], acc) => {
                    const id = String(acc.acc);
                    if (!unique.find((x) => String(x.acc) === id)) unique.push(acc);
                    return unique;
                  }, [])
                  .map((account, index) => (
                    <SelectItem
                      key={`${account.acc}-${index}`}
                      value={`${account.acc}|${account.account_type_requested || ""}`}
                    >
                      <span className="bg-[#9F8ACF]/30 px-2 py-[2px] rounded-[5px] font-semibold text-black dark:text-white/75 tracking-tighter text-[10px]">
                        MT5
                      </span>
                      <span>
                        {account.acc} (
                        {account.account_type_requested
                          ? (/^standard$/i.test(account.account_type_requested)
                            ? 'Startup'
                            : account.account_type_requested.charAt(0).toUpperCase() + account.account_type_requested.slice(1))
                          : ''}
                        )
                      </span>
                      <span className="text-xs text-muted-foreground">${parseFloat(String(account.balance || 0)).toFixed(2)}</span>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      {paymentMethod === 'crypto' && (
        <div className="mt-4 w-full">
          <div className="rounded-lg">
            <div className="mt-4">
              <Label className="text-sm dark:text-white/75 text-black mb-1">Network</Label>
              <Select
                onValueChange={setSelectedNetwork}
                value={selectedNetwork}
              >
                <SelectTrigger className="border-[#362e36] p-5 flex items-center w-full dark:text-white/75 text-black focus:ring-[#8046c9]">
                  <SelectValue placeholder="Select Network" />
                </SelectTrigger>
                <SelectContent className="border-[#1e171e] dark:bg-[#060207] dark:text-white/75 text-black">
                  {availableNetworks.map((network) => (
                    <SelectItem
                      key={network}
                      value={network}
                    >
                      {network}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
      <div className="mt-4">
        <div className="relative w-full">
          <div className="space-y-2 w-full">
            <Label className="text-sm dark:text-white/75 text-black">Amount</Label>
            <div className="relative w-full">
              <Input
                value={amount}
                onChange={(e) => {
                  if (!/^\d*\.?\d*$/.test(e.target.value)) return;
                  setAmount(e.target.value);
                }}
                placeholder="Enter amount"
                className="dark:text-white/75 text-black pr-12 border-[#362e36] p-5 focus-visible:ring-blue-600 w-full"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/75 text-black text-sm">
                USD
              </span>
            </div>
            <p className="text-xs mt-2 text-[#945393] font-medium">
              $1 - $5000.00
            </p>
          </div>
          <Button
            className="flex-1 cursor-pointer bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white hover:bg-[#9d6ad9] w-full mt-3"
            onClick={handleContinue}
            disabled={accounts.length === 0}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}

