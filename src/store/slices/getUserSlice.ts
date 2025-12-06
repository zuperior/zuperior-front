// store/slices/getUserSlice.ts
import { User } from "@/types/user-details";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { setAccounts, setBalance } from "./accountsSlice";
import { setAddressVerified, setDocumentVerified, setKycFromDatabase } from "./kycSlice";

interface UserState {
  data: Omit<User, "tp_accounts_last_snapshot_info"> | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  data: null,
  loading: false,
  error: null,
};

export const getUser = createAsyncThunk<
  User,
  { email: string; access_token: string }
>(
  "user/getUser",
  async ({ email, access_token }, { rejectWithValue, dispatch, getState }) => {
    try {
      const response = await axios.post(
        "/api/get-user",
        new URLSearchParams({
          request: "GetUserDetailsByEmail",
          email,
          access_token,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      if (response.data?.status !== "Success") {
        return rejectWithValue("Failed to fetch user");
      }

      const userData = response.data.data[0] as User;

      // ✅ Separate account data and dispatch it
      const { tp_accounts_last_snapshot_info, ...rest } = userData;
      dispatch(setAccounts(tp_accounts_last_snapshot_info));

      // Set KYC verification statuses
      if (userData.verification_status === "Verified") {
        dispatch(setDocumentVerified(true));
        dispatch(setAddressVerified(true));
        dispatch(setKycFromDatabase({
          isDocumentVerified: true,
          isAddressVerified: true,
          verificationStatus: "verified"
        }));
      } else if (userData.verification_status === "Partially Verified") {
        // Assuming document is verified if partially verified
        dispatch(setDocumentVerified(true));
        dispatch(setAddressVerified(false));
        dispatch(setKycFromDatabase({
          isDocumentVerified: true,
          isAddressVerified: false,
          verificationStatus: "partial"
        }));
      } else {
        dispatch(setDocumentVerified(false));
        dispatch(setAddressVerified(false));
        dispatch(setKycFromDatabase({
          isDocumentVerified: false,
          isAddressVerified: false,
          verificationStatus: "unverified"
        }));
      }

      // Use getState from thunk API instead of importing store directly
      const state = getState() as any;
      const balance =
        state.accounts?.data?.filter((acc: any) => acc?.account_type === "Live")
          ?.reduce((sum: number, acc: any) => sum + Number(acc?.balance ?? 0), 0) ?? 0;

      dispatch(setBalance(balance));

      return rest as User; // only user details without accounts
    } catch (error) {
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : "An unknown error occurred";
      return rejectWithValue(errorMessage);
    }
  }
);

const getUserSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUser: (state) => {
      state.data = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearUser } = getUserSlice.actions;
export default getUserSlice.reducer;
