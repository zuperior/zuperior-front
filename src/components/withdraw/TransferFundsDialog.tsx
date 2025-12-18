import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { store } from "../../store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { TransferFundsDialogProps } from "./types";
import { RootState } from "@/store";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useAppDispatch } from "@/store/hooks";
import { InternalTransfer } from "@/services/internalTransfer";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useFetchUserData } from "@/hooks/useFetchUserData";
import { fetchUserAccountsFromDb } from "@/store/slices/mt5AccountSlice";
// import { CrossIcon } from "lucide-react";
import arrowSideways from "@/assets/icons/arrow-sideways.png";
import Image from "next/image";

const TransferFundsDialog = ({
  open,
  onOpenChange,
  method,
}: TransferFundsDialogProps) => {
  const state = store.getState();
  const accounts = useSelector((state: RootState) => state.mt5.accounts);
  const token = state.auth.token || localStorage.getItem('userToken');

  // Filter invalid/duplicate accounts (e.g., id '0')
  const filteredAccounts = (() => {
    const seen = new Set<string>();
    const arr = accounts.filter((a) => {
      const id = String(a?.accountId ?? '').trim();
      if (!id || id === '0' || !/^\d+$/.test(id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    return arr;
  })();

  const [paymentMethod, setPaymentMethod] = useState<string>(method);
  const [fromAccount, setFromAccount] = useState<string>("");
  const [toAccount, setToAccount] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [step, setStep] = useState<"form" | "review" | "progress">("form");
  const [walletNumber, setWalletNumber] = useState<string>("");
  const dispatch = useAppDispatch();
  const { fetchAllData } = useFetchUserData();
  const router = useRouter();

  const MIN_TRANSFER = 0.01;
  const MAX_TRANSFER = 100000; // Fallback maximum

  const fromAccObj = filteredAccounts.find(
    (account) => account?.accountId && String(account.accountId) === fromAccount
  );
  const fromBalance = fromAccObj ? (fromAccObj.balance ?? 0) : 0;

  // Fetch deposit limits for the "To Account" (destination) to get max transfer limit
  const [depositLimits, setDepositLimits] = useState<{
    minLimit: number | null;
    maxLimit: number | null;
  } | null>(null);
  const [loadingLimits, setLoadingLimits] = useState(false);

  // Fetch deposit limits when "To Account" is selected (destination account)
  useEffect(() => {
    const fetchDepositLimits = async () => {
      // Only fetch if transferring to an MT5 account (not WALLET)
      if (!toAccount || toAccount === 'WALLET') {
        setDepositLimits(null);
        return;
      }

      setLoadingLimits(true);
      try {
        const response = await fetch(`/api/mt5/deposit-limits/${toAccount}`);
        const data = await response.json();

        if (data.success && data.data) {
          setDepositLimits({
            minLimit: data.data.minLimit,
            maxLimit: data.data.maxLimit,
          });
          console.log('📊 Transfer deposit limits fetched for destination account:', data.data);
        } else {
          setDepositLimits(null);
          console.warn('⚠️ No deposit limits found for destination account:', toAccount);
        }
      } catch (error) {
        console.error('❌ Error fetching deposit limits for transfer:', error);
        setDepositLimits(null);
      } finally {
        setLoadingLimits(false);
      }
    };

    fetchDepositLimits();
  }, [toAccount]);

  // Calculate effective maximum transfer limit
  // Should be the minimum of: max_limit (from database) and account balance (available funds)
  const effectiveMaxTransfer = (() => {
    const maxLimit = depositLimits?.maxLimit !== null && depositLimits?.maxLimit !== undefined
      ? depositLimits.maxLimit
      : MAX_TRANSFER;
    // Use the minimum of max_limit and available balance
    return Math.min(maxLimit, fromBalance);
  })();

  useEffect(() => {
    setPaymentMethod(method);
  }, [method]);

  // Fetch MT5 accounts from DB when dialog opens
  useEffect(() => {
    if (open) {
      console.log('🔄 Fetching MT5 accounts for transfer dialog...');
      dispatch(fetchUserAccountsFromDb() as any);
      // Also fetch user's wallet number for wallet transfer option
      const token = localStorage.getItem('userToken');
      fetch('/api/wallet', { headers: token ? { Authorization: `Bearer ${token}` } : undefined, cache: 'no-store' })
        .then(r=>r.json()).then(j=>{
          const wn = j?.data?.walletNumber || j?.walletNumber || '';
          if (wn) setWalletNumber(String(wn));
        }).catch(()=>{});
    }
  }, [open, dispatch]);

  // Debug logging for accounts
  useEffect(() => {
    console.log('📊 MT5 Accounts in TransferFundsDialog:', accounts);
    console.log('📊 Number of accounts:', accounts.length);
    console.log('📊 Filtered accounts:', filteredAccounts);
    console.log('📊 Filtered accounts count:', filteredAccounts.length);
    if (filteredAccounts.length > 0) {
      console.log('📋 Account details:');
      filteredAccounts.forEach((acc, index) => {
        console.log(`  ${index + 1}. ID: ${acc.accountId}, Balance: ${acc.balance}, BalanceType: ${typeof acc.balance}`);
      });
    } else {
      console.log('⚠️ No accounts available for transfer');
    }
  }, [accounts, filteredAccounts]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmount(val);
    const numVal = parseFloat(val);
    
    // Check minimum
    if (val && (isNaN(numVal) || numVal < MIN_TRANSFER)) {
      setError(`Minimum transfer amount is $${MIN_TRANSFER}`);
      return;
    }
    
    // Check maximum (effectiveMaxTransfer is already min of max_limit and balance)
    if (val && numVal > effectiveMaxTransfer) {
      const maxLimit = depositLimits?.maxLimit ?? MAX_TRANSFER;
      if (fromBalance < maxLimit) {
        // Balance is the limiting factor
        setError(`Amount cannot exceed available balance of $${fromBalance.toFixed(2)}`);
      } else {
        // Max limit is the limiting factor
        const maxText = maxLimit === MAX_TRANSFER 
          ? `$${MAX_TRANSFER.toLocaleString()}`
          : `$${maxLimit.toFixed(2)} (account limit)`;
        setError(`Maximum transfer amount is ${maxText}`);
      }
      return;
    }
    
    setError("");
  };

  const handleTransfer = async () => {
    const numAmount = parseFloat(amount);
    
    // Validate amount
    if (!amount || isNaN(numAmount) || numAmount < MIN_TRANSFER) {
      setError(`Minimum transfer amount is $${MIN_TRANSFER}`);
      return;
    }
    
    // Check maximum (effectiveMaxTransfer is already min of max_limit and balance)
    if (numAmount > effectiveMaxTransfer) {
      const maxLimit = depositLimits?.maxLimit ?? MAX_TRANSFER;
      if (fromBalance < maxLimit) {
        // Balance is the limiting factor
        setError(`Amount cannot exceed available balance of $${fromBalance.toFixed(2)}`);
      } else {
        // Max limit is the limiting factor
        const maxText = maxLimit === MAX_TRANSFER 
          ? `$${MAX_TRANSFER.toLocaleString()}`
          : `$${maxLimit.toFixed(2)} (account limit)`;
        setError(`Maximum transfer amount is ${maxText}`);
      }
      return;
    }

    setIsLoading(true);
    try {
      if (!token) {
        toast.error("Please log in to perform transfers");
        return;
      }
      
      // Debug logging
      console.log('🔄 Initiating transfer with data:', {
        fromAccount,
        toAccount,
        amount: parseFloat(amount),
        fromAccountType: typeof fromAccount,
        toAccountType: typeof toAccount,
      });
      
      const response = await InternalTransfer({
        fromAccount,
        toAccount,
        amount: parseFloat(amount),
        comment: "Internal transfer between MT5 accounts",
      });
      if (response.success) {
        toast.success(`$${amount} transferred to #${toAccount}`);
        setStep("progress");
      } else {
        toast.error(response?.message || "Transfer failed");
        setStep("form");
      }
    } catch (error: any) {
      console.error('Transfer error:', error);
      console.error('Error response:', error?.response?.data);
      const errorMessage = error?.response?.data?.message || error?.message || "Unable to transfer funds";
      toast.error(errorMessage);
      setStep("form");
    } finally {
      setIsLoading(false);
      fetchAllData();
    }
  };

  const handleDialogClose = () => {
    onOpenChange(false);
    setStep("form");
    setFromAccount("");
    setToAccount("");
    setAmount("");
    setError("");
    setPaymentMethod(method);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="border-2 border-transparent p-6 dark:text-white/75 rounded-[18px] w-full  [background:linear-gradient(#fff,#fff)_padding-box,conic-gradient(from_var(--border-angle),#ddd,#f6e6fc,theme(colors.purple.400/48%))_border-box] dark:[background:linear-gradient(#070206,#030103)_padding-box,conic-gradient(from_var(--border-angle),#030103,#030103,theme(colors.purple.400/48%))_border-box] animate-border gap-8">
        <DialogHeader>
          <DialogTitle className="dark:text-white/75 text-black">
            Transfer
          </DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <div className="flex flex-col w-full gap-5">
            {/* Payment Method */}
            <Label className="block text-sm font-medium text-black dark:text-white/75">
              Payment Method
              <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled>
                <SelectTrigger className="w-full mt-1 text-black dark:text-white/75">
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="between_accounts">
                    Between your accounts
                  </SelectItem>
                 {/*  <SelectItem value="to_another_user">
                    To another user
                  </SelectItem> */}
                </SelectContent>
              </Select>
            </Label>

            {paymentMethod === "between_accounts" ? (
              <>
                {/* From Account */}
                <Label className="block text-sm font-medium text-black dark:text-white/75 ">
                  From Account
                  <Select value={fromAccount} onValueChange={setFromAccount}>
                    <SelectTrigger className="w-full mt-1 text-black dark:text-white/75">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredAccounts
                        .filter((account) => {
                          // Only show Live accounts
                          const accountType = account?.accountType || 'Live';
                          return accountType === 'Live';
                        })
                        .map((account, index) => (
                        <SelectItem
                          key={`${account?.accountId || 'no-id'}-${index}`}
                          value={account?.accountId?.toString() || ''}
                          disabled={account?.accountId?.toString() === toAccount}
                        >
                          <span className="bg-[#9F8ACF]/30 px-2 py-[2px] rounded-[5px] font-semibold text-black/75 dark:text-white/75 tracking-tighter text-[10px]">
                            MT5
                          </span>
                          <span>{account?.accountId || 'No ID'}</span>
                          <span className="text-xs text-muted-foreground">
                            ${(account?.balance ?? 0).toFixed(2)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Label>

                {/* Swap Button */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setFromAccount(toAccount);
                      setToAccount(fromAccount);
                    }}
                    className="p-2 rounded-full cursor-pointer text-black dark:text-white"
                  >
                    {/* <arrowSideways className="h-4 w-4 !text-gray-800 dark:!text-white rotate-90" /> */}
                    <Image
                      src={arrowSideways}
                      alt="swap accounts"
                      className="h-8 w-8 !text-gray-800 dark:!text-white rotate-90"
                    />
                  </button>
                </div>

                {/* To Account */}
                <Label className="block text-sm font-medium text-black dark:text-white/75">
                  To Account
                  <Select value={toAccount} onValueChange={setToAccount}>
                    <SelectTrigger className="w-full mt-1 text-black dark:text-white/75">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Wallet option */}
                      {walletNumber && (
                        <SelectItem key={`wallet-${walletNumber}`} value={`WALLET`} disabled={fromAccount === 'WALLET'}>
                          <span className="bg-[#9F8ACF]/30 px-2 py-[2px] rounded-[5px] font-semibold text-black/75 dark:text-white/75 tracking-tighter text-[10px]">WALLET</span>
                          <span>{walletNumber}</span>
                        </SelectItem>
                      )}

                      {filteredAccounts
                        .filter((account) => {
                          // Only show Live accounts
                          const accountType = account?.accountType || 'Live';
                          return accountType === 'Live';
                        })
                        .map((account, index) => (
                        <SelectItem
                          key={`${account?.accountId || 'no-id'}-${index}-to`}
                          value={account?.accountId?.toString() || ''}
                          disabled={account?.accountId?.toString() === fromAccount}
                        >
                          <span className="bg-[#9F8ACF]/30 px-2 py-[2px] rounded-[5px] font-semibold text-black/75 dark:text-white/75 tracking-tighter text-[10px]">
                            MT5
                          </span>
                          <span>{account?.accountId || 'No ID'}</span>
                          <span className="text-xs text-muted-foreground">
                            ${(account?.balance ?? 0).toFixed(2)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Label>

                {/* Amount */}
                <Label className="block text-sm font-medium text-black dark:text-white/75">
                  Amount
                  <Input
                    type="number"
                    placeholder="Enter amount in USD"
                    value={amount}
                    onChange={handleAmountChange}
                    min={MIN_TRANSFER}
                    max={Math.min(effectiveMaxTransfer, fromBalance)}
                    step="0.01"
                  />
                  <p className="text-xs mt-1 text-[#945393] font-medium">
                    {(() => {
                      const maxLimit = depositLimits?.maxLimit ?? MAX_TRANSFER;
                      const effectiveMax = Math.min(maxLimit, fromBalance);
                      
                      if (fromBalance < maxLimit) {
                        return `Maximum transfer: $${effectiveMax.toFixed(2)} (limited by available balance)`;
                      } else if (depositLimits?.maxLimit) {
                        return `Maximum transfer: $${effectiveMax.toFixed(2)} (account limit)`;
                      } else {
                        return `Maximum transfer: $${effectiveMax.toFixed(2)}`;
                      }
                    })()}
                  </p>
                  {error && (
                    <span className="text-red-500 text-xs">{error}</span>
                  )}
                </Label>

                {/* Continue Button */}
                <Button
                  onClick={() => setStep("review")}
                  variant="primary"
                  disabled={
                    !!error ||
                    !fromAccount ||
                    !toAccount ||
                    !amount ||
                    isLoading
                  }
                >
                  Continue
                </Button>
              </>
            ) : (
              <DialogDescription asChild>
                <div className="text-center mt-4">
                  <span className="text-lg text-purple-400 font-semibold">
                    Coming soon!
                  </span>
                  <br />
                  <span className="text-sm text-muted-foreground">
                    Transfer to another user will be available in a future
                    update.
                  </span>
                </div>
              </DialogDescription>
            )}
          </div>
        )}

        {step === "review" && (
          <>
            <DialogHeader>
              <DialogTitle className="dark:text-white/75 text-black ">
                Review Transfer
              </DialogTitle>
            </DialogHeader>
            <DialogDescription asChild>
              <div className="dark:text-white/75 text-black mb-4 space-y-2">
                <div>
                  <strong>From Account:</strong> {fromAccount}
                </div>
                <div>
                  <strong>To Account:</strong> {toAccount === 'WALLET' ? `WALLET (${walletNumber||'-'})` : toAccount}
                </div>
                <div>
                  <strong>Amount:</strong> ${parseFloat(amount).toFixed(2)}
                </div>
                <div className="text-sm dark:text-white/75 text-black">
                  Please review the details. Once you confirm, your transfer
                  request will be submitted for processing.
                </div>
                <div className="flex gap-4 justify-end mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => setStep("form")}
                    disabled={isLoading}
                    className="dark:text-white/75 text-black"
                  >
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleTransfer}
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : "Confirm Transfer"}
                  </Button>
                </div>
              </div>
            </DialogDescription>
          </>
        )}

        {step === "progress" && (
          <DialogDescription asChild>
            <div className="flex flex-col items-center gap-6 text-center">
              <DialogTitle>Transfer Successful</DialogTitle>
              <div className="dark:text-white/75 text-black max-w-xs">
                Your transfer has been completed successfully. You can track all
                your transactions on the transaction history page.
              </div>
              <div className="flex gap-4">
                <Button
                  variant="primary"
                  onClick={() => {
                    onOpenChange(false);
                    router.push("/transactions");
                  }}
                  className="dark:text-white/75 text-black"
                >
                  View Transactions
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    onOpenChange(false);
                    router.push("/");
                  }}
                  className="text-black dark:text-white/75"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </DialogDescription>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TransferFundsDialog;
