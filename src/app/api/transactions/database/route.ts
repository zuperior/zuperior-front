import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(req: NextRequest) {
  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5001/api";

  try {
    // Get query parameters
    const { searchParams } = new URL(req.url);
    const accountId = searchParams.get("accountId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!accountId) {
      return NextResponse.json(
        { success: false, message: "Account ID is required" },
        { status: 400 }
      );
    }

    // Get authorization token from request headers
    const token = req.headers.get("authorization")?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    // Build query string
    const queryParams = new URLSearchParams({ accountId });
    if (startDate) queryParams.append("startDate", startDate);
    if (endDate) queryParams.append("endDate", endDate);

    // Call backend API
    const response = await axios.get(
      `${backendBase}/transactions/database?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Database Transactions API AxiosError:", error.response?.data || error.message);
      const status = error.response?.status || 500;
      return NextResponse.json(
        {
          success: false,
          message: "Failed to retrieve transactions",
          error: error.response?.data || error.message,
        },
        { status }
      );
    }

    if (error instanceof Error) {
      console.error("Database Transactions API Error:", error.message);
      return NextResponse.json(
        {
          success: false,
          message: "Unexpected error occurred",
          error: error.message,
        },
        { status: 500 }
      );
    }

    console.error("Unknown error during database transactions API call");
    return NextResponse.json(
      {
        success: false,
        message: "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

