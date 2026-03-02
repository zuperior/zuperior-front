// tokenThunk.ts
import { createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchAccessToken = createAsyncThunk<
  string,
  void,
  { rejectValue: string }
>("token/fetchAccessToken", async (_, { rejectWithValue }) => {
  try {
    const response = await axios.post("/api/access-token", null, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // Check if response has error indicator
    if (response.data?.success === false || response.data?.error) {
      const errorMsg = response.data?.message || response.data?.error || "Failed to fetch token";
      console.error("Access token API error:", response.data);
      return rejectWithValue(errorMsg);
    }

    if (!response.data?.access_token) {
      console.error("Access token not returned from API:", response.data);
      return rejectWithValue("Access token not returned");
    }

    return response.data.access_token;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to fetch token";
      console.error("Axios error in fetchAccessToken:", errorMessage);
      return rejectWithValue(errorMessage);
    } else if (error instanceof Error) {
      return rejectWithValue(error.message);
    } else {
      return rejectWithValue("Unknown error occurred");
    }
  }
});
