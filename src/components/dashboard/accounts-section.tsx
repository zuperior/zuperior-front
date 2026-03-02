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
} from "@/store/slices/mt5AccountSlice";
import { useMT5WebSocket } from "@/hooks/useMT5WebSocket";
import { KillSwitchToggle } from "./KillSwitchToggle";

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

  // ✅ Webhook Integration: Replace polling with real-time WebSocket updates
  const activeAccountIds = accounts
    .filter(acc => !acc.archived)
    .map(acc => acc.accountId)
    .filter(Boolean);

  useMT5WebSocket(activeAccountIds);

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
        <div className="flex gap-3 items-center flex-wrap justify-end">
          <KillSwitchToggle />
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
            const archivedAccounts = accounts.filter((account) => !!account.archived);

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
