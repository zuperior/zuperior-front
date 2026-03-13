"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { USDTManualStep1Form } from "./USDTManualStep1Form";
import { WireStep2Instructions } from "./WireStep2Instructions";
import { UPIStep2Instructions } from "./UPIStep2Instructions";
import { USDTManualStep3Transaction } from "./USDTManualStep3Transaction";
import { USDTManualStep4Confirmation } from "./USDTManualStep4Confirmation";
import { useSelector, useDispatch } from "react-redux";
import type { RootState, AppDispatch } from "../../store";
import { fetchUserAccountsFromDb } from "../../store/slices/mt5AccountSlice";

export function BankDepositDialog({ 
  open, 
  onOpenChange, 
  lifetimeDeposit,
  gatewayType = 'bank_transfer',
  methodKey,
  displayName
}: { 
  open: boolean; 
  onOpenChange: (v: boolean)=>void; 
  lifetimeDeposit: number;
  gatewayType?: string;
  methodKey?: string;
  displayName?: string;
}) {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [depositRequestId, setDepositRequestId] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [bank, setBank] = useState<any>(null);
  const [upi, setUpi] = useState<any>(null);
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
      if (!open || !methodKey) return;
      
      try {
        const response = await fetch('/api/deposit-payment-methods', { cache: 'no-store' });
        const data = await response.json();
        
        if (data.ok && Array.isArray(data.methods)) {
          const method = data.methods.find((m: any) => m.method_key === methodKey);
          if (method) {
            setPaymentMethodLimits({
              minLimit: method.min_limit !== undefined && method.min_limit !== null ? Number(method.min_limit) : null,
              maxLimit: method.max_limit !== undefined && method.max_limit !== null ? Number(method.max_limit) : null,
            });
            console.log('📊 Payment method limits fetched for BankDepositDialog:', {
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
  }, [open, methodKey]);

  useEffect(() => {
    if (open && mt5Accounts.length === 0) dispatch(fetchUserAccountsFromDb() as any);
  }, [open, dispatch, mt5Accounts.length]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
        // Determine the type to fetch based on gatewayType
        const fetchType = gatewayType === 'upi' ? 'upi' : 'bank_transfer';
        const res = await fetch(`/api/manual-gateway?type=${fetchType}${methodKey ? `&method_key=${encodeURIComponent(methodKey)}` : ''}`, {
          cache: 'no-store',
          headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
        });
        const data = await res.json();
        if (data?.success) {
          if (gatewayType === 'upi') {
            // Handle UPI data
            const raw = data?.data?.upi || data?.data || {};
            
            // Resolve QR code URL - if it's a relative path or wrong domain, use admin backend URL
            let qrCodeUrl = raw.qrCode ?? raw.qr_code ?? raw.qr ?? null;
            if (qrCodeUrl && typeof qrCodeUrl === 'string') {
              const trimmedPath = qrCodeUrl.trim();
              const adminBackendUrl = process.env.NEXT_PUBLIC_ADMIN_BACKEND_URL || 
                                      process.env.NEXT_PUBLIC_ADMIN_API_URL || 
                                      'http://localhost:5003';
              
              // If it's already a full URL, check if it has the wrong domain and fix it
              if (trimmedPath.startsWith('http://') || trimmedPath.startsWith('https://')) {
                try {
                  const url = new URL(trimmedPath);
                  const path = url.pathname;
                  
                  // If it's a kyc_proofs path, replace the entire URL with the correct admin backend URL
                  if (path.includes('/kyc_proofs/') || path.startsWith('/kyc_proofs/')) {
                    qrCodeUrl = `${adminBackendUrl}${path}`;
                    console.log('[BankDepositDialog] Fixed QR code URL (wrong domain):', { 
                      original: raw.qrCode, 
                      resolved: qrCodeUrl,
                      originalHost: url.hostname,
                      correctHost: new URL(adminBackendUrl).hostname
                    });
                  } else {
                    // If the hostname doesn't match the admin backend URL and it's a kyc_proofs path, replace it
                    const adminUrlObj = new URL(adminBackendUrl);
                    if (url.hostname !== adminUrlObj.hostname && path.includes('/kyc_proofs/')) {
                      qrCodeUrl = `${adminBackendUrl}${path}`;
                      console.log('[BankDepositDialog] Fixed QR code URL (hostname mismatch):', { 
                        original: raw.qrCode, 
                        resolved: qrCodeUrl 
                      });
                    }
                  }
                } catch (e) {
                  // If URL parsing fails, continue with relative path logic
                  console.warn('[BankDepositDialog] Failed to parse URL:', qrCodeUrl, e);
                }
              } else {
                // If it starts with /kyc_proofs/, use admin backend URL
                if (trimmedPath.startsWith('/kyc_proofs/') || trimmedPath.startsWith('kyc_proofs/')) {
                  const cleanPath = trimmedPath.startsWith('/') ? trimmedPath : `/${trimmedPath}`;
                  qrCodeUrl = `${adminBackendUrl}${cleanPath}`;
                  console.log('[BankDepositDialog] Resolved QR code URL:', { original: raw.qrCode, resolved: qrCodeUrl });
                } else if (trimmedPath.startsWith('/')) {
                  // Other relative paths - use admin backend URL
                  qrCodeUrl = `${adminBackendUrl}${trimmedPath}`;
                }
              }
            }
            
            const normalized = {
              vpaAddress: raw.vpaAddress ?? raw.vpa_address ?? raw.vpa ?? null,
              qrCode: qrCodeUrl,
              fixedRate: raw.fixedRate ?? raw.fixed_rate ?? 92.00,
            };
            setUpi(normalized);
            setBank(null);
          } else {
            // Handle bank transfer data
            const raw = data?.data?.bank || data?.data || {};
            const normalized = {
              bankName: raw.bankName ?? raw.bank_name ?? null,
              accountName: raw.accountName ?? raw.account_name ?? null,
              accountNumber: raw.accountNumber ?? raw.account_number ?? null,
              ifscCode: raw.ifscCode ?? raw.ifsc_code ?? null,
              swiftCode: raw.swiftCode ?? raw.swift_code ?? null,
              accountType: raw.accountType ?? raw.account_type ?? null,
              countryCode: raw.countryCode ?? raw.country_code ?? null,
              fixedRate: raw.fixedRate ?? raw.fixed_rate ?? 92.00,
            };
            setBank(normalized);
            setUpi(null);
          }
        } else {
          setBank(null);
          setUpi(null);
        }
      } catch (e) {
        console.error('Failed to fetch manual gateway:', e);
        setBank(null);
        setUpi(null);
      }
    })();
  }, [open, gatewayType, methodKey]);

  const reset = useCallback(() => {
    setStep(1); setAmount(""); setSelectedAccount(""); setTransactionId(""); setProofFile(null); setDepositRequestId("");
  }, []);

  useEffect(() => { if (!open) reset(); }, [open, reset]);

  const handleCreate = async () => {
    if (isProcessing) return; // Guard against double submissions
    setIsProcessing(true);
    try {
      // Uses existing manual deposit endpoint and proxy
      const formData = new FormData();
      formData.append('mt5AccountId', selectedAccount);
      formData.append('amount', amount);
      // Pass payment method type (UPI or bank_transfer)
      formData.append('paymentMethod', gatewayType === 'upi' ? 'UPI' : 'Bank Transfer');
      // Pass methodKey to identify which gateway was used
      if (methodKey) formData.append('methodKey', methodKey);
      if (transactionId) formData.append('transactionHash', transactionId);
      if (proofFile) formData.append('proofFile', proofFile);

      const token = localStorage.getItem('userToken') || '';
      const response = await fetch('/api/manual-deposit/create', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
      const result = await response.json();
      if (result?.success) { setDepositRequestId(result.data.id); setStep(4); }
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <USDTManualStep1Form
            amount={amount}
            setAmount={setAmount}
            selectedAccount={selectedAccount}
            setSelectedAccount={setSelectedAccount}
            accounts={filteredAccounts}
            lifetimeDeposit={lifetimeDeposit}
            nextStep={() => setStep(2)}
            fixedRate={bank?.fixedRate || upi?.fixedRate || 92.00}
            showInrConversion={true}
            paymentMethod={methodKey || undefined}
            paymentMethodLimits={paymentMethodLimits}
          />
        );
      case 2:
        if (gatewayType === 'upi') {
          return (
            <UPIStep2Instructions 
              upi={upi || {}} 
              amount={amount} 
              nextStep={() => setStep(3)}
              fixedRate={upi?.fixedRate || 92.00}
            />
          );
        }
        return (
          <WireStep2Instructions 
            bank={bank || {}} 
            amount={amount} 
            nextStep={() => setStep(3)}
            fixedRate={bank?.fixedRate || 92.00}
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
            nextStep={handleCreate}
            isProcessing={isProcessing}
            variant="bank"
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
            bank={bank || {}}
            gatewayType={gatewayType}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[95%] lg:max-w-2xl gap-4 bg-background shadow-lg border-2 border-transparent p-6 text-white rounded-[18px] flex flex-col items-center w-full max-h-[90vh] overflow-y-auto [background:linear-gradient(#fff,#fff)_padding-box,conic-gradient(from_var(--border-angle),#ddd,#f6e6fc,theme(colors.purple.400/48%))_border-box] dark:[background:linear-gradient(#070206,#030103)_padding-box,conic-gradient(from_var(--border-angle),#030103,#030103,color-mix(in_oklab,oklch(71.4%_0.203_305.504)_48%,transparent))_border-box] animate-border">
        <VisuallyHidden><DialogTitle>Bank Transfer</DialogTitle></VisuallyHidden>
        {/* Stepper header to match USDT dialog */}
        <DialogHeader className="w-full py-3">
          <div className="flex items-center justify-between w-full pt-2">
            <div className="flex items-center space-x-2 w-full mx-10">
              <div
                className={`flex h-8 w-8 px-4 mx-0 items-center justify-center rounded-full ${
                  step >= 1 ? "bg-[#9F8BCF]" : "bg-[#594B7A]"
                }`}
              >
                <span className="text-sm font-medium">1</span>
              </div>
              <div
                className={`h-[4px] w-full mx-0 ${
                  step >= 2 ? "bg-[#6B5993]" : "bg-[#392F4F]"
                }`}
              />
              <div
                className={`flex h-8 w-8 p-4 mx-0 items-center justify-center rounded-full ${
                  step >= 2 ? "bg-[#9F8BCF]" : "bg-[#594B7A]"
                }`}
              >
                <span className="text-sm font-medium ">2</span>
              </div>
              <div
                className={`h-[4px] w-full mx-0 ${
                  step >= 3 ? "bg-[#6B5993]" : "bg-[#392F4F]"
                }`}
              />
              <div
                className={`flex h-8 w-8 p-4 items-center justify-center rounded-full ${
                  step >= 3 ? " bg-[#9F8BCF]" : "bg-[#594B7A]"
                }`}
              >
                <span className="text-sm font-medium">3</span>
              </div>
              <div
                className={`h-[4px] w-full mx-0 ${
                  step >= 4 ? "bg-[#6B5993]" : "bg-[#392F4F]"
                }`}
              />
              <div
                className={`flex h-8 w-8 p-4 items-center justify-center rounded-full ${
                  step >= 4 ? " bg-[#9F8BCF]" : "bg-[#594B7A]"
                }`}
              >
                <span className="text-sm font-medium">4</span>
              </div>
            </div>
          </div>
        </DialogHeader>
        <h2 className="text-2xl text-center font-bold dark:text-white/75 text-black">
          {displayName || (gatewayType === 'upi' ? 'UPI Payment' : 'Bank Transfer')}
        </h2>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
