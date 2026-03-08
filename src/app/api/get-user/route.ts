import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const BACKEND_API_URL = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5001/api';

export async function POST(req: NextRequest) {
  const bodyText = await req.text();
  const params = new URLSearchParams(bodyText);

  const request = params.get("request");
  const email = params.get("email");
  const access_token = params.get("access_token");

  if (!request || !email || !access_token) {
    return NextResponse.json(
      { message: "Missing required fields." },
      { status: 400 }
    );
  }

  try {
    // Call the new backend server's user endpoint
    const response = await axios.post(
      `${BACKEND_API_URL}/user/get-user`,
      {
        request,
        email,
        access_token,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${access_token}`,
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Backend API AxiosError:",
        error.response?.data || error.message
      );
      return NextResponse.json(
        {
          message: "Failed to fetch user from backend",
          error: error.response?.data || error.message,
        },
        { status: error.response?.status || 500 }
      );
    } else if (error instanceof Error) {
      console.error("Backend API Error:", error.message);
      return NextResponse.json(
        {
          message: "Unexpected error occurred",
          error: error.message,
        },
        { status: 500 }
      );
    } else {
      console.error("Unknown error during backend API call");
      return NextResponse.json(
        {
          message: "Unknown error occurred",
        },
        { status: 500 }
      );
    }
  }
}
