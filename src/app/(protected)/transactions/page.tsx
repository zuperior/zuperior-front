"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useAppDispatch } from "@/store/hooks";
import {
  getTransactions,
  Withdraw,
  Deposit,
  Bonus,
  MT5Transaction,
} from "@/store/slices/transactionsSlice";
import { fetchUserAccountsFromDb } from "@/store/slices/mt5AccountSlice";
import { format } from "date-fns";
import { TransactionsHeader } from "@/components/transactions/TransactionsHeader";
import { TransactionsToolbar } from "@/components/transactions/TransactionToolbar";
import { TransactionsTable } from "@/components/transactions/TransactionTable";

const cardMaskStyle: React.CSSProperties = {
  WebkitMaskImage:
    "linear-gradient(212deg, rgb(49,27,71) 0%, rgb(20,17,24) 100%)",
  maskImage:
    "linear-gradient(100deg, rgba(0, 0, 0, 0.1) 10%, rgba(0, 0, 0, 0.4) 100%)",
  borderRadius: "15px",
  opacity: 0.25,
  position: "absolute",
  padding: "1px",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 0,
  pointerEvents: "none",
};

export default function TransactionsPage() {
  const dispatch = useAppDispatch();
  const [wallet, setWallet] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchUserAccountsFromDb() as any);
    // Fetch wallet info
    const loadWallet = async () => {
      const token = localStorage.getItem('userToken');
      try {
        const r = await fetch('/api/wallet', { headers: token ? { Authorization: `Bearer ${token}` } : undefined, cache: 'no-store' });
        const j = await r.json();
        if (j?.success) setWallet(j.data);
      } catch (e) {
        console.error('Failed to load wallet:', e);
      }
    };
    loadWallet();
  }, [dispatch]);

  // Map accounts to dropdown items - only Live accounts, plus Wallet
  const accounts = useSelector((state: RootState) => {
    const mt5Accounts = state.mt5.accounts
      .filter((account) => account.accountType === 'Live')
      .map((account) => ({
        id: String(account.accountId),
        type: account.package || "Live",
        isWallet: false,
      }));

    // Add Wallet if available
    if (wallet?.walletNumber) {
      mt5Accounts.unshift({
        id: wallet.walletNumber,
        type: "Wallet",
        isWallet: true,
      });
    }

    return mt5Accounts;
  }) || [];

  const [activeTab, setActiveTab] = useState<"all" | "deposits" | "withdrawals">("all");
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingTx, setLoadingTx] = useState(false);

  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [transactionsData, setTransactionsData] = useState<{
    deposits: Deposit[];
    withdrawals: Withdraw[];
    mt5Transactions: MT5Transaction[];
    bonuses: Bonus[];
    status?: string;
    MT5_account?: string | number;
  }>({
    deposits: [],
    withdrawals: [],
    mt5Transactions: [],
    bonuses: [],
    status: "",
    MT5_account: "",
  });

  type DateRange = { from: Date | undefined; to?: Date };

  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [tempRange, setTempRange] = useState<DateRange>({ from: undefined, to: undefined });

  const getAccountTransactions = async (accountId: string, from?: Date, to?: Date) => {
    console.log("🔍 Fetching transactions for account:", accountId);
    setLoadingTx(true);
    setSelectedAccountId(accountId);

    // Check if this is a wallet account
    const isWalletAccount = wallet?.walletNumber === accountId;

    // Clear wallet transactions if this is NOT a wallet account
    if (!isWalletAccount) {
      setWalletTransactions([]);
    }

    try {
      if (isWalletAccount) {
        // Fetch wallet transactions
        const token = localStorage.getItem('userToken');
        const r = await fetch('/api/wallet/transactions?limit=200', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: 'no-store'
        });
        const j = await r.json();
        if (j?.success) {
          setWalletTransactions(j.data || []);
          // Set empty MT5 transactions
          setTransactionsData({
            deposits: [],
            withdrawals: [],
            mt5Transactions: [],
            bonuses: [],
            status: "Success",
            MT5_account: accountId,
          });
        } else {
          setWalletTransactions([]);
          setTransactionsData({
            deposits: [],
            withdrawals: [],
            mt5Transactions: [],
            bonuses: [],
            status: "",
            MT5_account: accountId,
          });
        }
      } else {
        // Fetch MT5 transactions
        let start_date: string | undefined;
        let end_date: string | undefined;

        if (from && to) {
          start_date = format(from, "yyyy-MM-dd");
          end_date = format(to, "yyyy-MM-dd");
        } else if (from) {
          start_date = format(from, "yyyy-MM-dd");
          end_date = format(from, "yyyy-MM-dd");
        }

        console.log("📤 Dispatching getTransactions with:", {
          account_number: accountId,
          start_date,
          end_date,
        });

        const result = await dispatch(
          getTransactions({
            account_number: accountId,
            start_date,
            end_date,
          })
        ).unwrap();

        console.log("📥 Received transactions result:", result);

        setTransactionsData({
          deposits: result.deposits || [],
          withdrawals: result.withdrawals || [],
          mt5Transactions: result.mt5Transactions || [],
          bonuses: result.bonuses || [],
          status: result.status,
          MT5_account: result.MT5_account || accountId,
        });
        setWalletTransactions([]);
      }

      console.log("✅ Transactions data set successfully");
    } catch (error) {
      console.error("❌ Error fetching transactions:", error);
      setTransactionsData({
        deposits: [],
        withdrawals: [],
        mt5Transactions: [],
        bonuses: [],
        status: "",
        MT5_account: accountId,
      });
      setWalletTransactions([]);
    } finally {
      setLoadingTx(false);
    }
  };

  // Build table data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tableData: any[] = [];
  const isWalletAccount = wallet?.walletNumber === selectedAccountId;

  // Only show wallet transactions if wallet account is selected
  // Never show wallet transactions for MT5 accounts
  if (isWalletAccount && selectedAccountId) {
    // For wallet account, show wallet transactions
    const filteredWalletTx = activeTab === "all"
      ? walletTransactions
      : activeTab === "deposits"
        ? walletTransactions.filter((tx) => tx.type === 'MT5_TO_WALLET' || tx.type === 'DEPOSIT')
        : walletTransactions.filter((tx) => tx.type === 'WALLET_TO_MT5' || tx.type === 'WITHDRAWAL');

    tableData = filteredWalletTx.map((tx) => ({
      amount: tx.amount,
      profit: tx.amount,
      comment: tx.description || (tx.type === 'MT5_TO_WALLET' ? `From MT5 ${tx.mt5AccountId || ''} to Wallet` : tx.type === 'WALLET_TO_MT5' ? `From Wallet to MT5 ${tx.mt5AccountId || ''}` : tx.type || 'Transaction'),
      type: tx.type === 'MT5_TO_WALLET' ? 'Internal Transfer In' : tx.type === 'WALLET_TO_MT5' ? 'Internal Transfer Out' : tx.type === 'WITHDRAWAL' ? 'Withdrawal' : tx.type === 'DEPOSIT' ? 'Deposit' : tx.type || 'Transaction',
      status: tx.status || 'completed',
      open_time: tx.createdAt,
      account_id: selectedAccountId,
      depositID: tx.withdrawalId || tx.id,
      id: tx.id,
    }));
  } else {
    // For MT5 accounts, show deposits, withdrawals, and internal transfers
    if (activeTab === "all") {
      tableData = [
        ...transactionsData.deposits.map((tx) => ({
          ...tx,
          type: "Deposit",
          status: tx.status || transactionsData.status || "Success",
          account_id: transactionsData.MT5_account || tx.login,
        })),
        ...transactionsData.withdrawals.map((tx: any) => ({
          ...tx,
          type: tx.type || "Withdrawal",
          status: tx.status || transactionsData.status || "Success",
          account_id: transactionsData.MT5_account || tx.login,
        })),
        // Include internal transfers from MT5 to Wallet
        ...transactionsData.mt5Transactions
          .filter((tx) => tx.type === 'MT5_TO_WALLET' || tx.comment?.includes('to Wallet') || tx.comment?.includes('to wallet'))
          .map((tx) => ({
            ...tx,
            type: "Internal Transfer",
            status: tx.status || transactionsData.status || "Success",
            account_id: transactionsData.MT5_account || tx.login || selectedAccountId,
            comment: tx.comment || `Transfer from MT5 ${selectedAccountId} to Wallet`,
            open_time: tx.open_time,
          })),
      ];
    } else if (activeTab === "deposits") {
      tableData = [
        ...transactionsData.deposits.map((tx) => ({
          ...tx,
          type: "Deposit",
          status: tx.status || transactionsData.status || "Success",
          account_id: transactionsData.MT5_account || tx.login,
        })),
        // Include internal transfers in deposits tab as they're incoming to wallet
        ...transactionsData.mt5Transactions
          .filter((tx) => tx.type === 'MT5_TO_WALLET' || tx.comment?.includes('to Wallet') || tx.comment?.includes('to wallet'))
          .map((tx) => ({
            ...tx,
            type: "Internal Transfer",
            status: tx.status || transactionsData.status || "Success",
            account_id: transactionsData.MT5_account || tx.login || selectedAccountId,
            comment: tx.comment || `Transfer from MT5 ${selectedAccountId} to Wallet`,
            open_time: tx.open_time,
          })),
      ];
    } else {
      // Withdrawals tab - show withdrawals from transactionsData.withdrawals
      tableData = transactionsData.withdrawals.map((tx: any) => ({
        ...tx,
        type: tx.type || "Withdrawal",
        status: tx.status || transactionsData.status || "Success",
        account_id: transactionsData.MT5_account || tx.login,
      }));
    }
  }

  // Search
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase();
    tableData = tableData.filter(
      (tx) =>
        (tx.depositID || tx.account_id || "")
          .toString()
          .toLowerCase()
          .includes(term) ||
        ((tx.login || "") as string).toLowerCase().includes(term)
    );
  }

  // Sort newest first
  tableData.sort((a, b) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parseTime = (t: any) => {
      if (!t) return 0;
      const num = Number(t);
      if (!isNaN(num)) {
        // Unix seconds vs ms
        return num < 1e12 ? num * 1000 : num;
      }
      return new Date(t).getTime() || 0;
    };
    return parseTime(b.open_time) - parseTime(a.open_time);
  });

  return (
    <div className="flex flex-col dark:bg-[#01040D]">
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto dark:bg-[#01040D]">
          <div>
            <TransactionsHeader
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              cardMaskStyle={cardMaskStyle}
            />
            <div className="pt-3.75 overflow-x-hidden text-black dark:text-white flex flex-col gap-3.75">
              <div className="rounded-[15px] dark:bg-linear-to-r dark:from-[#15101d] from-[#181422] to-[#181422] dark:to-[#181422] border border-black/10 dark:border-none p-3">
                <TransactionsToolbar
                  accounts={accounts}
                  selectedAccountId={selectedAccountId}
                  setSelectedAccountId={setSelectedAccountId}
                  getAccountTransactions={getAccountTransactions}
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  calendarOpen={calendarOpen}
                  setCalendarOpen={setCalendarOpen}
                  tempRange={tempRange}
                  setTempRange={setTempRange}
                />
                <TransactionsTable
                  loadingTx={loadingTx}
                  selectedAccountId={selectedAccountId}
                  tableData={tableData}
                  onRefresh={() => {
                    if (selectedAccountId) {
                      getAccountTransactions(selectedAccountId, dateRange.from, dateRange.to);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
