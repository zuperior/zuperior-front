import { KYCState } from "@/types/kyc";
import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import { getKycStatus } from "@/services/kycService";

const initialState: KYCState = {
  isDocumentVerified: false,
  isAddressVerified: false,
  verificationStatus: "unverified",
};

// Async thunk to fetch KYC status from database
export const fetchKycStatus = createAsyncThunk(
  "kyc/fetchStatus",
  async (forceRefresh: boolean = false, { rejectWithValue }) => {
    try {
      const response = await getKycStatus(forceRefresh);
      if (response.success && response.data) {
        return {
          isDocumentVerified: response.data.isDocumentVerified,
          isAddressVerified: response.data.isAddressVerified,
          verificationStatus: response.data.verificationStatus,
        };
      }
      return initialState;
    } catch (error) {
      // Silently fail - return initial state instead of blocking
      console.warn("KYC status fetch failed, using default:", error);
      return initialState;
    }
  }
);

const kycSlice = createSlice({
  name: "kyc",
  initialState,
  reducers: {
    setDocumentVerified: (state, action: PayloadAction<boolean>) => {
      state.isDocumentVerified = action.payload;
      state.verificationStatus = getVerificationStatus(
        state.isDocumentVerified,
        state.isAddressVerified
      );
    },
    setAddressVerified: (state, action: PayloadAction<boolean>) => {
      state.isAddressVerified = action.payload;
      state.verificationStatus = getVerificationStatus(
        state.isDocumentVerified,
        state.isAddressVerified
      );
    },
    setKycFromDatabase: (state, action: PayloadAction<{
      isDocumentVerified: boolean;
      isAddressVerified: boolean;
      verificationStatus: string;
    }>) => {
      state.isDocumentVerified = action.payload.isDocumentVerified;
      state.isAddressVerified = action.payload.isAddressVerified;
      state.verificationStatus = mapDatabaseStatusToLocal(action.payload.verificationStatus);
    },
    resetKYC: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchKycStatus.fulfilled, (state, action) => {
        state.isDocumentVerified = action.payload.isDocumentVerified;
        state.isAddressVerified = action.payload.isAddressVerified;
        state.verificationStatus = mapDatabaseStatusToLocal(action.payload.verificationStatus);
      })
      .addCase(fetchKycStatus.rejected, (state) => {
        // On error, keep the default initial state
        console.warn("KYC status fetch rejected, using defaults");
      });
  },
});

const getVerificationStatus = (
  isDocumentVerified: boolean,
  isAddressVerified: boolean
): "unverified" | "partial" | "verified" => {
  if (isDocumentVerified && isAddressVerified) return "verified";
  if (isDocumentVerified || isAddressVerified) return "partial";
  return "unverified";
}

// Map database verification status to local state
const mapDatabaseStatusToLocal = (dbStatus: string): "unverified" | "partial" | "verified" => {
  const normalizedStatus = dbStatus.toLowerCase();
  
  if (normalizedStatus === "verified") return "verified";
  if (normalizedStatus === "partially verified" || normalizedStatus === "partial") return "partial";
  if (normalizedStatus === "pending" || normalizedStatus === "declined") return "unverified";
  
  return "unverified";
}

export const {
  setDocumentVerified,
  setAddressVerified,
  setKycFromDatabase,
  resetKYC,
} = kycSlice.actions;

export default kycSlice.reducer;
