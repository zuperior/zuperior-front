// client/src/store/slices/mt5AccountSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { mt5Service } from "@/services/api.service";

// --------------------
// Type Definitions
// --------------------
// Static account data from database
export interface MT5AccountDB {
  id?: string;
  accountId: string;
  nameOnAccount?: string | null;
  leverage?: number | null;
  package?: string | null;
  accountType: string;
  password?: string | null;
  createdAt?: string;
  archived?: boolean;
  // Cached balance fields
  balance?: number;
  equity?: number;
  profit?: number;
  credit?: number;
  margin?: number;
  marginFree?: number;
  marginLevel?: number;
  currency?: string;
  lastSyncedAt?: string;
}

// ClientProfile data from MT5 API
export interface ClientProfileData {
  Balance?: number;
  Equity?: number;
  Credit?: number;
  Margin?: number;
  MarginFree?: number;
  MarginLevel?: number;
  Profit?: number;
  Server?: string;
  Login?: number;
  Name?: string;
  Group?: string;
  Leverage?: number;
}

// Combined account data for display
export interface MT5Account extends MT5AccountDB {
  // ClientProfile fields (fetched once on render or updated via WebSocket)
  server?: string;
  mtLogin?: number;
  marginUsed?: number;
  freeMargin?: number;
  // Legacy fields for backward compatibility
  name?: string;
  group?: string;
  isEnabled?: boolean;
  platform?: string;
  status?: boolean;
  isProfileReady?: boolean;
  lastProfileUpdateAt?: number;
}

export interface MT5Group {
  Group: string;
  Server: number;
  Company: string;
  Currency: string;
  CurrencyDigits: number;
  MarginCall: number;
  MarginStopOut: number;
  DemoLeverage: number;
  MinLimit?: number;
  MaxLimit?: number;
  DedicatedName?: string;
  dedicated_name?: string;
}

export interface MT5State {
  accounts: MT5Account[];
  groups: MT5Group[];
  selectedAccount: MT5Account | null;
  totalBalance: number;
  isLoading: boolean;
  error: string | null;

  // ✅ ADD: per-thunk loading & throttling (does not replace existing fields)
  isFetchingAccounts?: boolean;
  isFetchingGroups?: boolean;
  lastAccountsFetchAt?: number | null;
  lastGroupsFetchAt?: number | null;
  ownerClientId?: string | null;
}

// Small helper to throttle rapid duplicate dispatches
const within = (ts: number | null | undefined, ms: number) =>
  typeof ts === "number" && Date.now() - ts < ms;

// Normalize API responses
const normalizeOk = (data: any) => {
  // Normalize responses from different backends
  if (data && typeof data === 'object') {
    if ('Data' in data && !('data' in data)) return { success: true, data: data.Data };
    if ('Success' in data) return { success: !!data.Success, data: data.Data ?? null, message: data.Message };
    if ('success' in data) return { success: !!data.success, data: data.data ?? null, message: data.message };
  }
  return { success: true, data };
};

// Determine if an account payload is complete enough for the UI
const isProfileComplete = (a: Partial<MT5Account>): boolean => {
  return Boolean(
    a &&
    a.name &&
    a.group &&
    a.leverage !== undefined &&
    a.balance !== undefined &&
    a.equity !== undefined
  );
};

// --------------------
// Async Thunks
// --------------------

// ✅ Get Groups
export const fetchMt5Groups = createAsyncThunk(
  "mt5/fetchGroups",
  async (_, { rejectWithValue }) => {
    try {
      const response = await mt5Service.getMt5Groups();
      // Handle .NET Core API response format
      if (response.data?.Success === false) {
        return rejectWithValue(response.data?.Message || "Failed to fetch MT5 groups");
      }
      return response.data?.Data || response.data || [];
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.Message || error.response?.data?.message || "Failed to fetch MT5 groups"
      );
    }
  },
  {
    // ✅ ADD: skip if already fetching or if fetched very recently (1.5s)
    condition: (_, { getState }) => {
      const state = getState() as { mt5: MT5State };
      const s = state.mt5;
      if (s.isFetchingGroups) return false;
      if (within(s.lastGroupsFetchAt, 1500)) return false;
      return true;
    },
  }
);

// ✅ Get User Accounts from Database (Static fields only)
export const fetchUserAccountsFromDb = createAsyncThunk(
  "mt5/fetchUserAccountsFromDb",
  async (opts: { includeArchived?: boolean } | undefined, { rejectWithValue }) => {
    try {
      const response = await mt5Service.getUserAccountsFromDb({ includeArchived: opts?.includeArchived ?? true });
      const normalized = normalizeOk(response);

      if (!normalized.success || !normalized.data?.accounts) {
        console.log("⚠️ No accounts found in database");
        return [];
      }

      const accounts = normalized.data.accounts as MT5AccountDB[];
      console.log(`✅ Fetched ${accounts.length} accounts from database`);

      return accounts.map(acc => ({
        ...acc,
        accountType: acc.accountType || 'Live'
      }));
    } catch (error: any) {
      console.error("❌ Error in fetchUserAccountsFromDb:", error);
      if (error.response?.status === 401) {
        return [];
      }
      return rejectWithValue(
        error.response?.data?.Message || error.response?.data?.message || error.message || "Failed to fetch accounts from database"
      );
    }
  }
);

// ✅ Fetch Account Profile (ClientProfile fields - once on render)
export const fetchAccountProfile = createAsyncThunk(
  "mt5/fetchAccountProfile",
  async ({ accountId, password }: { accountId: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await mt5Service.getAccountBalanceAndProfit(accountId, password);

      if (!response.success || !response.data) {
        return rejectWithValue("Failed to fetch account profile");
      }

      const profile = response.data as ClientProfileData;
      return {
        accountId,
        profile: {
          balance: profile.Balance || 0,
          equity: profile.Equity || 0,
          credit: profile.Credit || 0,
          margin: profile.Margin || 0,
          marginFree: profile.MarginFree || 0,
          marginLevel: profile.MarginLevel || 0,
          server: profile.Server || '',
          mtLogin: profile.Login || parseInt(accountId, 10)
        }
      };
    } catch (error: any) {
      console.error(`❌ Error fetching profile for ${accountId}:`, error);
      return rejectWithValue(
        error.response?.data?.Message || error.response?.data?.message || error.message || "Failed to fetch account profile"
      );
    }
  }
);

// ✅ Fetch Balance and Profit only (for 200ms polling)
export const fetchAccountBalanceAndProfit = createAsyncThunk(
  "mt5/fetchAccountBalanceAndProfit",
  async ({ accountId, password }: { accountId: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await mt5Service.getAccountBalanceAndProfit(accountId, password);

      if (!response.success) {
        return { accountId, balance: 0, profit: 0 };
      }

      return {
        accountId,
        balance: response.data.Balance || 0,
        profit: response.data.Profit || 0
      };
    } catch (error: any) {
      console.error(`❌ Error fetching balance/profit for ${accountId}:`, error);
      // Return zero values on error instead of rejecting
      return { accountId, balance: 0, profit: 0 };
    }
  }
);

// Legacy method - kept for backward compatibility (deprecated, use fetchUserAccountsFromDb)
export const fetchUserMt5Accounts = createAsyncThunk(
  "mt5/fetchUserAccounts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await mt5Service.getUserAccountsFromDb();
      const normalized = normalizeOk(response);

      if (!normalized.success || !normalized.data?.accounts) {
        return [];
      }

      const accounts = normalized.data.accounts as MT5AccountDB[];
      return accounts.map(acc => ({
        ...acc,
        accountType: acc.accountType || 'Live'
      }));
    } catch (error: any) {
      if (error.response?.status === 401) {
        return [];
      }
      return rejectWithValue(
        error.response?.data?.Message || error.response?.data?.message || error.message || "Failed to fetch accounts"
      );
    }
  }
);

// ✅ Create MT5 Account
export const createMt5Account = createAsyncThunk(
  "mt5/createAccount",
  async (
    data: {
      name: string;
      group: string;
      leverage?: number;
      masterPassword: string;
      investorPassword: string;
      email?: string;
      country?: string;
      city?: string;
      phone?: string;
      comment?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      console.log("🔄 Redux slice - Calling MT5 service with data:", data);
      const response = await mt5Service.createMt5Account(data);
      console.log("✅ Redux slice - MT5 service response:", response);
      console.log("📊 Redux slice - Response data:", response.data);
      console.log("📊 Redux slice - Response data type:", typeof response.data);

      // Handle different response formats
      if (!response.data) {
        console.error("❌ No response data received");
        return rejectWithValue("No response data received from MT5 API");
      }

      // Handle .NET Core API response format
      if (response.data?.Success === false) {
        console.error("❌ API returned error:", response.data.Message);
        return rejectWithValue(response.data?.Message || "Failed to create MT5 account");
      }

      // Try different response structures
      let accountData = null;
      let mt5Login: number | string | null = null;

      // Handle new backend response format: { success: true, data: { mt5Login, accountId } }
      if (response.data?.data?.mt5Login) {
        mt5Login = response.data.data.mt5Login;
        console.log("📊 Using new backend response format with mt5Login:", mt5Login);

        // Create minimal account data from what we have
        accountData = {
          Login: typeof mt5Login === 'number' ? mt5Login : parseInt(String(mt5Login), 10),
          Name: data.name,
          Group: data.group,
          Leverage: data.leverage || 100,
          Balance: 0,
          Equity: 0,
        };
      }
      // Handle .NET Core API response format
      else if (response.data?.Data) {
        accountData = response.data.Data;
        mt5Login = accountData.Login || accountData.login;
        console.log("📊 Using response.data.Data:", accountData);
      }
      // Handle direct Login in response
      else if (response.data?.Login) {
        accountData = response.data;
        mt5Login = accountData.Login;
        console.log("📊 Using response.data directly:", accountData);
      }
      // Handle array response
      else if (Array.isArray(response.data) && response.data.length > 0) {
        accountData = response.data[0];
        mt5Login = accountData.Login || accountData.login;
        console.log("📊 Using first array element:", accountData);
      }
      else {
        console.error("❌ Unexpected response structure:", response.data);
        return rejectWithValue("Unexpected response structure from MT5 API");
      }

      // Extract login from accountData if not already set
      if (!mt5Login && accountData) {
        mt5Login = accountData.Login || accountData.login || accountData.Login || accountData.accountId;
      }

      if (!mt5Login || mt5Login === 0) {
        console.error("❌ Account creation failed - Login is 0 or undefined:", { mt5Login, accountData });
        return rejectWithValue("MT5 account creation failed - account was not actually created");
      }

      console.log("📊 Redux slice - Account data with Login:", mt5Login);

      // Transform to match expected MT5Account format
      const transformedAccount: MT5Account = {
        accountId: String(mt5Login),
        accountType: 'Live', // Default to Live for newly created accounts
        name: accountData?.Name || accountData?.name || data.name,
        group: accountData?.Group || accountData?.group || data.group,
        leverage: accountData?.Leverage || accountData?.leverage || data.leverage || 100,
        balance: accountData?.Balance || accountData?.balance || 0,
        equity: accountData?.Equity || accountData?.equity || 0,
        credit: accountData?.Credit || accountData?.credit || 0,
        margin: accountData?.Margin || accountData?.margin || 0,
        marginFree: accountData?.MarginFree || accountData?.marginFree || 0,
        marginLevel: accountData?.MarginLevel || accountData?.marginLevel || 0,
        profit: accountData?.Profit || accountData?.profit || 0,
        isEnabled: accountData?.IsEnabled !== undefined ? accountData.IsEnabled : true,
        createdAt: accountData?.Registration || accountData?.createdAt || new Date().toISOString(),
        isProfileReady: isProfileComplete({
          name: accountData?.Name || accountData?.name || data.name,
          group: accountData?.Group || accountData?.group || data.group,
          leverage: accountData?.Leverage || accountData?.leverage || data.leverage || 100,
          balance: accountData?.Balance || accountData?.balance || 0,
          equity: accountData?.Equity || accountData?.equity || 0,
        }),
        lastProfileUpdateAt: Date.now(),
      };

      console.log("🔄 Redux slice - Transformed account:", transformedAccount);
      return transformedAccount;
    } catch (error: any) {
      console.error("❌ Redux slice - Error:", error);
      if (error.response?.status === 401)
        return rejectWithValue("Authentication required. Please log in first.");
      return rejectWithValue(
        error.response?.data?.Message || error.response?.data?.message || error.message || "Failed to create MT5 account"
      );
    }
  }
);

// ✅ Deposit Funds
export const depositToMt5Account = createAsyncThunk(
  "mt5/deposit",
  async (
    data: { login: number; balance: number; comment?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await mt5Service.depositToMt5(data);
      // Handle .NET Core API response format
      if (response.data?.Success === false) {
        return rejectWithValue(response.data?.Message || "Failed to deposit funds");
      }
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401)
        return rejectWithValue("Authentication required. Please log in first.");
      return rejectWithValue(
        error.response?.data?.Message || error.response?.data?.message || "Failed to deposit funds"
      );
    }
  }
);

// ✅ Withdraw Funds
export const withdrawFromMt5Account = createAsyncThunk(
  "mt5/withdraw",
  async (
    data: { login: number; balance: number; comment?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await mt5Service.withdrawFromMt5(data);
      // Handle .NET Core API response format
      if (response.data?.Success === false) {
        return rejectWithValue(response.data?.Message || "Failed to withdraw funds");
      }
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401)
        return rejectWithValue("Authentication required. Please log in first.");
      return rejectWithValue(
        error.response?.data?.Message || error.response?.data?.message || "Failed to withdraw funds"
      );
    }
  }
);

// ✅ Get Client Profile
export const refreshMt5AccountProfile = createAsyncThunk(
  "mt5/refreshProfile",
  async (login: number, { rejectWithValue }) => {
    try {
      console.log(`[MT5] 🔄 refreshMt5AccountProfile → requesting profile for login=${login}`);
      const response = await mt5Service.getMt5UserProfile(login);
      // Handle .NET Core API response format
      if (response.data?.Success === false) {
        console.warn(`[MT5] ⚠️ refreshMt5AccountProfile failed (Success=false) for login=${login}:`, response.data?.Message);
        return rejectWithValue(response.data?.Message || "Failed to refresh MT5 profile");
      }

      const profileData = response.data?.Data ?? response.data;
      console.log(`[MT5] ✅ refreshMt5AccountProfile response for login=${login}:`, profileData);

      // Guard: API sometimes returns 200 with empty/undefined body. Do not access properties.
      if (!profileData || profileData.Login === undefined || profileData.Login === 0) {
        console.warn(`[MT5] ⚠️ Empty or invalid profile payload for login=${login}. Will retry.`);
        return rejectWithValue("Empty MT5 profile payload");
      }
      // Transform .NET Core user format to match expected MT5Account format
      return {
        accountId: String(profileData.Login),
        name: profileData.Name,
        group: profileData.Group,
        leverage: profileData.Leverage,
        balance: profileData.Balance,
        equity: profileData.Equity,
        credit: profileData.Credit,
        margin: profileData.Margin,
        marginFree: profileData.MarginFree,
        marginLevel: profileData.MarginLevel,
        profit: profileData.Profit,
        isEnabled: profileData.IsEnabled,
        createdAt: profileData.Registration,
        updatedAt: profileData.LastAccess
      };
    } catch (error: any) {
      // Handle timeout errors gracefully - account may just need more time to propagate
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn(`[MT5] ⏱️ Timeout refreshing profile for login=${login} - account may still be propagating. Profile will be refreshed automatically.`);
        // Return partial data so the account creation doesn't fail completely
        return {
          accountId: String(login),
          // Return minimal data - the account exists even if profile isn't ready yet
        };
      }

      console.error(`[MT5] ❌ refreshMt5AccountProfile error for login=${login}:`, error?.response?.data || error?.message || error);
      if (error.response?.status === 401)
        return rejectWithValue("Authentication required. Please log in first.");
      return rejectWithValue(
        error.response?.data?.Message || error.response?.data?.message || "Failed to refresh MT5 profile"
      );
    }
  }
);

// ✅ OPTIMIZED: Fetch all account details in parallel (fast & accurate - like admin panel)
export const fetchAllAccountsWithBalance = createAsyncThunk(
  "mt5/fetchAllAccountsWithBalance",
  async (_, { rejectWithValue }) => {
    try {
      console.log(`[MT5] 🚀 fetchAllAccountsWithBalance → fetching all accounts with balances in parallel`);

      // Call optimized backend endpoint that fetches all balances in parallel with cache busting
      const response = await mt5Service.getUserAccountsWithBalance({ signal: undefined });

      if (!response.success || !response.data) {
        console.error(`[MT5] ❌ Invalid response structure:`, response);
        return rejectWithValue("Failed to fetch account balances - invalid response");
      }

      const { accounts, totalBalance } = response.data;
      console.log(`[MT5] ✅ fetchAllAccountsWithBalance → fetched ${accounts.length} accounts. Total balance: ${totalBalance}`);

      // Transform accounts to match our state structure
      const accountsData = accounts.map((acc: any) => ({
        accountId: String(acc.accountId),
        balance: Number(acc.balance ?? 0),
        equity: Number(acc.equity ?? 0),
        profit: Number(acc.profit ?? 0),
        credit: Number(acc.credit ?? 0),
        margin: Number(acc.margin ?? 0),
        marginFree: Number(acc.marginFree ?? 0),
        marginLevel: Number(acc.marginLevel ?? 0),
        leverage: Number(acc.leverage ?? 0),
      }));

      return {
        accounts: accountsData,
        totalBalance: Number(totalBalance ?? 0),
      };
    } catch (error: any) {
      // Ignore canceled requests (expected when component unmounts)
      if (error?.message === 'canceled' || error?.name === 'AbortError') {
        return rejectWithValue('Request canceled');
      }

      // Enhanced error logging to capture all error details
      console.error(`[MT5] ❌ fetchAllAccountsWithBalance error:`, {
        error,
        message: error?.message,
        name: error?.name,
        code: error?.code,
        response: error?.response,
        responseData: error?.response?.data,
        responseStatus: error?.response?.status,
        responseStatusText: error?.response?.statusText,
        stack: error?.stack,
        config: error?.config,
        request: error?.request
      });

      // Try to extract meaningful error message
      let errorMessage = "Failed to fetch account balances";
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.Message) {
        errorMessage = error.response.data.Message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
        errorMessage = "Backend server is not reachable. Please check if the server is running.";
      } else if (error?.response?.status === 404) {
        errorMessage = "Endpoint not found. The backend route may not be registered.";
      } else if (error?.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      }

      return rejectWithValue(errorMessage);
    }
  }
);

// ✅ Fetch Account Details from getClientProfile (includes Balance, Equity, P/L, etc.) - LEGACY (kept for single account fetch)
export const fetchAccountDetailsFromMT5 = createAsyncThunk(
  "mt5/fetchAccountDetails",
  async ({ accountId, forceRefresh = false }: { accountId: string; forceRefresh?: boolean }, { rejectWithValue }) => {
    try {
      console.log(`[MT5] 🔄 fetchAccountDetailsFromMT5 → requesting details for account=${accountId}${forceRefresh ? ' (force refresh)' : ''}`);

      // Call backend endpoint which fetches from MT5 API with access token
      // Use forceRefresh to bypass cache and get fresh data
      const response = await mt5Service.getMt5AccountProfile(accountId, { forceRefresh });

      console.log(`[MT5] 📥 Raw response for account=${accountId}:`, JSON.stringify(response, null, 2));

      if (!response.success || !response.data) {
        console.error(`[MT5] ❌ Invalid response structure for account=${accountId}:`, response);
        return rejectWithValue("Failed to fetch account details from MT5 - invalid response");
      }

      const profileData = response.data;
      console.log(`[MT5] ✅ fetchAccountDetailsFromMT5 profileData for account=${accountId}:`, JSON.stringify(profileData, null, 2));

      // Extract and return account details
      // The API returns: { Success: true, Data: { Balance: 22556, Equity: 22556, ... } }
      // After normalization, response.data should be the Data object directly
      const balance = Number(profileData.Balance ?? profileData.balance ?? 0);
      const equity = Number(profileData.Equity ?? profileData.equity ?? 0);
      const profit = (profileData.Floating !== undefined && profileData.Floating !== null)
        ? Number(profileData.Floating)
        : (profileData.Profit !== undefined ? Number(profileData.Profit ?? profileData.profit ?? 0) : (equity - balance));

      console.log(`[MT5] 📊 Extracted values for account=${accountId}:`, {
        balance,
        equity,
        profit,
        credit: profileData.Credit ?? profileData.credit ?? 0,
        margin: profileData.Margin ?? profileData.margin ?? 0
      });

      return {
        accountId: String(accountId),
        balance: balance,
        equity: equity,
        profit: profit,
        credit: profileData.Credit ?? profileData.credit ?? 0,
        margin: profileData.Margin ?? profileData.margin ?? 0,
        marginFree: profileData.MarginFree ?? profileData.Margin_Free ?? profileData.marginFree ?? 0,
        marginLevel: profileData.MarginLevel ?? profileData.Margin_Level ?? profileData.marginLevel ?? 0,
        leverage: profileData.Leverage ?? profileData.leverage ?? 0,
        // Additional fields that might be useful
        server: profileData.Server ?? profileData.server ?? '',
        login: profileData.Login ?? profileData.login ?? parseInt(accountId, 10)
      };
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.response?.data?.Message || error?.message || 'Unknown error';
      const errorStatus = error?.response?.status || 'No status';
      console.error(`[MT5] ❌ fetchAccountDetailsFromMT5 error for account=${accountId}:`, {
        message: errorMsg,
        status: errorStatus,
        fullError: error
      });
      return rejectWithValue(`Failed to fetch MT5 user profile: ${errorMsg}`);
    }
  }
);

// --------------------
// Initial State
// --------------------
const initialState: MT5State = {
  accounts: [], // Accounts array - NEVER persisted, always fetched fresh from API
  groups: [],
  selectedAccount: null,
  totalBalance: 0, // Total balance - NEVER persisted, always calculated fresh
  isLoading: false,
  error: null,

  // ✅ ADD: per-thunk flags & timestamps
  isFetchingAccounts: false,
  isFetchingGroups: false,
  lastAccountsFetchAt: null,
  lastGroupsFetchAt: null,
  ownerClientId: null,
};

// --------------------
// Slice Definition
// --------------------
const mt5AccountSlice = createSlice({
  name: "mt5",
  initialState,
  reducers: {
    resetForNewClient: (state, action: PayloadAction<string | null>) => {
      state.accounts = [];
      state.groups = [];
      state.selectedAccount = null;
      state.totalBalance = 0;
      state.isLoading = false;
      state.error = null;
      state.isFetchingAccounts = false;
      state.isFetchingGroups = false;
      state.lastAccountsFetchAt = null;
      state.lastGroupsFetchAt = null;
      state.ownerClientId = action.payload ?? null;
    },
    setSelectedAccount: (state, action: PayloadAction<MT5Account | null>) => {
      state.selectedAccount = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateAccountBalance: (
      state,
      action: PayloadAction<{ login: number; balance: number; equity: number }>
    ) => {
      const account = state.accounts.find(
        (acc) => acc.accountId === String(action.payload.login)
      );
      if (account) {
        account.balance = action.payload.balance;
        account.equity = action.payload.equity;
        // Calculate total balance from Live accounts only (sum of equities, not balances)
        state.totalBalance = state.accounts
          .filter((acc) => (acc.accountType || 'Live') === 'Live')
          .reduce(
            (sum, acc) => sum + (acc.equity || 0),
            0
          );
      }
    },
    updateAccountName: (
      state,
      action: PayloadAction<{ accountId: string; name: string }>
    ) => {
      const account = state.accounts.find(
        (acc) => acc.accountId === action.payload.accountId
      );
      if (account) {
        account.nameOnAccount = action.payload.name;
        console.log(`[MT5] ✅ Updated account ${action.payload.accountId} name to "${action.payload.name}" in Redux state`);
      }
    },
    updateAccountLeverage: (
      state,
      action: PayloadAction<{ accountId: string; leverage: number }>
    ) => {
      const account = state.accounts.find(
        (acc) => acc.accountId === action.payload.accountId
      );
      if (account) {
        account.leverage = action.payload.leverage;
        console.log(`[MT5] ✅ Updated account ${action.payload.accountId} leverage to ${action.payload.leverage} in Redux state`);
      }
    },
    addAccountOptimistically: (state, action: PayloadAction<MT5Account>) => {
      // Add new account immediately without waiting for fetch
      const exists = state.accounts.some(acc => acc.accountId === action.payload.accountId);
      if (!exists) {
        state.accounts.push(action.payload);
        // Only add to total balance if it's a Live account
        if ((action.payload.accountType || 'Live') === 'Live') {
          state.totalBalance += (action.payload.equity || 0);
          console.log('🚀 Live account added optimistically:', action.payload.accountId);
        } else {
          console.log('🚀 Demo/Non-Live account added (not included in balance):', action.payload.accountId);
        }
      }
      // Reset throttling to allow immediate refresh
      state.lastAccountsFetchAt = null;
    },
    updateAccountFromWebSocket: (state, action: PayloadAction<{
      accountId: string;
      balance: number;
      equity: number;
      marginUsed: number;
      freeMargin: number;
      marginLevel: number;
      currency: string;
    }>) => {
      const { accountId, ...update } = action.payload;
      const account = state.accounts.find(acc => acc.accountId === String(accountId));
      if (account) {
        account.balance = update.balance;
        account.equity = update.equity;
        account.marginUsed = update.marginUsed;
        account.freeMargin = update.freeMargin;
        account.marginLevel = update.marginLevel;
        account.currency = update.currency;

        // Update total balance if this is a live account
        if (account.accountType === 'Live') {
          state.totalBalance = state.accounts
            .filter(acc => acc.accountType === 'Live')
            .reduce((sum, acc) => sum + (acc.equity || 0), 0);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Groups
      .addCase(fetchMt5Groups.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.isFetchingGroups = true;                 // ✅ ADD
      })
      .addCase(fetchMt5Groups.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isFetchingGroups = false;                // ✅ ADD
        state.lastGroupsFetchAt = Date.now();          // ✅ ADD

        console.log("Debugger - API Groups Payload:", action.payload); // <--- LOG ADDED

        // Remove hardcoded filter to allow all valid groups from backend
        state.groups = action.payload;
      })
      .addCase(fetchMt5Groups.rejected, (state, action) => {
        state.isLoading = false;
        state.isFetchingGroups = false;                // ✅ ADD
        state.lastGroupsFetchAt = Date.now();          // ✅ ADD
        state.error = action.payload as string;
      })

      // Fetch User Accounts from DB (new simplified method)
      .addCase(fetchUserAccountsFromDb.pending, (state) => {
        state.isFetchingAccounts = true;
        state.error = null;
      })
      .addCase(fetchUserAccountsFromDb.fulfilled, (state, action) => {
        state.isFetchingAccounts = false;
        state.lastAccountsFetchAt = Date.now();
        // Merge with existing accounts, updating only DB fields
        // IMPORTANT: Preserve dynamic balance fields (balance, equity, etc.) if they exist
        const dbAccounts = action.payload as MT5AccountDB[];
        dbAccounts.forEach((dbAcc) => {
          const existing = state.accounts.find(acc => acc.accountId === dbAcc.accountId);
          if (existing) {
            // Update only DB fields
            existing.accountType = dbAcc.accountType;
            existing.nameOnAccount = dbAcc.nameOnAccount;
            existing.leverage = dbAcc.leverage;
            existing.package = dbAcc.package;
            existing.password = dbAcc.password;
            existing.archived = dbAcc.archived;

            // Use cached balance if state has no balance (e.g. page reload)
            if (existing.balance === undefined && dbAcc.balance !== undefined) {
              existing.balance = dbAcc.balance;
              existing.equity = dbAcc.equity;
              existing.profit = dbAcc.profit;
              existing.credit = dbAcc.credit;
              existing.margin = dbAcc.margin;
              existing.marginFree = dbAcc.marginFree;
              existing.marginLevel = dbAcc.marginLevel;
            }
          } else {
            // Add new account with cached balance data
            state.accounts.push({
              ...dbAcc,
              // Ensure defaults if DB has no cache
              balance: dbAcc.balance ?? undefined,
              equity: dbAcc.equity ?? undefined,
              profit: dbAcc.profit ?? undefined,
              credit: dbAcc.credit ?? undefined,
              margin: dbAcc.margin ?? undefined,
              marginFree: dbAcc.marginFree ?? undefined,
              marginLevel: dbAcc.marginLevel ?? undefined,
            } as MT5Account);
          }
        });
        // Remove accounts that are no longer in DB
        state.accounts = state.accounts.filter(acc =>
          dbAccounts.some(dbAcc => dbAcc.accountId === acc.accountId)
        );
        if (typeof window !== 'undefined') {
          state.ownerClientId = localStorage.getItem('clientId');
        }
      })
      .addCase(fetchUserAccountsFromDb.rejected, (state, action) => {
        state.isFetchingAccounts = false;
        state.lastAccountsFetchAt = Date.now();
        state.error = action.payload as string;
      })

      // Fetch Account Profile (ClientProfile fields - once)
      .addCase(fetchAccountProfile.fulfilled, (state, action) => {
        const { accountId, profile } = action.payload;
        const account = state.accounts.find(acc => acc.accountId === accountId);
        if (account) {
          // Update ClientProfile fields
          account.balance = profile.balance;
          account.equity = profile.equity;
          account.credit = profile.credit;
          account.margin = profile.margin;
          account.marginFree = profile.marginFree;
          account.marginLevel = profile.marginLevel;
          account.server = profile.server;
          account.mtLogin = profile.mtLogin;
          // Recalculate total balance
          state.totalBalance = state.accounts
            .filter((acc) => (acc.accountType || 'Live') === 'Live')
            .reduce((sum, acc) => sum + (acc.equity || 0), 0);
        }
      })

      // Fetch Balance and Profit (200ms polling)
      .addCase(fetchAccountBalanceAndProfit.fulfilled, (state, action) => {
        const { accountId, balance, profit } = action.payload;
        const account = state.accounts.find(acc => acc.accountId === accountId);
        if (account) {
          // Update only dynamic fields
          account.balance = balance;
          account.profit = profit;
          // Recalculate total balance
          state.totalBalance = state.accounts
            .filter((acc) => (acc.accountType || 'Live') === 'Live')
            .reduce((sum, acc) => sum + (acc.equity || 0), 0);
        }
      })

      // ✅ OPTIMIZED: Fetch all accounts with balances in parallel (fast & accurate)
      .addCase(fetchAllAccountsWithBalance.pending, (state) => {
        // Don't set isLoading to true - allow concurrent fetches for 300ms polling
        // Setting isLoading blocks UI updates
        state.error = null;
        console.log(`[MT5] 🔄 fetchAllAccountsWithBalance PENDING - fetching fresh balances`);
        // Don't clear balances on pending - keep showing last known values until new ones arrive
        // This prevents flickering and ensures smooth updates
      })
      .addCase(fetchAllAccountsWithBalance.fulfilled, (state, action) => {
        state.isLoading = false;
        const { accounts: accountsWithBalance, totalBalance } = action.payload;

        console.log(`[MT5] 🔄 Updating ${accountsWithBalance.length} accounts with FRESH balances from DATABASE...`);
        console.log(`[MT5] 📊 Balance data received from DB:`, accountsWithBalance.map((acc: any) => ({
          accountId: acc.accountId,
          balance: acc.balance,
          equity: acc.equity
        })));

        // Update balances for all accounts that match - FORCE UPDATE (no checks)
        // These values come from DATABASE, not MT5 API (database is source of truth)
        accountsWithBalance.forEach((details: any) => {
          const account = state.accounts.find(acc => acc.accountId === details.accountId);
          if (account) {
            const oldBalance = account.balance;
            // FORCE UPDATE all account details from DATABASE (always overwrite)
            account.balance = Number(details.balance ?? 0);
            account.equity = Number(details.equity ?? 0);
            account.profit = Number(details.profit ?? details.Floating ?? 0);
            account.credit = Number(details.credit ?? 0);
            account.margin = Number(details.margin ?? 0);
            account.marginFree = Number(details.marginFree ?? 0);
            account.marginLevel = Number(details.marginLevel ?? 0);
            if (details.leverage) account.leverage = Number(details.leverage ?? 0);

            console.log(`[MT5] 💰 Account ${details.accountId} UPDATED:`, {
              balance: `${oldBalance} → ${account.balance}`,
              equity: `${account.equity}`,
              profit: `${account.profit}`,
              rawData: { balance: details.balance, equity: details.equity, profit: details.profit }
            });
          } else {
            console.warn(`[MT5] ⚠️ Account ${details.accountId} not found in state - cannot update balance`);
          }
        });

        // Set total balance from database response (calculated from equity of Live accounts)
        // The backend endpoint /api/mt5/accounts-with-balance returns totalBalance calculated from DB equity values
        const oldTotalBalance = state.totalBalance;
        state.totalBalance = Number(totalBalance ?? 0);

        // Also recalculate from equity values as a safety check (should match backend calculation)
        const calculatedTotal = state.accounts
          .filter((acc) => (acc.accountType || 'Live') === 'Live')
          .reduce((sum, acc) => sum + (acc.equity || 0), 0);

        if (Math.abs(state.totalBalance - calculatedTotal) > 0.01) {
          console.warn(`[MT5] ⚠️ Total balance mismatch: API=${state.totalBalance}, Calculated=${calculatedTotal}. Using API value.`);
        } else {
          console.log(`[MT5] ✅ Total balance verified: $${state.totalBalance} (from DB equity values)`);
        }

        console.log(`[MT5] ✅ Updated balances for ${accountsWithBalance.length} accounts. Total: ${oldTotalBalance} → ${state.totalBalance}`);
      })
      .addCase(fetchAllAccountsWithBalance.rejected, (state, action) => {
        state.isLoading = false;
        console.warn('[MT5] Failed to fetch all accounts with balance:', action.payload);
      })

      // Fetch Account Details from MT5 (getClientProfile) - LEGACY (for single account)
      .addCase(fetchAccountDetailsFromMT5.fulfilled, (state, action) => {
        const details = action.payload;
        const account = state.accounts.find(acc => acc.accountId === details.accountId);
        if (account) {
          console.log(`[MT5] 🔄 Updating account ${details.accountId} with details:`, {
            balance: details.balance,
            equity: details.equity,
            profit: details.profit
          });

          // Update all account details from MT5 API
          account.balance = details.balance;
          account.equity = details.equity;
          account.profit = details.profit;
          account.credit = details.credit;
          account.margin = details.margin;
          account.marginFree = details.marginFree;
          account.marginLevel = details.marginLevel;
          if (details.leverage) account.leverage = details.leverage;
          if (details.server) account.server = details.server;

          console.log(`[MT5] ✅ Account ${details.accountId} updated. New balance: ${account.balance}, equity: ${account.equity}`);

          // Recalculate total balance from Live accounts only
          state.totalBalance = state.accounts
            .filter((acc) => (acc.accountType || 'Live') === 'Live')
            .reduce((sum, acc) => sum + (acc.equity || 0), 0);
        } else {
          console.warn(`[MT5] ⚠️ Account ${details.accountId} not found in state. Accounts:`, state.accounts.map(a => a.accountId));
        }
      })
      .addCase(fetchAccountDetailsFromMT5.rejected, (state, action) => {
        // Silently handle errors - don't update state, just log
        console.warn('[MT5] Failed to fetch account details:', action.payload);
      })

      // Fetch User MT5 Accounts (legacy - for backward compatibility)
      .addCase(fetchUserMt5Accounts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.isFetchingAccounts = true;
      })
      .addCase(fetchUserMt5Accounts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isFetchingAccounts = false;
        state.lastAccountsFetchAt = Date.now();
        // Merge with existing accounts
        const dbAccounts = action.payload as MT5AccountDB[];
        dbAccounts.forEach((dbAcc) => {
          const existing = state.accounts.find(acc => acc.accountId === dbAcc.accountId);
          if (existing) {
            existing.accountType = dbAcc.accountType;
            existing.nameOnAccount = dbAcc.nameOnAccount;
            existing.leverage = dbAcc.leverage;
            existing.package = dbAcc.package;
            existing.archived = dbAcc.archived;
          } else {
            state.accounts.push({ ...dbAcc } as MT5Account);
          }
        });
        // Remove accounts that are no longer in DB
        state.accounts = state.accounts.filter(acc =>
          dbAccounts.some(dbAcc => dbAcc.accountId === acc.accountId)
        );
        // Calculate total balance from Live accounts only
        state.totalBalance = state.accounts
          .filter((acc) => (acc.accountType || 'Live') === 'Live')
          .reduce((sum, acc) => sum + (acc.equity || 0), 0);
        if (typeof window !== 'undefined') {
          state.ownerClientId = localStorage.getItem('clientId');
        }
      })
      .addCase(fetchUserMt5Accounts.rejected, (state, action) => {
        state.isLoading = false;
        state.isFetchingAccounts = false;
        state.lastAccountsFetchAt = Date.now();
        state.error = action.payload as string;
      })

      // Create Account
      .addCase(createMt5Account.pending, (state) => {
        state.isLoading = true;
        state.isFetchingAccounts = true;
        state.error = null;
      })
      .addCase(createMt5Account.fulfilled, (state, action) => {
        state.isLoading = false;
        // Immediately add the new account to state (optimistic update)
        const newAccount = action.payload;
        console.log('🚀 Adding new account to state immediately:', newAccount);

        // Check if account already exists to avoid duplicates
        const exists = state.accounts.some(acc => acc.accountId === newAccount.accountId);
        if (!exists && newAccount.accountId) {
          state.accounts.push(newAccount);
          // Only add to total balance if it's a Live account
          if ((newAccount.accountType || 'Live') === 'Live') {
            state.totalBalance += (newAccount.balance || 0);
            console.log(`✅ New Live account added! Total accounts: ${state.accounts.length}`);
          } else {
            console.log(`✅ New Demo/Non-Live account added (not included in balance). Total accounts: ${state.accounts.length}`);
          }
        }

        // Reset throttling to allow immediate refresh
        state.lastAccountsFetchAt = null;
        state.isFetchingAccounts = false;
      })
      .addCase(createMt5Account.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Deposit Funds
      .addCase(depositToMt5Account.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(depositToMt5Account.fulfilled, (state, action) => {
        state.isLoading = false;
        // For .NET Core API, deposit success means we should refresh account data
        if (action.payload?.Success) {
          console.log("Deposit successful - account data should be refreshed");
          // The account will be refreshed when the user data is refetched
        }
      })
      .addCase(depositToMt5Account.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Withdraw Funds
      .addCase(withdrawFromMt5Account.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(withdrawFromMt5Account.fulfilled, (state, action) => {
        state.isLoading = false;
        // For .NET Core API, withdraw success means we should refresh account data
        if (action.payload?.Success) {
          console.log("Withdrawal successful - account data should be refreshed");
          // The account will be refreshed when the user data is refetched
        }
      })
      .addCase(withdrawFromMt5Account.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })

      // Refresh Profile
      .addCase(refreshMt5AccountProfile.fulfilled, (state, action) => {
        const accountData = action.payload as Partial<MT5Account> & { accountId: string };
        if (!accountData) return;
        const account = state.accounts.find(
          (acc) => acc.accountId === accountData.accountId
        );
        if (account) {
          // Merge only provided fields to avoid wiping placeholders with undefined
          Object.assign(account, accountData);
          account.lastProfileUpdateAt = Date.now();
          account.isProfileReady = isProfileComplete(account);
          console.log(`[MT5] ✅ Profile merged for ${account.accountId}. isProfileReady=${account.isProfileReady}`, {
            name: account.name,
            group: account.group,
            leverage: account.leverage,
            balance: account.balance,
            equity: account.equity,
          });

          // Calculate total balance from Live accounts only
          state.totalBalance = state.accounts
            .filter((acc) => (acc.accountType || 'Live') === 'Live')
            .reduce(
              (sum, acc) => sum + (acc.equity || 0),
              0
            );
        }
      })
      .addCase(refreshMt5AccountProfile.rejected, (state, action) => {
        state.error = action.payload as string;
        console.warn(`[MT5] ❌ refreshMt5AccountProfile rejected:`, action.payload);
      });
  },
});

// --------------------
// Exports
// --------------------
export const { setSelectedAccount, clearError, updateAccountBalance, updateAccountName, updateAccountLeverage, resetForNewClient, addAccountOptimistically, updateAccountFromWebSocket } =
  mt5AccountSlice.actions;
export default mt5AccountSlice.reducer;