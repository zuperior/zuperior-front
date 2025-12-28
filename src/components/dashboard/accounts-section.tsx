"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { useSelector, useDispatch } from "react-redux";
import { Button } from "../ui/button";
import { Tabs, TabsContent } from "../ui/tabs";
import { Plus } from "lucide-react";
import { Dialog, DialogTrigger } from "../ui/dialog";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { RootState } from "../../store";
import AccountDetails from "./account-details";
import { TpAccountSnapshot } from "@/types/user-details";
import { MT5Account } from "@/store/slices/mt5AccountSlice";
import {
  fetchUserAccountsFromDb,
  fetchAllAccountsWithBalance,
} from "@/store/slices/mt5AccountSlice";

interface AccountsSectionProps {
  onOpenNewAccount: () => void;
}

// Custom event to notify tab switching after unarchive
const UNARCHIVE_EVENT = 'account-unarchived';

// Type for unarchive event detail
interface UnarchiveEventDetail {
  accountType: string;
}

// Helper function to map MT5Account to TpAccountSnapshot (for AccountDetails component)
const mapMT5AccountToTpAccount = (mt5Account: MT5Account): TpAccountSnapshot => {
  // IMPORTANT: Always use the latest balance from Redux state (from fetchAllAccountsWithBalance)
  // Force number conversion to ensure we get the latest value, not cached
  const balance = mt5Account.balance !== undefined && mt5Account.balance !== null
    ? Number(mt5Account.balance)
    : 0;
  const equity = mt5Account.equity !== undefined && mt5Account.equity !== null
    ? Number(mt5Account.equity)
    : 0;
  const profit = mt5Account.profit !== undefined && mt5Account.profit !== null
    ? Number(mt5Account.profit)
    : 0;

  console.log(`[AccountsSection] 📊 Mapping account ${mt5Account.accountId} - Balance: ${balance}, Equity: ${equity}, Profit: ${profit}`);

  return {
    tradingplatformaccountsid: parseInt(mt5Account.accountId),
    account_name: parseInt(mt5Account.accountId),
    platformname: "MT5",
    acc: parseInt(mt5Account.accountId),
    account_type: mt5Account.accountType || "Live",
    account_type_requested: mt5Account.package || null,
    leverage: mt5Account.leverage || 100,
    balance: balance.toString(), // Use latest balance from Redux state
    credit: (mt5Account.credit || 0).toString(),
    equity: equity.toString(), // Use latest equity from Redux state
    margin: (mt5Account.margin || 0).toString(),
    margin_free: (mt5Account.marginFree || 0).toString(),
    margin_level: (mt5Account.marginLevel || 0).toString(),
    closed_pnl: profit.toString(), // P/L from MT5 API
    open_pnl: "0",
    provides_balance_history: true,
    tp_account_scf: {
      tradingplatformaccountsid: parseInt(mt5Account.accountId),
      cf_1479: mt5Account.nameOnAccount || ""
    }
  };
};

export function AccountsSection({ onOpenNewAccount }: AccountsSectionProps) {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();
  const dispatch = useDispatch();

  const { accounts, ownerClientId, isFetchingAccounts } = useSelector((state: RootState) => state.mt5);
  const currentClientId = typeof window !== 'undefined' ? localStorage.getItem('clientId') : null;

  const hasBasicAccountInfo =
    accounts &&
    accounts.length > 0 &&
    (!ownerClientId || !currentClientId || ownerClientId === currentClientId);

  const [activeTab, setActiveTab] = useState<"live" | "demo" | "archived">(
    "live"
  );

  const balancePollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const profilesFetchedRef = useRef<Set<string>>(new Set());
  const detailsFetchedRef = useRef<Set<string>>(new Set());

  // Fetch accounts from DB once on mount (fetch all, including archived for Archive tab)
  useEffect(() => {
    dispatch(fetchUserAccountsFromDb({ includeArchived: true }) as any);
  }, [dispatch]);

  // Listen for unarchive events to switch tabs
  useEffect(() => {
    const handleUnarchive = (event: CustomEvent<UnarchiveEventDetail>) => {
      const { accountType } = event.detail;
      // Switch to the appropriate tab based on account type
      if (accountType?.toLowerCase() === 'demo') {
        setActiveTab('demo');
      } else {
        setActiveTab('live');
      }
    };

    window.addEventListener(UNARCHIVE_EVENT as any, handleUnarchive as EventListener);
    return () => {
      window.removeEventListener(UNARCHIVE_EVENT as any, handleUnarchive as EventListener);
    };
  }, []);

  // ✅ AUTO-REFRESH: Fetch all account balances every 10 seconds to keep balances up-to-date
  // Uses optimized endpoint that fetches all balances in parallel (fast & accurate)
  const accountsRef = useRef(accounts);
  const dispatchRef = useRef(dispatch);
  const hasInitializedRef = useRef(false);

  // Update refs when values change (but don't restart polling)
  useEffect(() => {
    accountsRef.current = accounts;
    dispatchRef.current = dispatch;
  }, [accounts, dispatch]);

  useEffect(() => {
    // Skip if already initialized and interval is running - don't restart polling
    if (hasInitializedRef.current && balancePollIntervalRef.current) {
      return;
    }

    // Only start polling when accounts first become available
    if (accounts.length === 0) {
      // Clear interval if no accounts and interval exists
      if (balancePollIntervalRef.current) {
        clearInterval(balancePollIntervalRef.current);
        balancePollIntervalRef.current = null;
        hasInitializedRef.current = false;
      }
      return;
    }

    // Mark as initialized to prevent restarting on subsequent account updates
    hasInitializedRef.current = true;

    // Clear any cached balance data from localStorage on first mount
    if (typeof window !== 'undefined') {
      try {
        const persistRoot = localStorage.getItem('persist:root');
        if (persistRoot) {
          const parsed = JSON.parse(persistRoot);
          if (parsed.mt5) {
            const mt5Data = JSON.parse(parsed.mt5);
            // Force clear accounts array from persisted data
            if (mt5Data.accounts) {
              mt5Data.accounts = [];
              parsed.mt5 = JSON.stringify(mt5Data);
              localStorage.setItem('persist:root', JSON.stringify(parsed));
              console.log(`[AccountsSection] 🗑️ Cleared cached account balances from localStorage`);
            }
          }
        }
      } catch (e) {
        console.warn(`[AccountsSection] ⚠️ Failed to clear cache:`, e);
      }
    }

    // Function to fetch balances - uses ref to get latest accounts without restarting effect
    const fetchBalances = () => {
      const currentAccounts = accountsRef.current;
      if (currentAccounts.length === 0) {
        console.log(`[AccountsSection] ⏭️ Skipping balance refresh - no accounts`);
        return;
      }

      console.log(`[AccountsSection] 🔄 Refreshing account balances (${currentAccounts.length} accounts) - ${new Date().toLocaleTimeString()}`);

      // Dispatch the action - fire and forget style to ensure polling never stops
      // The Redux reducer handles success/failure internally, and polling continues regardless
      try {
        dispatchRef.current(fetchAllAccountsWithBalance() as any);
      } catch (error: any) {
        // This should rarely happen, but if it does, log it and continue polling
        console.warn(`[AccountsSection] ⚠️ Error dispatching balance fetch (will retry in 10s):`, error?.message || error);
      }
    };

    // Fetch immediately on mount
    fetchBalances();

    // Set up polling every 30 seconds - this will continue until component unmounts
    balancePollIntervalRef.current = setInterval(() => {
      fetchBalances();
    }, 30000); // 30 seconds

    console.log(`[AccountsSection] ✅ Started automatic balance refresh every 30 seconds for ${accounts.length} accounts`);
  }, [accounts.length]); // Check when accounts become available, but guard prevents restarting

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (balancePollIntervalRef.current) {
        clearInterval(balancePollIntervalRef.current);
        balancePollIntervalRef.current = null;
        hasInitializedRef.current = false;
        console.log(`[AccountsSection] 🛑 Stopped automatic balance refresh - component unmounting`);
      }
    };
  }, []); // Only run cleanup on unmount

  // Trigger immediate refresh when window gains focus or tab becomes visible
  useEffect(() => {
    const onFocus = () => {
      try {
        dispatchRef.current(fetchAllAccountsWithBalance() as any);
      } catch (_) { }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') onFocus();
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // DISABLED: Fetch ClientProfile - stopped per user request to prevent continuous API calls
  // useEffect(() => {
  //   if (accounts.length > 0) {
  //     accounts.forEach((account) => {
  //       // Skip if already fetched or no password
  //       if (profilesFetchedRef.current.has(account.accountId) || !account.password) {
  //         return;
  //       }
  //       
  //       profilesFetchedRef.current.add(account.accountId);
  //       dispatch(fetchAccountProfile({ 
  //         accountId: account.accountId, 
  //         password: account.password 
  //       }) as any);
  //     });
  //   }
  // }, [accounts, dispatch]);

  // DISABLED: Poll Balance and Profit - polling stopped per user request
  // useEffect(() => {
  //   // Clear existing interval
  //   if (balancePollIntervalRef.current) {
  //     clearInterval(balancePollIntervalRef.current);
  //   }

  //   // Only start polling if we have accounts with passwords
  //   const accountsWithPasswords = accounts.filter(acc => acc.password);
  //   if (accountsWithPasswords.length === 0) {
  //     return;
  //   }

  //   // Poll immediately, then every 400ms
  //   const poll = () => {
  //     accountsWithPasswords.forEach((account) => {
  //       dispatch(fetchAccountBalanceAndProfit({ 
  //         accountId: account.accountId, 
  //         password: account.password! 
  //       }) as any);
  //     });
  //   };

  //   poll(); // Initial poll
  //   balancePollIntervalRef.current = setInterval(poll, 400);

  //   // Cleanup on unmount
  //   return () => {
  //     if (balancePollIntervalRef.current) {
  //       clearInterval(balancePollIntervalRef.current);
  //     }
  //   };
  // }, [accounts, dispatch]);

  const maskStyle: React.CSSProperties = {
    WebkitMaskImage:
      "linear-gradient(100deg, rgba(255, 255, 255, 0.75) 10%, rgba(255, 255, 255, 0.25) 100%)",
    maskImage:
      "linear-gradient(100deg, rgba(255, 255, 255, 0.75) 10%, rgba(255, 255, 255, 0.25) 100%)",
    borderRadius: "15px",
    opacity: 0.75,
    inset: 0,
    overflow: "visible",
    position: "absolute",
    zIndex: 0,
  };


  const cardMaskStyle: React.CSSProperties = {
    WebkitMaskImage:
      "linear-gradient(212deg,_rgb(49,27,71)_0%,_rgb(20,17,24)_100%)",
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

  const showOverlay = isFetchingAccounts && (!accounts || accounts.length === 0);

  return (
    <div className="px-2.5 md:px-0 relative">
      <div className="mb-2.5 flex items-end justify-between w-full">
        <AnimatePresence mode="wait">
          <motion.h2
            key={theme}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ease: "easeInOut" }}
            className="text-xl sm:text-2xl font-bold text-black/85 dark:text-white/85 tracking-tighter"
          >
            Accounts
          </motion.h2>
        </AnimatePresence>
        <div className="flex gap-2 items-center">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={onOpenNewAccount}
                className="relative gap-1 cursor-pointer font-semibold text-white rounded-[15px] px-4 sm:px-6 py-2 sm:py-2.5 text-xs leading-6 h-9 sm:h-11 
            [background:radial-gradient(ellipse_27%_80%_at_0%_0%,rgba(163,92,162,0.5),rgba(0,0,0,1))]
             hover:bg-transparent dark:[background:black]"
              >
                <Plus className="w-3 h-3" /> Open New Account
                <div
                  style={maskStyle}
                  className="dark:border dark:border-white/50 pointer-events-none"
                />
              </Button>
            </DialogTrigger>
          </Dialog>
          {/* Refresh button removed as requested */}
        </div>
      </div>
      <Tabs
        defaultValue="live"
        value={activeTab}
        onValueChange={(value) => {
          if (value === "live" || value === "demo" || value === "archived") {
            setActiveTab(value);
          }
        }}
        className="mb-[16px] rounded-[15px] border border-dashed border-white/10 p-[15px] pt-2.5 dark:bg-transparent bg-white"
      >
        {showOverlay && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[15px] bg-black/40 backdrop-blur-sm">
            <div className="flex flex-col items-center justify-center space-y-4">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="w-32 h-32 object-contain"
              >
                <source src="/logo.mp4" type="video/mp4" />
              </video>
              <span className="text-sm font-semibold text-white/80">Loading MT5 accounts please hold on...</span>
            </div>
          </div>
        )}
        <div className="flex justify-center items-center">
          <ToggleGroup
            type="single"
            value={activeTab}
            onValueChange={(value) => {
              if (
                value === "live" ||
                value === "demo" ||
                value === "archived"
              ) {
                setActiveTab(value);
              }
            }}
            className="p-2 relative rounded-[10px]"
          >
            {theme === "dark" ? (
              <div style={cardMaskStyle} className="border border-white/45" />
            ) : (
              <div
                style={{
                  borderRadius: "15px",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 0,
                  pointerEvents: "none",
                }}
                className="border border-[#e7e7e7]"
              />
            )}
            <ToggleGroupItem value="live" className="z-10 cursor-pointer">
              Live
            </ToggleGroupItem>
            <ToggleGroupItem value="demo" className="z-10 cursor-pointer">
              Demo
            </ToggleGroupItem>
            <ToggleGroupItem value="archived" className="z-10 cursor-pointer">
              Archived
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        {/* Live Accounts */}
        <TabsContent value="live">
          {isFetchingAccounts && (!accounts || accounts.length === 0) ? (
            <div className="flex items-center justify-center py-10">
              <svg className="animate-spin h-6 w-6 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
              <span className="ml-3 text-sm text-white/70">Fetching accounts…</span>
            </div>
          ) : hasBasicAccountInfo ? (
            accounts
              .filter((account) => account.accountType === "Live" && !account.archived)
              .map((account, index) => {
                const mappedAccount = mapMT5AccountToTpAccount(account);
                return (
                  <AccountDetails
                    key={`${account.accountId}-${index}`}
                    accountId={mappedAccount.acc}
                    platformName={mappedAccount.platformname}
                    accountType={account.accountType}
                    accountDetails={mappedAccount}
                    isReady={true}
                    archived={!!account.archived}
                    accountInternalId={account.id}
                  />
                );
              })
          ) : (
            <div className="text-center py-4 text-gray-500">
              No live accounts available
            </div>
          )}
        </TabsContent>

        {/* Demo Accounts */}
        <TabsContent value="demo">
          {(() => {
            const demoAccounts = accounts.filter((account) => account.accountType === "Demo" && !account.archived);
            if (demoAccounts.length > 0) {
              return demoAccounts.map((account, index) => {
                const mappedAccount = mapMT5AccountToTpAccount(account);
                return (
                  <AccountDetails
                    key={`${account.accountId}-${index}`}
                    accountId={mappedAccount.acc}
                    platformName={mappedAccount.platformname}
                    accountType={account.accountType}
                    accountDetails={mappedAccount}
                    isReady={true}
                    archived={!!account.archived}
                    accountInternalId={account.id}
                  />
                );
              });
            }
            return (
              <div className="text-center py-4 text-gray-500">
                No Demo accounts available
              </div>
            );
          })()}
        </TabsContent>

        {/* Archived Accounts */}
        <TabsContent value="archived">
          {(() => {
            // Debug logging
            console.log('[AccountsSection] All Accounts:', accounts.map(a => ({ id: a.accountId, archived: a.archived, type: typeof a.archived })));

            const archivedAccounts = accounts.filter((account) => !!account.archived);
            console.log('[AccountsSection] Archived Accounts Filtered:', archivedAccounts.length);

            if (archivedAccounts.length > 0) {
              return archivedAccounts.map((account, index) => {
                const mappedAccount = mapMT5AccountToTpAccount(account);
                return (
                  <AccountDetails
                    key={`${account.accountId}-${index}`}
                    accountId={mappedAccount.acc}
                    platformName={mappedAccount.platformname}
                    accountType={account.accountType}
                    accountDetails={mappedAccount}
                    isReady={true}
                    archived={true}
                    accountInternalId={account.id}
                  />
                );
              });
            }
            return (
              <div className="text-center py-4 text-gray-500">
                No archived accounts available
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
