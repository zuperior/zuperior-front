"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { X } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import { store } from "../../store";
import { fetchUserAccountsFromDb } from "../../store/slices/mt5AccountSlice";
import { NewAccountDialogProps } from "./types";
import { USDTManualStep1Form } from "./USDTManualStep1Form";
import { USDTManualStep2Instructions } from "./USDTManualStep2Instructions";
import { USDTManualStep3Transaction } from "./USDTManualStep3Transaction";
import { USDTManualStep4Confirmation } from "./USDTManualStep4Confirmation";

export function ManualDepositDialog({
  open,
  onOpenChange,
  selectedCrypto,
  lifetimeDeposit,
}: NewAccountDialogProps & { lifetimeDeposit: number }) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [depositRequestId, setDepositRequestId] = useState<string>("");
  const [paymentMethodLimits, setPaymentMethodLimits] = useState<{
    minLimit: number | null;
    maxLimit: number | null;
  } | null>(null);

  const dispatch = useDispatch<AppDispatch>();
  const mt5Accounts = useSelector((state: RootState) => state.mt5.accounts);
  // Use all accounts from database - no need to filter by isEnabled anymore
  const filteredAccounts = mt5Accounts.filter(
    (account) => {
      // Filter valid account IDs only
      const id = String(account.accountId || '').trim();
      return id && id !== '0' && /^\d+$/.test(id);
    }
  );

  const resetAllStates = useCallback(() => {
    setStep(1);
    setAmount("");
    setIsProcessing(false);
    setError(null);
    setSelectedAccount("");
    setTransactionId("");
    setProofFile(null);
    setDepositRequestId("");
  }, []);

  useEffect(() => {
    if (!open) {
      resetAllStates();
      return;
    }
  }, [open, resetAllStates]);

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
            console.log('📊 Payment method limits fetched for ManualDepositDialog:', {
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
    if (open && mt5Accounts.length === 0) {
      console.log('🔄 ManualDepositDialog: Fetching MT5 accounts from DB...');
      dispatch(fetchUserAccountsFromDb() as any);
    }
  }, [open, dispatch, mt5Accounts.length]);

  const handleStep1Continue = async () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║  🚀 CREATING MANUAL DEPOSIT REQUEST (Frontend)           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    
    setIsProcessing(true);
    setError(null);

    try {
      // Create manual deposit request
      const formData = new FormData();
      formData.append('mt5AccountId', selectedAccount);
      formData.append('amount', amount);
      if (transactionId) {
        formData.append('transactionHash', transactionId);
      }
      if (proofFile) {
        formData.append('proofFile', proofFile);
      }

      console.log('📊 Deposit Request Data:');
      console.log('   - MT5 Account ID:', selectedAccount);
      console.log('   - Amount:', amount);
      console.log('   - Transaction Hash:', transactionId || '(not provided)');
      console.log('   - Proof File:', proofFile ? proofFile.name : '(not provided)');
      console.log('');

      // Get token from Redux state
      const state = store.getState();
      const token = state.auth.token || localStorage.getItem('userToken');

      if (!token) {
        console.error('❌ No authentication token found!');
        setError('No authentication token found. Please log in first.');
        setIsProcessing(false);
        return;
      }

      console.log('🔑 Authentication token found');
      console.log('📡 Sending request to: /api/manual-deposit/create');
      console.log('📦 FormData contents:');
      for (const [key, value] of formData.entries()) {
        console.log(`   ${key}:`, value instanceof File ? `File: ${value.name}` : value);
      }
      console.log('');

      console.log('🌐 Making fetch request...');
      const response = await fetch('/api/manual-deposit/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);
      console.log('');

      console.log('📥 Parsing JSON response...');
      const result = await response.json();
      console.log('📥 Parsed result:', result);
      
      console.log('📥 Server Response:');
      console.log('   - Success:', result.success);
      console.log('   - Message:', result.message);
      if (result.data) {
        console.log('   - Deposit ID:', result.data.id);
        console.log('   - Full Response:', JSON.stringify(result, null, 2));
      }
      console.log('');

      if (result.success) {
        setDepositRequestId(result.data.id);
        setStep(4);
        console.log('✅✅✅ MANUAL DEPOSIT REQUEST CREATED SUCCESSFULLY! ✅✅✅');
        console.log('📋 Deposit Request ID:', result.data.id);
        console.log('');
        console.log('🔍 Next: Check backend console for MT5Transaction creation logs');
        console.log('');
      } else {
        setError(result.message || 'Failed to create deposit request');
        console.error('❌ Failed to create deposit:', result.message);
      }
    } catch (error: any) {
      console.error('');
      console.error('❌❌❌ ERROR CREATING MANUAL DEPOSIT! ❌❌❌');
      console.error('Error object:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('Error name:', error?.name);
      console.error('');
      setError(error?.message || 'Failed to create deposit request');
    } finally {
      setIsProcessing(false);
    }
  };


  const renderStepContent = () => {
    switch (step) {
      case 1:
        // Determine payment method key from crypto ID
        const getPaymentMethodKey = () => {
          if (selectedCrypto?.id === 'USDT-TRC20') return 'cregis_usdt_trc20';
          if (selectedCrypto?.id === 'USDT-BEP20') return 'cregis_usdt_bep20';
          return null;
        };
        
        return (
          <USDTManualStep1Form
            amount={amount}
            setAmount={setAmount}
            selectedAccount={selectedAccount}
            setSelectedAccount={setSelectedAccount}
            accounts={filteredAccounts}
            lifetimeDeposit={lifetimeDeposit}
            nextStep={() => setStep(2)}
            paymentMethod={getPaymentMethodKey()}
            paymentMethodLimits={paymentMethodLimits}
          />
        );
      case 2:
        return (
          <USDTManualStep2Instructions
            amount={amount}
            selectedAccount={selectedAccount}
            nextStep={() => setStep(3)}
          />
        );
      case 3:
        return (
          <USDTManualStep3Transaction
            amount={amount}
            selectedAccount={selectedAccount}
            transactionId={transactionId}
            setTransactionId={setTransactionId}
            proofFile={proofFile}
            setProofFile={setProofFile}
            nextStep={handleStep1Continue}
            isProcessing={isProcessing}
          />
        );
      case 4:
        return (
          <USDTManualStep4Confirmation
            amount={amount}
            selectedAccount={selectedAccount}
            transactionId={transactionId}
            depositRequestId={depositRequestId}
            onClose={() => onOpenChange(false)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95%] lg:max-w-2xl gap-4 bg-background shadow-lg border-2 border-transparent p-6 text-white rounded-[18px] flex flex-col items-center w-full max-h-[90vh] overflow-y-auto [background:linear-gradient(#fff,#fff)_padding-box,conic-gradient(from_var(--border-angle),#ddd,#f6e6fc,theme(colors.purple.400/48%))_border-box] dark:[background:linear-gradient(#070206,#030103)_padding-box,conic-gradient(from_var(--border-angle),#030103,#030103,theme(colors.purple.400/48%))_border-box] animate-border">
        {/* Step indicator */}
        <div className="flex flex-col space-y-1.5 text-center sm:text-left w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center space-x-2 w-full mx-10">
              <div className={`flex h-8 w-8 px-4 mx-0 items-center justify-center rounded-full ${
                step >= 1 ? "bg-[#9F8BCF]" : "bg-[#594B7A]"
              }`}>
                <span className="text-sm font-medium">1</span>
              </div>
              <div className={`h-[4px] w-full mx-0 ${
                step >= 2 ? "bg-[#6B5993]" : "bg-[#392F4F]"
              }`}></div>
              <div className={`flex h-8 w-8 px-4 mx-0 items-center justify-center rounded-full ${
                step >= 2 ? "bg-[#9F8BCF]" : "bg-[#594B7A]"
              }`}>
                <span className="text-sm font-medium">2</span>
              </div>
              <div className={`h-[4px] w-full mx-0 ${
                step >= 3 ? "bg-[#6B5993]" : "bg-[#392F4F]"
              }`}></div>
              <div className={`flex h-8 w-8 px-4 mx-0 items-center justify-center rounded-full ${
                step >= 3 ? "bg-[#9F8BCF]" : "bg-[#594B7A]"
              }`}>
                <span className="text-sm font-medium">3</span>
              </div>
              <div className={`h-[4px] w-full mx-0 ${
                step >= 4 ? "bg-[#6B5993]" : "bg-[#392F4F]"
              }`}></div>
              <div className={`flex h-8 w-8 px-4 mx-0 items-center justify-center rounded-full ${
                step >= 4 ? "bg-[#9F8BCF]" : "bg-[#594B7A]"
              }`}>
                <span className="text-sm font-medium">4</span>
              </div>
            </div>
          </div>
        </div>

        <VisuallyHidden>
          <DialogTitle>Deposit Funds</DialogTitle>
        </VisuallyHidden>

        <div className="w-full px-6">
          <h2 className="text-2xl text-center font-bold dark:text-white/75 text-black">
            Pay USDT TRC20 QR
          </h2>
          {renderStepContent()}
        </div>

        {/* Close button */}
        <button
          type="button"
          className="absolute cursor-pointer right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          onClick={() => onOpenChange(false)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x h-4 w-4 dark:text-white/75 text-black" aria-hidden="true">
            <path d="M18 6 6 18"></path>
            <path d="m6 6 12 12"></path>
          </svg>
          <span className="sr-only">Close</span>
        </button>
      </DialogContent>
    </Dialog>
  );
}
