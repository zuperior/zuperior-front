"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "../components/ui/button";
import { authService } from "@/services/api.service";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchAllAccountsWithBalance, fetchUserAccountsFromDb } from "@/store/slices/mt5AccountSlice";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useEffect, useMemo, useState } from "react";
import { useLoading } from "@/context/LoadingContext";

// Icons
import Sun from "@/assets/icons/sun.png";
import MoonDark from "@/assets/icons/moonDark.png";
// import Globe from "@/assets/globe.svg";
// import GlobeDark from "@/assets/icons/globeDark.png";
// import Qr from "@/assets/icons/qr.png";
// import QrDark from "@/assets/icons/qrDark.png";
// import Bell from "@/assets/icons/bell.png";
// import BellDark from "@/assets/icons/bellDark.png";
import { getMenuItems } from "@/lib/sidebar-config";
import { wallet, depositsBlack } from "@/lib/sidebar-assets";
import Profile from "@/assets/icons/profile.png";
import ProfileDark from "@/assets/icons/userDark.png";
import { CircleUser, Headset, LogOut, Settings, Lightbulb, Menu, ChevronDown } from "lucide-react";
import { WalletMoveDialog } from "@/components/wallet/WalletMoveDialog";
import { NotificationPanel } from "@/components/NotificationPanel";
import { SuggestFeatureDialog } from "@/components/SuggestFeatureDialog";

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  // Get icons from sidebar menu items
  const currentTheme = resolvedTheme || theme || "dark";
  const menuItems = getMenuItems({ theme: currentTheme === "light" ? "light" : "dark" });
  const paymentMethodsMenuItem = menuItems.find(item => item.name === "Payment Methods");
  // Light mode: use wallet icon directly, Dark mode: use payment method icon from sidebar
  const walletIcon = currentTheme === "light" ? wallet : paymentMethodsMenuItem?.icon;
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [walletNumber, setWalletNumber] = useState<string>("");
  const [hideBalance, setHideBalance] = useState<boolean>(false);
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [suggestFeatureDialogOpen, setSuggestFeatureDialogOpen] = useState(false);
  const [transferDirection, setTransferDirection] = useState<"MT5_TO_WALLET" | "WALLET_TO_MT5">("MT5_TO_WALLET");
  const dispatch = useAppDispatch();
  const mt5Total = useAppSelector((s) => s.mt5.totalBalance);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Get user data from localStorage
  const getUserData = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  };

  const userDetails = getUserData();
  const fullName = userDetails?.name ?? "";
  const firstName = fullName.split(" ")[0] ?? "";

  // Helper to refresh wallet balance
  const refreshWalletBalance = (incoming?: number) => {
    if (typeof incoming === 'number' && !Number.isNaN(incoming)) {
      setWalletBalance(incoming);
      return;
    }
    try {
      const token = localStorage.getItem('userToken');
      fetch('/api/wallet', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        cache: 'no-store',
      })
        .then((r) => r.json())
        .then((j) => {
          const bal = Number(j?.data?.balance ?? j?.balance ?? 0);
          if (!Number.isNaN(bal)) setWalletBalance(bal);
          if (j?.data?.walletNumber) setWalletNumber(String(j.data.walletNumber));
        })
        .catch(() => { });
    } catch { }
  };

  // Initial fetch and live update via custom event from pages/dialogs
  useEffect(() => {
    // Load hidden preference
    try {
      const pref = localStorage.getItem('hideBalance');
      if (pref === '1' || pref === 'true') setHideBalance(true);
    } catch { }
    refreshWalletBalance();
    const handler = (e: Event) => {
      // Support CustomEvent with optional { detail: { balance } }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const anyEvent = e as any;
      const balance = anyEvent?.detail?.balance;
      refreshWalletBalance(typeof balance === 'number' ? balance : undefined);
    };
    window.addEventListener('wallet:refresh', handler as EventListener);
    return () => window.removeEventListener('wallet:refresh', handler as EventListener);
  }, []);

  // Ensure MT5 total balance is available for dropdown
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
    if (!token) return; // skip if not logged in
    // Try to fetch accounts/balances if we don't have any total yet
    dispatch(fetchUserAccountsFromDb() as any).finally(() => {
      dispatch(fetchAllAccountsWithBalance() as any).catch(() => { });
    });
  }, [dispatch]);

  // Listen for MT5 balance refresh events (triggered after internal transfers)
  useEffect(() => {
    const handler = async () => {
      console.log('[Navbar] 🔄 MT5 refresh event received, refreshing balances from database...');
      try {
        // Refresh balances from database (source of truth)
        await dispatch(fetchUserAccountsFromDb() as any);
        await dispatch(fetchAllAccountsWithBalance() as any);
        console.log('[Navbar] ✅ MT5 balances refreshed from database');
      } catch (error) {
        console.error('[Navbar] ❌ Failed to refresh MT5 balances:', error);
      }
    };
    window.addEventListener('mt5:refresh', handler);
    return () => window.removeEventListener('mt5:refresh', handler);
  }, [dispatch]);

  const formattedBalance = useMemo(() => {
    if (walletBalance === null || walletBalance === undefined) return '-';
    const s = `$${walletBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return hideBalance ? '••••••' : s;
  }, [walletBalance, hideBalance]);

  const formattedMt5Total = useMemo(() => {
    const s = `$${Number(mt5Total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return hideBalance ? '••••••' : s;
  }, [mt5Total, hideBalance]);

  const formattedTotalBalance = useMemo(() => {
    const wallet = walletBalance === null || walletBalance === undefined ? 0 : walletBalance;
    const mt5 = Number(mt5Total || 0);
    const total = wallet + mt5;
    const s = `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return hideBalance ? '••••••' : s;
  }, [walletBalance, mt5Total, hideBalance]);

  const onToggleHide = (val: boolean) => {
    setHideBalance(val);
    try { localStorage.setItem('hideBalance', val ? '1' : '0'); } catch { }
  };

  const handleLogoutWithDelay = () => {
    setIsLoggingOut(true);
    setTimeout(() => {
      authService.logout();
      setIsLoggingOut(false);
      setLogoutDialogOpen(false);
    }, 1000);
  };

  return (
    <header className="sticky top-0 flex py-5 items-center justify-between border-b border-black/10 dark:border-white/10 bg-white dark:bg-[#01040D] px-[15px] z-50 shrink-0">
      {/* Left Side - Mobile Menu Button */}
      <button
        onClick={onMenuClick}
        className="xl:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5 text-black dark:text-white" />
      </button>

      {/* Right Side */}
      <div className="flex items-center gap-2.5 ml-auto">
        {/* <Button className="rounded-[10px] flex items-center gap-[5px] py-2 px-6 text-white bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-xs leading-[14px] cursor-pointer">
          Balance:
          <p>${formattedBalance}</p>
        </Button> */}

        {/* Wallet balance dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="flex rounded-[10px] items-center gap-[6px] py-2 px-2 md:px-4 text-white dark:bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-xs leading-[14px] cursor-pointer [background:radial-gradient(ellipse_27%_80%_at_0%_0%,rgba(163,92,162,0.5),rgba(0,0,0,1))] hover:bg-transparent">
              {/* Mobile: Show only icon, Desktop: Show balance + icon */}
              <span className="inline">{formattedTotalBalance}</span>
              {walletIcon && (
                <Image 
                  className="h-5 w-5" 
                  src={walletIcon} 
                  alt="Wallet" 
                />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-62 p-3 dark:bg-[#01040D] border border-[#9F8BCF]/25 rounded-[12px] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-black dark:text-white/70">Hide balance</span>
              <Switch checked={hideBalance} onCheckedChange={onToggleHide} />
            </div>
            <div className="w-full h-px dark:bg-white/10 bg-black/10" />

            {/* Wallet summary */}
            <DropdownMenuItem asChild className="p-0">
              <div className="block w-full">
                <div className="w-full px-2 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-[8px]">
                  <div className="flex items-start justify-between mb-2 w-full">
                    <Link href="/wallet" className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{formattedBalance}</div>
                      <div className="text-[11px] text-white/60">Wallet Balance</div>
                    </Link>
                    <div className="flex flex-col gap-1.5 ml-2 flex-shrink-0 items-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setTransferDirection("MT5_TO_WALLET");
                          setTransferDialogOpen(true);
                        }}
                        className="px-2 py-1 text-xs bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white rounded-[6px] hover:opacity-90 transition-opacity whitespace-nowrap"
                      >
                        Transfer
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          router.push("/withdrawal");
                        }}
                        className="px-2 py-1 text-xs bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white rounded-[6px] hover:opacity-90 transition-opacity whitespace-nowrap"
                      >
                        Withdrawal
                      </button>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-white/50">
                    <span className="truncate">{walletNumber || '—'}</span>
                    {walletNumber && (
                      <button
                        type="button"
                        className="opacity-70 hover:opacity-100"
                        onClick={(e) => { e.preventDefault(); navigator.clipboard.writeText(walletNumber); }}
                        aria-label="Copy wallet number"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </DropdownMenuItem>

            {/* MT5 total */}
            <DropdownMenuItem asChild className="p-0">
              <div className="block w-full">
                <div className="w-full px-2 py-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-[8px]">
                  <div className="flex items-start justify-between w-full">
                    <Link href="/" className="flex-1 min-w-0">
                      <div className="text-sm font-semibold">{formattedMt5Total}</div>
                      <div className="text-[11px] text-white/60">MT5 accounts</div>
                    </Link>
                    <div className="flex flex-col gap-1.5 ml-2 flex-shrink-0 items-end">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setTransferDirection("WALLET_TO_MT5");
                          setTransferDialogOpen(true);
                        }}
                        className="px-2 py-1 text-xs bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white rounded-[6px] hover:opacity-90 transition-opacity whitespace-nowrap"
                      >
                        Transfer
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          router.push("/deposit");
                        }}
                        className="px-2 py-1 text-xs bg-gradient-to-r from-[#6242a5] to-[#9f8bcf] text-white rounded-[6px] hover:opacity-90 transition-opacity whitespace-nowrap"
                      >
                        Deposit
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-4 bg-black/25 dark:bg-white/25 hidden md:flex" />

        {/* Icons */}
        <div className="flex items-center gap-2.5 ">
          <Image
            className="h-5 w-5 cursor-pointer"
            src={theme === "dark" ? Sun : MoonDark}
            alt="Toggle Theme"
            onClick={toggleTheme}
          />
          <NotificationPanel />
        </div>

        <div className="w-px h-4 bg-black/25 dark:bg-white/25 hidden md:flex" />

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center cursor-pointer gap-2 text-xs text-black dark:text-white">
              <div className="h-8 w-8 rounded-full border-2 border-purple-400/60 dark:border-purple-400/60 p-0.5">
                <Image
                  className="h-full w-full rounded-full"
                  src="/userprofileicon.png"
                  alt="Profile"
                  width={32}
                  height={32}
                  quality={100}
                  unoptimized
                />
              </div>
              <div className="flex flex-col items-start hidden md:flex">
                <span className="text-sm font-semibold text-black dark:text-white">
                  {userDetails?.name || firstName}
                </span>
                <span className="text-xs text-black/60 dark:text-white/50">
                  {userDetails?.email ? `@${userDetails.email.split('@')[0]}` : ''}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-black/60 dark:text-white/50 ml-1 hidden md:block" />
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="bottom"
            align="end"
            className="px-[25px] pt-2.5 pb-[15px] dark:bg-[#01040D] border border-t-0 border-[#9F8BCF]/25 rounded-b-[10px] rounded-t-none mt-[22px] space-y-2.5">
            <div className="flex flex-col gap-1 ">
              <DropdownMenuItem asChild>
                <Link
                  href="/wallet"
                  className="flex items-center gap-2 text-black dark:text-white/50 dark:hover:text-white transition w-full">
                  <Image 
                    className="h-5 w-5" 
                    src={walletIcon || wallet} 
                    alt="Wallet" 
                  />
                  <span>Wallet</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 text-black dark:text-white/50 dark:hover:text-white transition w-full">
                  <Settings
                    size={20}
                    className="text-black dark:text-white/75 "
                  />
                  <span>Profile Settings</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link
                  href="/support"
                  className="flex items-center gap-2 text-black dark:text-white/50 dark:hover:text-white cursor-pointer">
                  <Headset
                    className="text-black dark:text-white/75"
                    size={20}
                  />
                  <span>Help Desk</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem
                className="flex items-center gap-2 text-black dark:text-white/50 dark:hover:text-white cursor-pointer"
                onClick={() => setSuggestFeatureDialogOpen(true)}>
                <Lightbulb
                  className="text-black dark:text-white/75"
                  size={20}
                />
                <span>Suggest a feature</span>
              </DropdownMenuItem>
            </div>

            <div className="w-full h-px dark:bg-white/10 bg-black/10" />

            {/* Logout Menu Item */}
            <DropdownMenuItem
              className="flex items-center gap-2 text-black dark:text-white/75 dark:hover:text-white cursor-pointer"
              onClick={() => setLogoutDialogOpen(true)}>
              {/* <Image className="h-5 w-5" src={logoutIcon} alt="Logout" /> */}
              <LogOut className="text-black dark:text-white/75" size={20} />
              <span className="text-md cursor-pointer">Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Logout Confirmation Dialog */}
        <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
          <DialogContent className="sm:max-w-[425px] px-6 py-6">
            <DialogHeader>
              <DialogTitle>Confirm Logout</DialogTitle>
              <DialogDescription>
                Are you sure you want to logout? You will need to login again to
                continue.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex justify-between gap-2">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => setLogoutDialogOpen(false)}
                disabled={isLoggingOut}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="cursor-pointer flex items-center justify-center gap-2"
                onClick={handleLogoutWithDelay}
                disabled={isLoggingOut}>
                {isLoggingOut && (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                )}
                {isLoggingOut ? "Logging out..." : "Logout"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Transfer Dialog */}
        <WalletMoveDialog
          open={transferDialogOpen}
          onOpenChange={(v) => {
            setTransferDialogOpen(v);
            if (!v) {
              refreshWalletBalance();
              dispatch(fetchAllAccountsWithBalance() as any).catch(() => { });
            }
          }}
          direction={transferDirection}
        />

        <SuggestFeatureDialog
          open={suggestFeatureDialogOpen}
          onOpenChange={setSuggestFeatureDialogOpen}
        />
      </div>
    </header>
  );
}
