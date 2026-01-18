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
import { mt5Service } from "@/services/api.service";
import { Step1FormProps } from "./types";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import { store } from "@/store";
import { TpAccountSnapshot } from "@/types/user-details";
import { useSelector } from "react-redux";
import type { RootState } from "../../store";


export function Step1Form({
  amount,
  setAmount,
  selectedNetwork,
  selectedCrypto,
  nextStep,
  accounts,
  selectedAccount,
  setSelectedAccount,
  lifetimeDeposit,
}: Step1FormProps & {
  accounts: TpAccountSnapshot[];
  selectedAccount: string;
  setSelectedAccount: (account: string) => void;
  lifetimeDeposit: number;
}) {
  const [step, setStep] = useState<"unverified" | "partial" | "verified" | "">(
    ""
  );

  // No real-time fetch needed as we rely on DB package
  // const [fetchedGroup, setFetchedGroup] = useState<string | null>(null);

  const groups = useSelector((state: RootState) => state.mt5.groups);

  useEffect(() => {
    console.log('Debugger - Redux Groups State:', groups);
    groups.forEach((g, i) => {
      console.log(`Group [${i}]:`, {
        Name: g.Group,
        Dedicated: g.DedicatedName,
        dedicated_lowercase: g.dedicated_name,
        Min: g.MinLimit,
        Max: g.MaxLimit
      });
    });
  }, [groups]);

  useEffect(() => {
    const status = store.getState().kyc.verificationStatus;
    if (
      status === "unverified" ||
      status === "partial" ||
      status === "verified"
    ) {
      setStep(status);
    }
  }, []);

  useEffect(() => {
    if (accounts.length === 0) {
      toast.error("No accounts found", {
        description: "Please check if you have any active trading accounts.",
      });
    }
  }, [accounts.length]);

  const [selectedAccountNumber] = selectedAccount.split("|");
  const selectedAccountObj = accounts.find(
    (account) => (account.acc).toString() === selectedAccountNumber
  );

  // State for deposit limits from group_management
  const [depositLimits, setDepositLimits] = useState<{
    minLimit: number | null;
    maxLimit: number | null;
  } | null>(null);
  const [loadingLimits, setLoadingLimits] = useState(false);

  // Fetch deposit limits when account is selected
  useEffect(() => {
    const fetchDepositLimits = async () => {
      if (!selectedAccountNumber) {
        setDepositLimits(null);
        return;
      }

      setLoadingLimits(true);
      try {
        const response = await fetch(`/api/mt5/deposit-limits/${selectedAccountNumber}`);
        const data = await response.json();

        if (data.success && data.data) {
          setDepositLimits({
            minLimit: data.data.minLimit,
            maxLimit: data.data.maxLimit,
          });
          console.log('📊 Deposit limits fetched:', data.data);
        } else {
          setDepositLimits(null);
          console.warn('⚠️ No deposit limits found for account:', selectedAccountNumber);
        }
      } catch (error) {
        console.error('❌ Error fetching deposit limits:', error);
        setDepositLimits(null);
      } finally {
        setLoadingLimits(false);
      }
    };

    fetchDepositLimits();
  }, [selectedAccountNumber]);

  // REMOVED: Startup deposit allowance calculation
  // The maximum deposit limit from database should NOT be reduced by current balance
  // It's a one-time deposit limit, not a cumulative limit
  // const startupAllowance = useMemo(() => { ... }, [selectedAccountObj]);

  // Find applicable group info (Centralized logic)
  const groupInfo = useMemo(() => {
    if (!selectedAccountObj) return null;

    const mt5Accounts = store.getState().mt5.accounts;
    // Ensure we are looking at the same account ID (handle string vs number)
    const originalAccount = mt5Accounts.find(a => String(a.accountId) === String(selectedAccountNumber));

    // STRICT: Use the 'package' field from the DB account to match 'dedicated_name'
    // As per user request: MT5Account (DB) -> package === group_management -> dedicated_name
    let accountPackage = originalAccount?.package || selectedAccountObj.account_type_requested;

    if (!accountPackage) {
      console.warn('Debugger - No package found for account:', selectedAccountNumber, originalAccount, selectedAccountObj);
      return null;
    }

    let identifierLower = accountPackage.toLowerCase();

    // Explicit mapping: UI shows "Startup" for "standard" package, so we must match against "Startup"
    if (identifierLower === 'standard') {
      identifierLower = 'startup';
    }

    // DEBUG: Log all groups and our target package
    console.log('Debugger - Group Lookup:', {
      TargetPackage: accountPackage,
      NormalizedIdentifier: identifierLower,
      AccountID: selectedAccountNumber
    });

    if (groups.length > 0) {
      console.log('Debugger - All Groups Available:', groups.map(g => ({
        Group: g.Group,
        DedicatedName: g.DedicatedName,
        dedicated_name: g.dedicated_name, // Log both casings just in case
        Min: g.MinLimit,
        Max: g.MaxLimit
      })));
    }

    // Match against DedicatedName (primary) or Group name (fallback)
    const foundGroup = groups.find(g => {
      const dName = (g.DedicatedName || g.dedicated_name || '').toLowerCase();
      // Also check standard group name as fallback
      const gName = (g.Group || '').toLowerCase();

      // Strict match on Dedicated Name first as requested
      if (dName === identifierLower) return true;
      if (gName === identifierLower) return true;

      return false;
    });

    if (foundGroup) {
      console.log('Debugger - Group Matched:', {
        Name: foundGroup.Group,
        Dedicated: foundGroup.DedicatedName,
        Min: foundGroup.MinLimit,
        Max: foundGroup.MaxLimit
      });
    } else {
      console.warn('Debugger - No Matching Group Found for:', identifierLower);
    }

    return foundGroup;
  }, [selectedAccountObj, selectedAccountNumber, groups]);


  const handleAccountChange = (value: string) => {
    setSelectedAccount(value);
  };

  const validateAmount = () => {
    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return false;
    }
    if (amountNum < 1) {
      toast.error("Minimum deposit amount is $1");
      return false;
    }

    const totalAfterDeposit = lifetimeDeposit + amountNum;

    // REMOVED: Startup dynamic cap enforcement
    // Maximum deposit limit should be the same as in database, not reduced by current balance

    if (step === "partial" && totalAfterDeposit > 10000) {
      toast.error("Deposit limit is $10,000 for Partially Verified accounts");
      return false;
    }

    // Check Deposit Limits from group_management (Priority: Use API limits, fallback to groupInfo)
    const minLimit = depositLimits?.minLimit ?? groupInfo?.MinLimit;
    const maxLimit = depositLimits?.maxLimit ?? groupInfo?.MaxLimit;

    if (minLimit !== undefined && minLimit !== null && amountNum < minLimit) {
      toast.error(`Minimum deposit for this account is $${minLimit}`);
      return false;
    }
    if (maxLimit !== undefined && maxLimit !== null && amountNum > maxLimit) {
      toast.error(`Maximum deposit for this account is $${maxLimit}`);
      return false;
    }

    return true;
  };

  const handleAmountChange = (value: string) => {
    if (!/^\d*\.?\d*$/.test(value)) return;
    setAmount(value);
    toast.dismiss();

    const amountNum = parseFloat(value);
    if (isNaN(amountNum)) return;
    const totalAfterDeposit = lifetimeDeposit + amountNum;

    // Check against effectiveMax while typing
    if (amountNum > effectiveMax) {
      // Just a warning, blocking handled in validateAmount
    }

    if (amountNum < 1) {
      toast.error("Minimum deposit amount is $1");
      return;
    }
    if (step === "unverified" && totalAfterDeposit > 5000) {
      toast.error("Deposit limit is $5,000 for Unverified accounts");
      return;
    }
    if (step === "partial" && totalAfterDeposit > 10000) {
      toast.error("Deposit limit is $10,000 for Partially Verified accounts");
      return;
    }

    // Check Deposit Limits from group_management (Priority: Use API limits, fallback to groupInfo)
    const minLimit = depositLimits?.minLimit ?? groupInfo?.MinLimit;
    const maxLimit = depositLimits?.maxLimit ?? groupInfo?.MaxLimit;

    if (minLimit !== undefined && minLimit !== null && amountNum < minLimit) {
      toast.error(`Minimum deposit for this account is $${minLimit}`);
      return;
    }
    if (maxLimit !== undefined && maxLimit !== null && amountNum > maxLimit) {
      toast.error(`Maximum deposit for this account is $${maxLimit}`);
      return;
    }
  };

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
    if (!selectedNetwork) {
      toast.error("Network selection required", {
        description: "Please select a network to continue.",
      });
      return;
    }
    if (!validateAmount()) return;

    toast.success("Details verified", {
      description: "Proceeding to the next step.",
    });
    nextStep();
  };

  const { effectiveMin, effectiveMax, limitSource } = useMemo(() => {
    let min = 1; // Default global min
    let max = Infinity;
    let source = "";

    // 1. Verification Limits
    if (step === "unverified") {
      max = 5000;
      source = "Unverified Account";
    } else if (step === "partial") {
      max = 10000;
      source = "Partially Verified";
    }

    // 2. REMOVED: Startup Account Logic that subtracts balance
    // Maximum deposit limit should be the same as in database, not reduced by current balance

    // 3. Deposit Limits from group_management (Priority: API limits, fallback to groupInfo)
    const minLimit = depositLimits?.minLimit ?? groupInfo?.MinLimit;
    const maxLimit = depositLimits?.maxLimit ?? groupInfo?.MaxLimit;

    if (minLimit !== undefined && minLimit !== null && !isNaN(minLimit)) {
      if (minLimit > min) {
        min = minLimit;
      }
    }
    if (maxLimit !== undefined && maxLimit !== null && !isNaN(maxLimit)) {
      if (maxLimit < max) {
        max = maxLimit;
        source = depositLimits ? `Account Package Limit` : `Group Limit (${groupInfo?.DedicatedName || groupInfo?.Group || 'Limited'})`;
      }
    }

    // If max is still Infinity and we have a selected account, set a reasonable default
    if (max === Infinity && selectedAccountNumber) {
      max = 100000; // Default max if no limit found
    }

    return { effectiveMin: min, effectiveMax: max, limitSource: source };
  }, [step, groupInfo, depositLimits, selectedAccountNumber]);

  const getLimitMessage = () => {
    if (!selectedAccountObj) return ""; // Show nothing if no account selected

    const minText = effectiveMin > 0 ? `$${effectiveMin}` : "$1";
    const maxText = effectiveMax === Infinity ? "Unlimited" : `$${effectiveMax.toFixed(2)}`;

    return `Allowed: ${minText} - ${maxText}`;
  };

  return (
    <div className="w-full px-6">
      <h2 className="text-2xl text-center font-bold dark:text-white/75 text-black">
        Pay {amount} {selectedCrypto?.name}
      </h2>
      <div className="-mt-4 w-full">
        <div className="rounded-lg">
          <div className="mt-4">
            <Label className="text-sm dark:text-white/75 text-black mb-1">Account</Label>
            <Select
              onValueChange={handleAccountChange}
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
                    // Only show Live accounts
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
      {selectedCrypto && (
        <div className="mt-4 w-full">
          <div className="rounded-lg">
            <div className="mt-4">
              <Label className="text-sm dark:text-white/75 text-black mb-1">Network</Label>
              <Select disabled value={selectedNetwork || undefined}>
                <SelectTrigger className="border-[#362e36] p-5 flex items-center w-full dark:text-white/75 text-black focus:ring-[#8046c9]">
                  <SelectValue placeholder="Select Network" />
                </SelectTrigger>
                <SelectContent className="border-[#1e171e] dark:bg-[#060207] dark:text-white/75 text-black">
                  {selectedCrypto.networks.map((network) => (
                    <SelectItem
                      key={network.blockchain}
                      value={network.blockchain}
                    >
                      {network.blockchain}
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
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="Enter amount"
                className="dark:text-white/75 text-black pr-12 border-[#362e36] p-5 focus-visible:ring-blue-600 w-full"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 dark:text-white/75 text-black text-sm">
                {selectedCrypto?.name || "USD"}
              </span>
            </div>
            {/* Limit range display */}
            {selectedAccountNumber && (
              <p className="text-xs mt-2 text-[#945393] font-medium">
                {getLimitMessage()}
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
