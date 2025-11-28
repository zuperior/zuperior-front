import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { fetchUserAccountsFromDb, resetForNewClient, updateAccountBalance, fetchAllAccountsWithBalance } from "@/store/slices/mt5AccountSlice";
import { authService, mt5Service } from "@/services/api.service";

export function useFetchUserData() {
  const dispatch = useDispatch<AppDispatch>();
  const { accounts, totalBalance, isLoading, error, ownerClientId } = useSelector(
    (state: RootState) => state.mt5
  );
  const hasData = accounts.length > 0;

  // Use refs to access latest values in useCallback without adding them to dependencies
  const accountsRef = useRef(accounts);
  const ownerClientIdRef = useRef(ownerClientId);

  // Update refs on render
  useEffect(() => {
    accountsRef.current = accounts;
    ownerClientIdRef.current = ownerClientId;
  }, [accounts, ownerClientId]);

  const isAuthenticated = authService.isAuthenticated();
  const isAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  // Guard to prevent double fetch on first mount (React 18 StrictMode in dev)
  const hasFetchedRef = useRef(false);
  // Guard to prevent overlapping polling requests
  const isPollingRef = useRef(false);

  const fetchAllData = useCallback(async (forceRefresh = false) => {
    const isAuth = isAuthenticatedRef.current;
    if (!isAuth) {
      console.log("User not authenticated, skipping MT5 data fetch");
      return;
    }

    // If persisted state belongs to another user, clear it first
    const currentClientId = authService.getAuthData().clientId || null;
    if (currentClientId !== ownerClientIdRef.current) {
      console.log("🔄 Detected client change. Resetting MT5 state cache.");
      dispatch(resetForNewClient(currentClientId));
    }

    // Allow force refresh after account creation
    if (hasFetchedRef.current && !forceRefresh) {
      // Prevent overlapping polling requests
      if (isPollingRef.current) {
        // console.log('⏳ Skipping balance refresh - previous request still in progress');
        return Promise.resolve();
      }

      // For 10-second polling, only fetch balances, not full account data
      // console.log('🔄 Quick balance refresh...');
      isPollingRef.current = true;
      try {
        await dispatch(fetchAllAccountsWithBalance() as any);
      } catch (e: any) {
        console.warn('⚠️ Quick balance refresh failed:', e?.message);
      } finally {
        isPollingRef.current = false;
      }
      return;
    }

    try {
      console.log("🔄 Fetching MT5 user accounts from DB...");
      await dispatch(fetchUserAccountsFromDb() as any)
        .unwrap()
        .catch((e: any) => {
          // Thunk was skipped – ignore condition errors
          if (e?.name === "ConditionError" || (e && e.message?.includes("condition"))) {
            console.log("⏭️ fetchUserAccountsFromDb skipped by condition");
            return;
          }
          throw e; // real error
        });

      console.log("✅ MT5 accounts fetched successfully from DB");

      // Refresh balances from MT5 getClientProfile every 10 seconds
      try {
        const currentAccounts = accountsRef.current || [];
        const ids = currentAccounts.map(a => a.accountId).filter(Boolean);
        const ensureIdsRaw = ids.length ? ids : (
          (await mt5Service.getUserMt5AccountsFromDb())?.data?.accounts?.map((a: any) => a.accountId) ?? []
        );
        // Filter invalid/duplicate ids and avoid '0'
        const ensureIds = Array.from(new Set(
          ensureIdsRaw
            .map((id: any) => String(id).trim())
            .filter((id: string) => id && id !== '0' && /^\d+$/.test(id))
        ));
        // Fetch fresh balances using optimized endpoint with cache busting
        console.log('🔄 Fetching FRESH balances for all accounts with cache bust...');

        if (!isPollingRef.current) {
          isPollingRef.current = true;
          await dispatch(fetchAllAccountsWithBalance() as any).catch((e: any) => {
            console.warn('⚠️ Failed to refresh balances:', e?.message || 'Unknown error');
          });
          isPollingRef.current = false;
        }
      } catch (balErr) {
        console.warn("⚠️ Failed to refresh balances:", balErr);
        isPollingRef.current = false;
      }
      hasFetchedRef.current = true;
    } catch (err: any) {
      // Don't throw error for authentication issues
      if (err === "Not authorized to access this route") return;
      console.error("❌ fetchAllData error:", err);
      throw err;
    }
  }, [dispatch]); // Removed isAuthenticated from deps to ensure stability

  return {
    fetchAllData,
    balance: totalBalance,
    isLoading,
    hasData,
    error,
    accounts,
    isAuthenticated,
  };
}
