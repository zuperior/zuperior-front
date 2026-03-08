import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  const backendBase =
    process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:5001/api";

  try {
    let payload: Record<string, string | undefined> = {};

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else {
      const bodyText = await req.text();
      if (bodyText) {
        const params = new URLSearchParams(bodyText);
        payload = Object.fromEntries(params.entries());
      }
    }

    const { account_number, request = "GetTransactions" } = payload;

    if (!account_number) {
      return NextResponse.json(
        { message: "Missing required fields." },
        { status: 400 }
      );
    }

    const response = await axios.post(
      `${backendBase}/transactions/get`,
      {
        request,
        account_number,
        start_date: payload.start_date,
        end_date: payload.end_date,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("Transactions API AxiosError:", error.response?.data || error.message);
      const status = error.response?.status || 500;
      return NextResponse.json(
        {
          message: "Failed to retrieve transactions",
          error: error.response?.data || error.message,
        },
        { status }
      );
    }

    if (error instanceof Error) {
      console.error("Transactions API Error:", error.message);
      return NextResponse.json(
        {
          message: "Unexpected error occurred",
          error: error.message,
        },
        { status: 500 }
      );
    }

    console.error("Unknown error during transactions API call");
    return NextResponse.json(
      {
        message: "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
