"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
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
import { NewAccountDialogProps, Cryptocurrency } from "./types";
import { DialogDescription } from "@radix-ui/react-dialog";
import { TpAccountSnapshot } from "@/types/user-details";
import { MT5Account } from "@/store/slices/mt5AccountSlice";
import * as unipaymentService from "@/lib/unipayment.service";
import Image from "next/image";
import QRCode from "react-qr-code";
import { CopyIcon } from "lucide-react";

// Helper function to format crypto amounts: BTC/ETH show 5 decimals, others show 2 decimals
const formatCryptoAmount = (amount: string | number, symbol?: string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '0';
  
  const upperSymbol = symbol?.toUpperCase();
  if (upperSymbol === 'BTC' || upperSymbol === 'ETH') {
    return numAmount.toFixed(5);
  }
  return numAmount.toFixed(2);
};

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

type PaymentMethod = 'crypto' | 'card' | 'google_apple_pay' | 'upi';

interface InvoiceData {
  invoiceId: string;
  invoiceUrl: string;
  status: string;
  paymentMethod: string;
  qrCode?: string;
  cryptoAddress?: string;
  expiresAt?: string;
  payCurrency?: string;
  payAmount?: string;
  priceAmount?: string;
  priceCurrency?: string;
  network?: string;
}

export function UnipaymentDialog({
  open,
  onOpenChange,
  paymentMethod,
  selectedCrypto,
  availableCryptos,
  lifetimeDeposit,
}: NewAccountDialogProps & { 
  paymentMethod: PaymentMethod; 
  selectedCrypto?: Cryptocurrency | null;
  availableCryptos?: Cryptocurrency[];
  lifetimeDeposit: number;
}) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  // For crypto payments, allow selection from availableCryptos or use selectedCrypto if provided
  const [currentSelectedCrypto, setCurrentSelectedCrypto] = useState<Cryptocurrency | null>(selectedCrypto || null);
  const defaultNetwork = currentSelectedCrypto?.networks[0]?.blockchain || "";
  const [selectedNetwork, setSelectedNetwork] = useState<string>(defaultNetwork);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3600); // 1 hour default
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [cryptoAmount, setCryptoAmount] = useState<string>("");
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  // For UPI: INR amount and USD conversion
  const [inrAmount, setInrAmount] = useState<string>("");
  const [usdAmountFromInr, setUsdAmountFromInr] = useState<string>("");
  const USD_INR_RATE = 83; // Default USD/INR exchange rate (can be made dynamic later)
  
  // Update network when currentSelectedCrypto changes
  useEffect(() => {
    if (currentSelectedCrypto && currentSelectedCrypto.networks.length > 0) {
      setSelectedNetwork(currentSelectedCrypto.networks[0].blockchain);
    }
  }, [currentSelectedCrypto]);
  
  // Reset selected crypto when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setCurrentSelectedCrypto(selectedCrypto || null);
      setExchangeRate(null);
      setCryptoAmount("");
      setInrAmount("");
      setUsdAmountFromInr("");
    }
  }, [open, selectedCrypto]);

  // Convert INR to USD for UPI payments
  useEffect(() => {
    if (paymentMethod === 'upi' && inrAmount) {
      const inrValue = parseFloat(inrAmount);
      if (!isNaN(inrValue) && inrValue > 0) {
        const usdValue = inrValue / USD_INR_RATE;
        setUsdAmountFromInr(usdValue.toFixed(2));
        setAmount(usdValue.toFixed(2)); // Set USD amount for processing
      } else {
        setUsdAmountFromInr("");
        setAmount("");
      }
    } else if (paymentMethod !== 'upi') {
      setInrAmount("");
      setUsdAmountFromInr("");
    }
  }, [inrAmount, paymentMethod]);
  
  // Fetch exchange rate and convert USD to crypto when amount or crypto changes
  useEffect(() => {
    if (paymentMethod === 'crypto' && currentSelectedCrypto && amount && parseFloat(amount) > 0) {
      // Skip rate calculation for USDT since USD and USDT have 1:1 ratio
      if (currentSelectedCrypto.symbol.toUpperCase() === 'USDT') {
        const usdAmount = parseFloat(amount);
        setExchangeRate(1);
        setCryptoAmount(formatCryptoAmount(usdAmount, currentSelectedCrypto.symbol));
        setIsLoadingRate(false);
        return;
      }

      const fetchRate = async () => {
        setIsLoadingRate(true);
        try {
            const usdAmount = parseFloat(amount);
          
          // Skip if amount is too low (less than $10)
          if (usdAmount < 10) {
            setExchangeRate(null);
            setCryptoAmount("");
            setIsLoadingRate(false);
            return;
          }
          
          // Use Get Quote API - returns netAmount directly from Unipayment
          const result = await unipaymentService.getExchangeRate('USD', currentSelectedCrypto.symbol, usdAmount);
          if (result.success && result.netAmount !== undefined) {
            setExchangeRate(result.rate || 1);
            // Use netAmount directly from the quote response and format it
            setCryptoAmount(formatCryptoAmount(result.netAmount, currentSelectedCrypto.symbol));
          } else {
            setExchangeRate(null);
            setCryptoAmount("");
          }
        } catch (error) {
          // Don't log error if it's a minimum amount error (expected behavior)
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (!errorMessage.includes('minimum amount') && !errorMessage.includes('below the minimum')) {
          console.error('Error fetching exchange rate:', error);
          }
          setExchangeRate(null);
          setCryptoAmount("");
        } finally {
          setIsLoadingRate(false);
        }
      };
      
      fetchRate();
    } else {
      setExchangeRate(null);
      setCryptoAmount("");
    }
  }, [amount, currentSelectedCrypto, paymentMethod]);

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

  // Countdown timer - varies by payment method
  // UPI: 5 minutes, Others: 1 hour (or from invoiceData.expiresAt)
  useEffect(() => {
    if (step === 3 && invoiceData) {
      let intervalId: NodeJS.Timeout;
      
      // Calculate initial countdown
      const calculateCountdown = () => {
        if (invoiceData?.expiresAt) {
      const expireAt = new Date(invoiceData.expiresAt).getTime();
      const now = Date.now();
          const remaining = Math.max(0, Math.floor((expireAt - now) / 1000));
          return remaining;
        } else {
          // Fallback based on payment method
          if (paymentMethod === 'upi') {
            return 5 * 60; // 5 minutes for UPI
          }
          return 3600; // 1 hour for others
        }
      };

      // Set initial countdown
      const initialCountdown = calculateCountdown();
      setCountdown(initialCountdown);

      // Start interval to update countdown every second
      intervalId = setInterval(() => {
        const remaining = calculateCountdown();
        setCountdown(remaining);
        
        if (remaining <= 0) {
          clearInterval(intervalId);
        }
      }, 1000);

      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
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

    // Validate minimum deposit for UPI (2000 INR / ~25 USD as per gateway)
    if (paymentMethod === 'upi') {
      const inrValue = parseFloat(inrAmount);
      if (isNaN(inrValue) || inrValue < 2000) {
        setError("Minimum deposit amount for UPI is ₹2,000 INR");
        return;
      }
      if (inrValue > 100000) {
        setError("Maximum deposit amount for UPI is ₹1,00,000 INR");
        return;
      }
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

      // Determine crypto symbol and network for crypto payments
      const cryptoSymbol = paymentMethod === 'crypto' && currentSelectedCrypto ? currentSelectedCrypto.symbol : undefined;
      const network = paymentMethod === 'crypto' ? selectedNetwork : undefined;

      // For UPI, pass INR amount in metadata
      const result = await unipaymentService.createInvoice({
        amount,
        currency: 'USD',
        paymentMethod,
        mt5AccountId: accountNumber,
        accountType,
        network,
        cryptoSymbol, // Pass crypto symbol to backend
        successUrl,
        cancelUrl,
        inrAmount: paymentMethod === 'upi' ? inrAmount : undefined, // Pass INR amount for UPI
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create invoice");
      }

      const invoiceData = result.data;

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to create invoice");
      }

      console.log('📥 [Unipayment] Invoice created:', {
        invoiceId: invoiceData.invoiceId,
        invoiceUrl: invoiceData.invoiceUrl,
        paymentMethod: paymentMethod,
        hasInvoiceUrl: !!invoiceData.invoiceUrl,
        hasCryptoAddress: !!invoiceData.cryptoAddress,
        hasQrCode: !!invoiceData.qrCode,
      });

      // Use the converted crypto amount from Unipayment invoice response (payAmount)
      // This is the authoritative amount that matches what Unipayment dashboard shows
      const invoicePayAmount = invoiceData.payAmount || (cryptoAmount && paymentMethod === 'crypto' ? cryptoAmount : undefined);
      const invoicePayCurrency = invoiceData.payCurrency || (currentSelectedCrypto?.symbol && paymentMethod === 'crypto' ? currentSelectedCrypto.symbol : undefined);
      
      console.log('📊 [Unipayment] Invoice created with amounts:', {
        priceAmount: invoiceData.priceAmount,
        priceCurrency: invoiceData.priceCurrency,
        payAmount: invoicePayAmount,
        payCurrency: invoicePayCurrency,
        calculatedCryptoAmount: cryptoAmount,
      });

      // Calculate expiration time - use expirationTime from API, validate it's in the future
      // For UPI: Use 5 minutes expiration time (as per gateway requirements)
      // For other methods: Use expirationTime from API or 1 hour fallback
      let expiresAtTime: string;
      const now = Date.now();
      
      if (paymentMethod === 'upi') {
        // UPI uses 5-minute expiration time
        expiresAtTime = new Date(now + 5 * 60 * 1000).toISOString(); // 5 minutes
        console.log('⏰ [Unipayment] UPI payment - using 5-minute expiration time');
      } else {
        // Use expirationTime first (this is the correct field from Unipayment API)
        if (invoiceData.expirationTime) {
          const expirationDate = new Date(invoiceData.expirationTime);
          // Validate that expiration time is in the future, if not use 1 hour from now
          if (expirationDate.getTime() > now) {
            expiresAtTime = expirationDate.toISOString();
          } else {
            console.warn('⚠️ [Unipayment] Expiration time from API is in the past, using 1 hour from now');
            expiresAtTime = new Date(now + 60 * 60 * 1000).toISOString();
          }
        } else {
          // Fallback: 1 hour from now if no expiration time from API
          expiresAtTime = new Date(now + 60 * 60 * 1000).toISOString();
        }
      }

      console.log('⏰ [Unipayment] Setting expiration time:', {
        expiresAt: expiresAtTime,
        originalExpiresAt: invoiceData.expiresAt,
        expirationTime: invoiceData.expirationTime,
        expiresAtTime,
        now: new Date(now).toISOString(),
        remainingSeconds: Math.floor((new Date(expiresAtTime).getTime() - now) / 1000),
      });

      setInvoiceData({
        invoiceId: invoiceData.invoiceId,
        invoiceUrl: invoiceData.invoiceUrl,
        status: invoiceData.status,
        paymentMethod: invoiceData.paymentMethod,
        qrCode: invoiceData.qrCode,
        cryptoAddress: invoiceData.cryptoAddress,
        expiresAt: expiresAtTime,
        payAmount: invoicePayAmount,
        payCurrency: invoicePayCurrency,
        priceAmount: invoiceData.priceAmount || amount,
        priceCurrency: invoiceData.priceCurrency || 'USD',
      });
      
      // Update cryptoAmount to use the invoice's payAmount if available
      if (paymentMethod === 'crypto' && invoicePayAmount) {
        setCryptoAmount(invoicePayAmount);
      }

      // For redirect-based payments (card, google_apple_pay, upi), open in new tab
      // Only crypto payments with host_to_host_mode=true show payment details in the dialog
      const redirectBasedMethods = ['card', 'google_apple_pay', 'upi'];
      
      if (redirectBasedMethods.includes(paymentMethod)) {
        if (invoiceData.invoiceUrl) {
          console.log('🔄 Opening Unipayment checkout in new tab:', invoiceData.invoiceUrl);
          // Open Unipayment checkout page in new tab
          window.open(invoiceData.invoiceUrl, '_blank');
          // Proceed to step 3 to show redirect message
          setStep(3);
          return;
        } else {
          console.error('❌ [Unipayment] No invoiceUrl returned for redirect-based payment method:', paymentMethod);
          throw new Error('Payment redirect URL not received from Unipayment. Please try again.');
        }
      }

      // For crypto payments, show payment details (QR code, address) in the dialog
      if (paymentMethod === 'crypto') {
        if (!invoiceData.cryptoAddress && !invoiceData.qrCode) {
          console.error('❌ [Unipayment] No crypto address or QR code returned for crypto payment');
          throw new Error('Payment details not received from Unipayment. Please try again.');
        }
        setStep(3);
      } else {
        // Unknown payment method
        console.error('❌ [Unipayment] Unknown payment method:', paymentMethod);
        throw new Error(`Payment method "${paymentMethod}" is not supported`);
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
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours} hr ${mins} min ${secs} sec`;
    }
    return `${mins} min ${secs} sec`;
  };

  const getPaymentMethodName = () => {
    // For crypto payments, format as crypto-BTC, crypto-USDT-BEP20, etc.
    if (paymentMethod === 'crypto' && currentSelectedCrypto && selectedNetwork) {
      const networkPart = selectedNetwork ? `-${selectedNetwork.toUpperCase()}` : '';
      return `crypto-${currentSelectedCrypto.symbol.toUpperCase()}${networkPart}`;
    }
    
    const names: Record<PaymentMethod, string> = {
      crypto: 'Crypto',
      card: 'Credit/Debit Cards',
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
          className="border-2 border-transparent p-4 sm:p-6 text-white rounded-[18px] flex flex-col items-center w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto
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
              amount={paymentMethod === 'upi' ? inrAmount : amount}
              setAmount={paymentMethod === 'upi' ? setInrAmount : setAmount}
              selectedNetwork={selectedNetwork}
              setSelectedNetwork={setSelectedNetwork}
              paymentMethod={paymentMethod}
              selectedCrypto={currentSelectedCrypto}
              setSelectedCrypto={setCurrentSelectedCrypto}
              availableCryptos={availableCryptos}
              cryptoAmount={cryptoAmount}
              exchangeRate={exchangeRate}
              isLoadingRate={isLoadingRate}
              nextStep={nextStep}
              accounts={filteredAccounts.map(mapMT5AccountToTpAccount)}
              selectedAccount={selectedAccount}
              setSelectedAccount={setSelectedAccount}
              lifetimeDeposit={lifetimeDeposit}
              usdAmountFromInr={usdAmountFromInr}
            />
          )}

          {step === 2 && (
            <Step2Confirmation
              amount={paymentMethod === 'crypto' && cryptoAmount && currentSelectedCrypto ? cryptoAmount : amount}
              usdAmount={amount}
              selectedNetwork={selectedNetwork}
              selectedCrypto={currentSelectedCrypto}
              paymentMethod={getPaymentMethodName()}
              paymentImages={currentSelectedCrypto ? { [currentSelectedCrypto.symbol]: currentSelectedCrypto.icon } : {}}
              error={error}
              isProcessing={isProcessing}
              selectedAccount={selectedAccount}
              prevStep={prevStep}
              handleContinueToPayment={handleContinueToPayment}
              exchangeRate={exchangeRate || 1}
              requiresNetwork={paymentMethod === 'crypto'}
            />
          )}

          {step === 3 && invoiceData && (
            <div className="w-full space-y-6">
              {/* Header */}
              <h3 className="text-xl font-bold text-center dark:text-white text-black">
                {paymentMethod === 'crypto' && invoiceData.payAmount && invoiceData.payCurrency
                  ? `Pay ${formatCryptoAmount(invoiceData.payAmount, invoiceData.payCurrency)} ${invoiceData.payCurrency}-${selectedNetwork}` 
                  : paymentMethod === 'crypto' && cryptoAmount && currentSelectedCrypto
                  ? `Pay ${cryptoAmount} ${currentSelectedCrypto.symbol}-${selectedNetwork}` 
                  : `Pay ${amount} ${currentSelectedCrypto ? `${currentSelectedCrypto.symbol}-${selectedNetwork}` : 'USD'}`}
              </h3>
              
              {/* Redirect Message for Card/APM Payments */}
              {['card', 'google_apple_pay', 'upi'].includes(paymentMethod) && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 space-y-4 text-center">
                  <div className="flex justify-center">
                    <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold dark:text-white text-black mb-2">
                      You have been redirected to a new tab
                    </h4>
                    <p className="text-sm text-gray-400 dark:text-white/75 text-black/75 mb-4">
                      Please complete your payment in the new tab. Once payment is completed, you can check your transaction status here.
                    </p>
                    <Link
                      href="/transactions"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white rounded-lg hover:opacity-90 transition text-sm font-medium"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      Click here to view transaction status
                    </Link>
                  </div>
                </div>
              )}
              
              {/* Payment Summary */}
              {paymentMethod === 'crypto' && invoiceData.cryptoAddress && (
                <div className="space-y-4">
                  <div className="bg-gray-800 dark:bg-[#1a1a1a] rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Amount to Send:</span>
                      <span className="text-sm font-semibold dark:text-white text-black">
                        {invoiceData.payAmount && invoiceData.payCurrency
                          ? `${formatCryptoAmount(invoiceData.payAmount, invoiceData.payCurrency)} ${invoiceData.payCurrency} (${invoiceData.priceAmount || amount} ${invoiceData.priceCurrency || 'USD'})`
                          : cryptoAmount && currentSelectedCrypto 
                          ? `${cryptoAmount} ${currentSelectedCrypto.symbol} (${amount} USD)` 
                          : `${amount} ${currentSelectedCrypto ? currentSelectedCrypto.symbol : 'USD'}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Expires At:</span>
                      <span className="text-sm font-semibold dark:text-white text-black">
                        {formatTime(countdown)}
                      </span>
                    </div>
                    {selectedAccount && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Account Number:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold dark:text-white text-black">
                              {selectedAccount.split("|")[0]}
                            </span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(selectedAccount.split("|")[0]);
                                toast.success("Account number copied!");
                              }}
                              className="text-gray-400 hover:text-white"
                            >
                              <CopyIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Account Type:</span>
                          <span className="text-sm font-semibold dark:text-white text-black">
                            {selectedAccount.split("|")[1]?.charAt(0).toUpperCase() + selectedAccount.split("|")[1]?.slice(1) || 'Not specified'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Warning Box */}
                  <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 flex items-start gap-3">
                    <div className="text-purple-400 mt-0.5">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-red-400 flex-1">
                      Please complete your payment before the timer expires to avoid cancellation.
                    </p>
                  </div>

                  {/* Pay with Crypto Section */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold dark:text-white text-black">
                      Pay with {currentSelectedCrypto ? currentSelectedCrypto.name : 'Crypto'}
                    </h4>
                    
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                      {/* QR Code */}
                      <div className="flex-1 flex flex-col items-center">
                        {invoiceData.cryptoAddress && (
                          <>
                            <div className="bg-white p-4 rounded-lg mb-2">
                              <QRCode 
                                value={invoiceData.cryptoAddress} 
                                size={250}
                              />
                            </div>
                            <p className="text-sm text-gray-400 mt-2">Scan to send {currentSelectedCrypto?.symbol || 'crypto'}</p>
                          </>
                        )}
                        {invoiceData.qrCode && !invoiceData.cryptoAddress && (
                          <div className="flex justify-center mb-2">
                            <img src={invoiceData.qrCode} alt="Payment QR Code" className="max-w-[250px]" />
                          </div>
                        )}
                      </div>

                      {/* Address and Network Info */}
                      <div className="flex-1 space-y-4">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Network</p>
                          <p className="text-sm font-semibold dark:text-white text-black">
                            {selectedNetwork === 'BEP20' ? 'BNB Smart Chain' :
                             selectedNetwork === 'TRC20' ? 'TRON' :
                             selectedNetwork === 'ERC20' ? 'Ethereum' :
                             selectedNetwork === 'BTC' ? 'Bitcoin' :
                             selectedNetwork === 'SOL' ? 'Solana' :
                             selectedNetwork}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Payment Address</p>
                          <div className="bg-gray-800 dark:bg-[#1a1a1a] p-3 rounded-lg break-all">
                            <p className="text-xs font-mono dark:text-white text-black">{invoiceData.cryptoAddress}</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full"
                            onClick={() => {
                              navigator.clipboard.writeText(invoiceData.cryptoAddress!);
                              toast.success("Address copied!");
                            }}
                          >
                            Copy Address
                          </Button>
                        </div>

                        {/* Critical Network Warning */}
                        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
                          <p className="text-xs text-red-400">
                            Please make sure the transfer network is {
                              selectedNetwork === 'BEP20' ? 'BNB Smart Chain' :
                              selectedNetwork === 'TRC20' ? 'TRON' :
                              selectedNetwork === 'ERC20' ? 'Ethereum' :
                              selectedNetwork === 'BTC' ? 'Bitcoin' :
                              selectedNetwork === 'SOL' ? 'Solana' :
                              selectedNetwork
                            }, otherwise the assets will be permanently lost.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="mt-6">
                      <h5 className="text-md font-semibold dark:text-white text-black mb-3">Instructions</h5>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-400">
                        <li>Send exactly {invoiceData.payAmount && invoiceData.payCurrency ? `${formatCryptoAmount(invoiceData.payAmount, invoiceData.payCurrency)} ${invoiceData.payCurrency}` : cryptoAmount && currentSelectedCrypto ? `${cryptoAmount} ${currentSelectedCrypto.symbol}` : `${amount} ${currentSelectedCrypto ? currentSelectedCrypto.symbol : 'USD'}`} to the address above</li>
                        <li>Wait for network confirmation (usually takes 2-5 minutes)</li>
                        <li>Do not close this window until payment is confirmed</li>
                      </ol>
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
              {(paymentMethod === 'card' || paymentMethod === 'google_apple_pay' || paymentMethod === 'upi') && invoiceData.invoiceUrl && (
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
  selectedCrypto,
  setSelectedCrypto,
  availableCryptos,
  cryptoAmount,
  exchangeRate,
  isLoadingRate,
  nextStep,
  accounts,
  selectedAccount,
  setSelectedAccount,
  lifetimeDeposit,
  usdAmountFromInr,
}: {
  amount: string;
  setAmount: (value: string) => void;
  selectedNetwork: string;
  setSelectedNetwork: (value: string) => void;
  paymentMethod: PaymentMethod;
  selectedCrypto?: Cryptocurrency | null;
  setSelectedCrypto?: (crypto: Cryptocurrency | null) => void;
  availableCryptos?: Cryptocurrency[];
  cryptoAmount?: string;
  exchangeRate?: number | null;
  isLoadingRate?: boolean;
  nextStep: () => void;
  accounts: TpAccountSnapshot[];
  selectedAccount: string;
  setSelectedAccount: (account: string) => void;
  lifetimeDeposit: number;
  usdAmountFromInr?: string;
}) {
  // Update network when crypto changes
  useEffect(() => {
    if (selectedCrypto && selectedCrypto.networks.length > 0) {
      setSelectedNetwork(selectedCrypto.networks[0].blockchain);
    }
  }, [selectedCrypto, setSelectedNetwork]);
  
  // If crypto is selected, use its networks; otherwise show common networks
  const availableNetworks = selectedCrypto?.networks.map(n => n.blockchain) || ['TRC20', 'ERC20', 'BEP20', 'BTC', 'ETH', 'SOL'];

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
    // Require crypto and network selection for crypto payments
    if (paymentMethod === 'crypto') {
      if (!selectedCrypto) {
        toast.error("Cryptocurrency selection required", {
          description: "Please select a cryptocurrency to continue.",
        });
        return;
      }
      if (!selectedNetwork) {
        toast.error("Network selection required", {
          description: "Please select a network to continue.",
        });
        return;
      }
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    
    // Validate minimum and maximum limits
    if (paymentMethod === 'upi') {
      // UPI limits: ₹2,000 - ₹1,00,000 INR
      if (amountNum < 2000) {
        toast.error("Minimum deposit amount for UPI is ₹2,000 INR");
        return;
      }
      if (amountNum > 100000) {
        toast.error("Maximum deposit amount for UPI is ₹1,00,000 INR");
        return;
      }
    } else {
      // Other payment methods: $1 - $5,000 USD
      if (amountNum < 1) {
        toast.error("Minimum deposit amount is $1 USD");
        return;
      }
      if (amountNum > 5000) {
        toast.error("Maximum deposit amount is $5,000 USD. Please enter $5,000 or less.");
        return;
      }
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
        {paymentMethod === 'upi' && amount ? (
          <>
            Pay ₹{parseFloat(amount).toLocaleString('en-IN')} INR
            {usdAmountFromInr && <span className="text-sm text-gray-400 ml-2">(~${usdAmountFromInr} USD)</span>}
          </>
        ) : paymentMethod === 'crypto' && selectedCrypto && cryptoAmount && cryptoAmount !== "" ? (
          <>
            Pay {formatCryptoAmount(cryptoAmount, selectedCrypto.symbol)} {selectedCrypto.symbol}
            {amount && <span className="text-sm text-gray-400 ml-2">({amount} USD)</span>}
          </>
        ) : paymentMethod === 'crypto' && selectedCrypto ? (
          isLoadingRate ? (
            `Pay ${amount || '0'} USD (calculating...)`
          ) : (
            `Pay ${amount || '0'} USD`
          )
        ) : (
          `Pay ${amount || '0'} ${selectedCrypto ? selectedCrypto.symbol : 'USD'}`
        )}
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
        <div className="mt-4 w-full space-y-4">
          <div className="rounded-lg">
            <div className="mt-4">
              <Label className="text-sm dark:text-white/75 text-black mb-1">Select Cryptocurrency</Label>
              <Select
                onValueChange={(value) => {
                  const crypto = availableCryptos?.find(c => c.id === value);
                  if (setSelectedCrypto) {
                    setSelectedCrypto(crypto || null);
                  }
                }}
                value={selectedCrypto?.id || ""}
              >
                <SelectTrigger className="border-[#362e36] p-5 flex items-center w-full dark:text-white/75 text-black focus:ring-[#8046c9]">
                  <SelectValue placeholder="Select Cryptocurrency">
                    {selectedCrypto ? (
                      <div className="flex items-center gap-2">
                        {selectedCrypto.icon && (
                          <Image
                            src={selectedCrypto.icon}
                            alt={selectedCrypto.name}
                            width={24}
                            height={24}
                            className="rounded"
                          />
                        )}
                        <span>{selectedCrypto.name}</span>
                      </div>
                    ) : (
                      "Select Cryptocurrency"
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="border-[#1e171e] dark:bg-[#060207] dark:text-white/75 text-black">
                  {availableCryptos?.map((crypto) => (
                    <SelectItem
                      key={crypto.id}
                      value={crypto.id}
                    >
                      <div className="flex items-center gap-2">
                        {crypto.icon && (
                          <Image
                            src={crypto.icon}
                            alt={crypto.name}
                            width={24}
                            height={24}
                            className="rounded"
                          />
                        )}
                        <span>{crypto.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {selectedCrypto && (
            <div className="rounded-lg">
              <div className="mt-4">
                <Label className="text-sm dark:text-white/75 text-black mb-1">Network</Label>
                <Select
                  onValueChange={setSelectedNetwork}
                  value={selectedNetwork}
                  disabled={selectedCrypto.networks.length === 1}
                >
                  <SelectTrigger className="border-[#362e36] p-5 flex items-center w-full dark:text-white/75 text-black focus:ring-[#8046c9]">
                    <SelectValue placeholder="Select Network">
                      {selectedNetwork || "Select Network"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="border-[#1e171e] dark:bg-[#060207] dark:text-white/75 text-black">
                    {availableNetworks.map((network) => (
                      <SelectItem
                        key={network}
                        value={network}
                      >
                        {network === 'BEP20' ? 'BNB Smart Chain (BEP20)' :
                         network === 'TRC20' ? 'TRON (TRC20)' :
                         network === 'ERC20' ? 'Ethereum (ERC20)' :
                         network === 'BTC' ? 'Bitcoin' :
                         network === 'ETH' ? 'Ethereum' :
                         network === 'SOL' ? 'Solana' :
                         network}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
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
                  if (paymentMethod === 'upi') {
                    // For INR, only allow integers (no decimals)
                    if (!/^\d*$/.test(e.target.value)) return;
                  } else {
                  if (!/^\d*\.?\d*$/.test(e.target.value)) return;
                  }
                  const value = e.target.value;
                  setAmount(value);
                  
                  // Real-time validation
                  toast.dismiss(); // Dismiss previous toasts
                  const amountNum = parseFloat(value);
                  if (!isNaN(amountNum) && amountNum > 0) {
                    if (paymentMethod === 'upi') {
                      if (amountNum > 100000) {
                        toast.error("Maximum deposit amount for UPI is ₹1,00,000 INR");
                      }
                    } else {
                      if (amountNum > 5000) {
                        toast.error("Maximum deposit amount is $5,000 USD. Please enter $5,000 or less.");
                      }
                    }
                  }
                }}
                placeholder={paymentMethod === 'upi' ? "Enter amount in INR" : "Enter amount"}
                className="dark:text-white/75 text-black pr-12 border-[#362e36] p-5 focus-visible:ring-blue-600 w-full"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/75 text-black text-sm">
                {paymentMethod === 'upi' ? 'INR' : 'USD'}
              </span>
            </div>
            {paymentMethod === 'upi' ? (
              <>
                <p 
                  className="text-xs mt-2 text-[#945393] font-medium cursor-pointer hover:text-[#b366b3] transition-colors"
                  onClick={() => {
                    setAmount("100000");
                    toast.dismiss();
                  }}
                  title="Click to set maximum amount (₹1,00,000)"
                >
                  ₹2,000 - ₹1,00,000 INR
                </p>
                {usdAmountFromInr && parseFloat(amount) > 0 && (
                  <p className="text-xs mt-1 text-gray-400">
                    ≈ ${usdAmountFromInr} USD
                  </p>
                )}
              </>
            ) : (
              <p 
                className="text-xs mt-2 text-[#945393] font-medium cursor-pointer hover:text-[#b366b3] transition-colors"
                onClick={() => {
                  setAmount("5000");
                  toast.dismiss();
                }}
                title="Click to set maximum amount ($5,000)"
              >
              $1 - $5000.00
            </p>
            )}
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

