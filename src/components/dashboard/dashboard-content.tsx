"use client";

import VerificationAlert from "../verification-alert";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { TextAnimate } from "@/components/ui/text-animate";
import { useAppSelector } from "@/store/hooks";

// Components
import { BalanceSection } from "./balance-section";
import { AccountsSection } from "./accounts-section";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { NewAccountDialog } from "./new-account";
import { useFetchUserData } from "@/hooks/useFetchUserData";



export function DashboardContent() {
  const [name, setName] = useState("User");
  const [newAccountDialogOpen, setNewAccountDialogOpen] = useState(false);

  // Get user data from localStorage (client-side only to avoid hydration mismatch)
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : null;
      setName(userData?.name || "User");
    } catch {
      setName("User");
    }
  }, []);

  // Get verification status from Redux state
  const verificationStatus = useAppSelector((state) => state.kyc.verificationStatus);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { fetchAllData, balance: totalBalance, isLoading, hasData, isAuthenticated } = useFetchUserData();

  // Initial data fetch
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData, isAuthenticated]);

  // Log current API URL for debugging
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5000/api";
  }, []);

  // Memoized wallet balance calculation
  const walletBalance = useMemo(
    () => (totalBalance > 0 ? `$${totalBalance.toFixed(2)}` : "$0.00"),
    [totalBalance]
  );

  // Handle new account dialog close with data refresh
  const handleNewAccountDialogClose = useCallback((open: boolean) => {
    setNewAccountDialogOpen(open);

    // When dialog closes (open = false), force refresh MT5 accounts to show newly created account
    if (!open) {
      fetchAllData(true); // Force refresh to show new account
    }
  }, [fetchAllData]);

  // Show skeleton when loading
  if (isLoading && !hasData) {
    return <DashboardSkeleton />;
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="space-y-[25px]">
        <TextAnimate className="text-2xl font-bold text-black/85 dark:text-white/85 tracking-tighter px-2 md:px-0">
          Welcome to Zuperior CRM
        </TextAnimate>
        <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg p-4 mx-2 md:mx-0">
          <p className="text-yellow-800 dark:text-yellow-200">
            Please log in to access your MT5 trading accounts and dashboard features.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-[25px] px-2.5 sm:px-0">
      <TextAnimate className="text-xl sm:text-2xl font-bold text-black/85 dark:text-white/85 tracking-tighter">
        {`Welcome, ${name || "User"}`}
      </TextAnimate>

      <VerificationAlert
        name={name || "User"}
        verificationStatus={verificationStatus}
      />
      <BalanceSection balance={walletBalance} />
      <AccountsSection onOpenNewAccount={() => setNewAccountDialogOpen(true)} />
      <NewAccountDialog
        open={newAccountDialogOpen}
        onOpenChange={handleNewAccountDialogClose}
      />
    </div>
  );
}
