"use client";

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
import { Step1FormProps, WithdrawDest } from "@/components/withdraw/types";
import { useEffect, useMemo, useState } from "react";
import { store } from "@/store";
import { toast } from "sonner";
import axios from "axios";
import { TpAccountSnapshot } from "@/types/user-details";

export function Step1FormPayout({
  amount,
  setAmount,
  selectedNetwork,
  setSelectedNetwork,
  selectedCrypto,
  nextStep,
  accounts,
  selectedAccount,
  setSelectedAccount,
  toWallet,
  setToWallet,
  setSelectedDest,
  allowedMethodType,
  useWallet,
}: Step1FormProps & {
  accounts: TpAccountSnapshot[];
  selectedAccount: TpAccountSnapshot | null;
  setSelectedAccount: (account: TpAccountSnapshot) => void;
  toWallet: string;
  setToWallet: (address: string) => void;
  setSelectedDest?: (dest: WithdrawDest | null) => void;
  allowedMethodType?: 'crypto' | 'bank';
  useWallet?: boolean;
}) {
  const [isValidating, setIsValidating] = useState(false);
  const [kycStep, setKycStep] = useState<
    "unverified" | "partial" | "verified" | ""
  >("");
  type ApprovedMethod = { type: 'crypto' | 'bank'; label: string; value: string; bank?: WithdrawDest['bank'] };
  const [approvedMethods, setApprovedMethods] = useState<ApprovedMethod[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  
  // State for withdrawal limits from group_management
  const [withdrawalLimits, setWithdrawalLimits] = useState<{
    minWithdrawal: number | null;
    maxWithdrawal: number | null;
  } | null>(null);
  const [loadingWithdrawalLimits, setLoadingWithdrawalLimits] = useState(false);
  
  // Compute available balance for display and quick-fill
  const availableBalance = useMemo(() => {
    const raw = useWallet
      ? parseFloat(String(wallet?.balance || 0))
      : parseFloat(String(selectedAccount?.balance || 0));
    return isNaN(raw) ? 0 : raw;
  }, [useWallet, wallet?.balance, selectedAccount?.balance]);

  // KYC Step
  useEffect(() => {
    setKycStep(store.getState().kyc.verificationStatus);
  }, []);

  // Fetch withdrawal limits when account is selected
  useEffect(() => {
    const fetchWithdrawalLimits = async () => {
      // Only fetch if not using wallet and account is selected
      if (useWallet || !selectedAccount) {
        setWithdrawalLimits(null);
        return;
      }

      const accountNumber = selectedAccount.acc?.toString();
      if (!accountNumber) {
        setWithdrawalLimits(null);
        return;
      }

      setLoadingWithdrawalLimits(true);
      try {
        const response = await fetch(`/api/mt5/deposit-limits/${accountNumber}`);
        const data = await response.json();

        if (data.success && data.data) {
          setWithdrawalLimits({
            minWithdrawal: data.data.minWithdrawal,
            maxWithdrawal: data.data.maxWithdrawal,
          });
          console.log('📊 Withdrawal limits fetched:', {
            minWithdrawal: data.data.minWithdrawal,
            maxWithdrawal: data.data.maxWithdrawal,
          });
        } else {
          setWithdrawalLimits(null);
          console.warn('⚠️ No withdrawal limits found for account:', accountNumber);
        }
      } catch (error) {
        console.error('❌ Error fetching withdrawal limits:', error);
        setWithdrawalLimits(null);
      } finally {
        setLoadingWithdrawalLimits(false);
      }
    };

    fetchWithdrawalLimits();
  }, [selectedAccount, useWallet]);

  // Load approved payment methods (wallet addresses + bank accounts)
  useEffect(() => {
    const load = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
        const base = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api';
        // load wallet if using wallet flow
        if (useWallet) {
          const wr = await fetch('/api/wallet', { headers: token ? { Authorization: `Bearer ${token}` } : undefined, cache: 'no-store' });
          const wj = await wr.json();
          if (wj?.success) setWallet(wj.data);
        }
        const res = await fetch(`${base}/user/payment-methods`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        if (json?.status === 'Success') {
          let list: ApprovedMethod[] = (json.data || [])
            .filter((pm: any) => pm.status === 'approved')
            .map((pm: any) => {
              const type = (pm.methodType ?? 'crypto') as 'crypto' | 'bank';
              if (type === 'bank') {
                const label = `${pm.bankName || 'Bank'} • ${pm.accountNumber || ''}`.trim();
                return { type: 'bank', label, value: pm.accountNumber || label, bank: {
                  bankName: pm.bankName,
                  accountName: pm.accountName,
                  accountNumber: pm.accountNumber,
                  ifscSwiftCode: pm.ifscSwiftCode,
                  accountType: pm.accountType,
                }};
              }
              return { type: 'crypto', label: pm.address, value: pm.address };
            });
          if (allowedMethodType) {
            list = list.filter((m) => m.type === allowedMethodType);
          }
          setApprovedMethods(list);
          if (list.length && !toWallet) {
            setToWallet(list[0].value);
            if (typeof setSelectedDest === 'function') {
              const dest: WithdrawDest = { type: list[0].type, label: list[0].label, value: list[0].value, bank: list[0].bank };
              setSelectedDest(dest);
            }
          }
        }
      } catch {}
    };
    load();
  }, [setToWallet, toWallet, allowedMethodType]);

  // Amount Validation
  const validateAmount = () => {
    // when using wallet flow, do not require MT5 account
    if (!useWallet && !selectedAccount) {
      toast.error("Please select an account");
      return false;
    }
    const amountNum = parseFloat(amount);
    // Use account balance for withdrawal availability display/validation
    const balance = useWallet ? parseFloat(String(wallet?.balance || 0)) : parseFloat(selectedAccount.balance);

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return false;
    }

    // Check withdrawal limits from group_management
    // If min_withdrawal is null/empty, treat as no minimum limit (infinite)
    // If max_withdrawal is null/empty, treat as no maximum limit (infinite)
    if (!useWallet && withdrawalLimits) {
      if (withdrawalLimits.minWithdrawal !== null && withdrawalLimits.minWithdrawal !== undefined && amountNum < withdrawalLimits.minWithdrawal) {
        toast.error(`Minimum withdrawal for this account is $${withdrawalLimits.minWithdrawal}`);
        return false;
      }
      if (withdrawalLimits.maxWithdrawal !== null && withdrawalLimits.maxWithdrawal !== undefined && amountNum > withdrawalLimits.maxWithdrawal) {
        toast.error(`Maximum withdrawal for this account is $${withdrawalLimits.maxWithdrawal}`);
        return false;
      }
    }

    // Fallback to default minimum if no withdrawal limit is set
    if (amountNum < 10) {
      toast.error("Minimum withdrawal amount is $10");
      return false;
    }

    if (amountNum > balance) {
      toast.error(
        `Insufficient funds. Your balance is ${balance.toFixed(2)} USD`
      );
      return false;
    }
    if (kycStep === "partial" && amountNum > 10000) {
      toast.error("Withdrawal limit is $10,000 for Partial accounts");
      return false;
    }
    return true;
  };

  // Wallet Validation
  const validateWalletAddress = async () => {
    if (!toWallet.trim()) {
      toast.error("Wallet address is required");
      return false;
    }
    const selectedMethod = approvedMethods.find((m) => m.value === toWallet.trim());
    const isBank = selectedMethod?.type === 'bank';
    if (!isBank) {
      if (!(selectedNetwork ?? '').trim()) {
        toast.error("Network is required");
        return false;
      }
    }

    setIsValidating(true);
    try {
      // Skipping external address validation (no API available). Non-empty value already checked.
      return true;
    } finally {
      setIsValidating(false);
    }
  };

  // Continue Handler
  const handleNextStep = async () => {
    if (!useWallet && !selectedAccount) return toast.error("Please select an account");
    if (!amount.trim()) return toast.error("Amount is required");
    if (!validateAmount()) return;
    const isValid = await validateWalletAddress();
    if (isValid) nextStep();
  };

  // Limit Message
  const getLimitMessage = () => {
    switch (kycStep) {
      case "unverified":
        return "Please complete KYC to withdraw funds";
      case "partial":
        return "Maximum withdrawal limit: $10,000";
      default:
        return "";
    }
  };

  return (
    <div className="w-full px-6">
      {/* ACCOUNT SELECT or Wallet Info */}
      {!useWallet ? (
        <div className="mt-4">
          <Label className="text-sm dark:text-white/75 text-black mb-1">Account</Label>
          {(() => { return null; })()}
          <Select
            onValueChange={(value) => {
              const found = accounts.find((account) => account.acc.toString() === value);
              if (found) setSelectedAccount(found);
            }}
            value={selectedAccount?.acc.toString()}
          >
            <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Select Account" /></SelectTrigger>
            <SelectContent>
              {useMemo(() => {
                const seen = new Set<string>();
                return accounts.filter((account) => {
                  const accountType = (account as any).accountType || account.account_type || 'Live';
                  if (accountType !== 'Live') return false;
                  const id = String(account.acc ?? '').trim();
                  if (!id || id === '0' || seen.has(id)) return false;
                  seen.add(id);
                  return true;
                }).map((account, index) => (
                  <SelectItem key={`${account.acc}-${index}`} value={account.acc.toString()} disabled={parseFloat(account.balance) === 0}>
                    <span className="px-2 py-[2px] rounded-[5px] font-semibold text-black dark:text-white/75 tracking-tighter text-[10px]">MT5</span>
                    <span className="text-black dark:text-white/75">{account.acc}</span>
                    <span className="text-xs  text-black dark:text-white/75">${parseFloat(account.balance).toFixed(2)}</span>
                  </SelectItem>
                ));
              }, [accounts])}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-[#362e36] p-3">
          <div className="text-sm dark:text-white/75 text-black mb-1">Wallet</div>
          <div className="flex justify-between text-sm"><span className="opacity-70">Wallet Number</span><span className="font-medium">{wallet?.walletNumber || '-'}</span></div>
          <div className="flex justify-between text-sm"><span className="opacity-70">Balance</span><span className="font-medium">${(wallet?.balance ?? 0).toFixed?.(2) || '0.00'}</span></div>
        </div>
      )}

      {/* WALLET / BANK DESTINATION */}
      <div className="mt-4">
        <Label className="text-sm dark:text-white/75 text-black mb-1">{allowedMethodType === 'bank' ? 'Bank Account' : 'Wallet Address'}</Label>
        <Select value={toWallet} onValueChange={(val) => {
          setToWallet(val);
          if (typeof setSelectedDest === 'function') {
            const m = approvedMethods.find((x) => x.value === val);
            if (m) setSelectedDest({ type: m.type, label: m.label, value: m.value, bank: m.bank });
          }
        }}>
          <SelectTrigger className="w-full mt-1">
            <SelectValue placeholder={approvedMethods.length ? (allowedMethodType === 'bank' ? 'Select bank account' : 'Select wallet') : "No approved methods found"} />
          </SelectTrigger>
          <SelectContent>
            {approvedMethods.length === 0 ? (
              <SelectItem disabled value="__no_wallets__">No approved methods found</SelectItem>
            ) : (
              approvedMethods.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {/* AMOUNT */}
      <div className="mt-4">
        <Label className="text-sm dark:text-white/75 text-black">
          Withdraw Amount
        </Label>
        <div className="relative w-full">
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="Enter withdraw amount"
            className="dark:bg-[#070307]  pr-12 text-black dark:text-white/75 border-[#362e36] p-5 focus-visible:ring-blue-600 w-full"
            inputMode="decimal"
            aria-label="Withdraw amount"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-black dark:text-white text-sm">
            {selectedCrypto?.name || "USD"}
          </span>
        </div>

        {/* Withdrawable range helper below field, above limit message */}
        <div className="mt-2 text-xs text-[#945393]">
          <span>Withdrawable: 0 – </span>
          <button
            type="button"
            className="hover:opacity-80 cursor-pointer font-medium"
            onClick={() => {
              // Set amount to the minimum of available balance and max withdrawal limit
              const maxAllowed = effectiveMaxWithdrawal === Infinity 
                ? availableBalance 
                : Math.min(availableBalance, effectiveMaxWithdrawal);
              setAmount(maxAllowed.toFixed(2));
            }}
            title="Click to withdraw maximum allowed"
          >
            ${availableBalance.toFixed(2)}
          </button>
        </div>

        {/* Show withdrawal limits */}
        {!useWallet && selectedAccount && (
          <p className="text-xs mt-2 text-[#945393] font-medium">
            {getLimitMessage()}
          </p>
        )}

        {useWallet && kycStep && (
          <p className="text-xs mt-2 text-[#945393]">{getLimitMessage()}</p>
        )}
      </div>

      {/* CONTINUE BUTTON */}
      <Button
        className="flex-1 cursor-pointer bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white hover:bg-[#9d6ad9] w-full mt-3"
        onClick={handleNextStep}
        disabled={isValidating || kycStep === "unverified"}
      >
        {isValidating ? "Validating..." : "Continue"}
      </Button>
    </div>
  );
}
